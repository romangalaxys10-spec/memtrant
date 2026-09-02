import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateUser } from '@/lib/auth'
import { readFileContent } from '@/lib/storage'
import { storageCtxForTeam } from '@/lib/user-storage'

// Read one memory file's content for the logged-in owner.
// GET /api/teams/[slug]/files/content?path=notes/a.txt
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateUser(req)
    if (!auth) return new NextResponse('Unauthorized', { status: 401 })

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || team.userId !== auth.user.id) {
      return new NextResponse('Team not found', { status: 404 })
    }

    const filePath = req.nextUrl.searchParams.get('path') || ''
    if (!filePath) return new NextResponse('path required', { status: 400 })

    const ctx = await storageCtxForTeam(slug)
    const content = await readFileContent(slug, filePath, ctx)
    if (content === null) return new NextResponse('File not found', { status: 404 })
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Read file error:', error?.message)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
