import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateUser } from '@/lib/auth'
import { listTeamFiles, readFileContent } from '@/lib/storage'
import { storageCtxForTeam } from '@/lib/user-storage'

// Data explorer: everything the logged-in user owns, readable from wherever
// it lives (their paired GitHub repo, or the global archive).

// Flatten up to 3 levels of directories into file entries with full paths.
async function listFilesFlat(slug: string, ctx: Awaited<ReturnType<typeof storageCtxForTeam>>) {
  const out: { name: string; type: 'file' | 'directory'; size?: number }[] = []
  async function walk(dir: string, depth: number) {
    const entries = await listTeamFiles(slug, dir, ctx)
    for (const e of entries) {
      const full = dir ? `${dir}/${e.name}` : e.name
      if (e.type === 'directory') {
        if (depth < 3) await walk(full, depth + 1)
      } else {
        out.push({ ...e, name: full })
      }
    }
  }
  await walk('', 0)
  return out
}

// GET → { teams: [{ slug, name, createdAt, files: [...] }] }
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const teams = await db.team.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
    })

    const result = await Promise.all(
      teams.map(async (team) => {
        const ctx = await storageCtxForTeam(team.slug)
        const files = await listFilesFlat(team.slug, ctx)
        return {
          slug: team.slug,
          name: team.name,
          createdAt: team.createdAt,
          source: ctx ? 'paired-repo' : 'global-archive',
          files,
        }
      })
    )

    return NextResponse.json({ teams: result })
  } catch (error: any) {
    console.error('Explorer list error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET file content: /api/explorer/file?slug=x&path=notes/a.txt
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { slug, path: filePath } = body
    if (!slug || !filePath) return NextResponse.json({ error: 'slug and path required' }, { status: 400 })

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || team.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const ctx = await storageCtxForTeam(slug)
    const content = await readFileContent(slug, filePath, ctx)
    if (content === null) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    return NextResponse.json({ slug, path: filePath, content })
  } catch (error: any) {
    console.error('Explorer file error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
