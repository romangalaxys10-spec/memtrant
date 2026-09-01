import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent } from '@/lib/auth'
import { listTeamFiles } from '@/lib/storage'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateAgent(req)
    if (!auth || auth.team.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dirPath = req.nextUrl.searchParams.get('dir') || ''
    const files = await listTeamFiles(slug, dirPath)

    return NextResponse.json({ files })
  } catch (error: any) {
    console.error('List memories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
