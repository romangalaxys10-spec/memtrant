import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateUser } from '@/lib/auth'
import { listTeamFiles } from '@/lib/storage'
import { storageCtxForTeam } from '@/lib/user-storage'

// List a team's memory files (dir listing) for the logged-in owner.
// GET /api/teams/[slug]/files?path=notes
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateUser(req)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || team.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const dirPath = req.nextUrl.searchParams.get('path') || ''
    const ctx = await storageCtxForTeam(slug)
    const files = await listTeamFiles(slug, dirPath, ctx)
    return NextResponse.json({ files })
  } catch (error: any) {
    console.error('List files error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
