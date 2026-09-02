import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateAny } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateAny(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || (auth.type === 'user' ? team.userId !== auth.user.id : team.ownerToken !== auth.token)) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const instructions = await db.instruction.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json({ instructions })
  } catch (error: any) {
    console.error('List instructions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateAny(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || (auth.type === 'user' ? team.userId !== auth.user.id : team.ownerToken !== auth.token)) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const body = await req.json()
    const { title, content, assigneeId, priority } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    }

    const instruction = await db.instruction.create({
      data: {
        title,
        content,
        priority: priority || 'normal',
        ...(assigneeId && { assigneeId }),
        teamId: team.id,
      },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json({ instruction }, { status: 201 })
  } catch (error: any) {
    console.error('Create instruction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
