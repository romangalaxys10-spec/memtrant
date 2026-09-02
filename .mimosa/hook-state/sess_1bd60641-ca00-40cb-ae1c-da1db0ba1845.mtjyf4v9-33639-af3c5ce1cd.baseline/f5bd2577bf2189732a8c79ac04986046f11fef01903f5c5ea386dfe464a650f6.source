import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateAny } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    const { slug, id } = await params
    const auth = await authenticateAny(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || (auth.type === 'user' ? team.userId !== auth.user.id : team.ownerToken !== auth.token)) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const instruction = await db.instruction.findFirst({
      where: { id, teamId: team.id },
    })

    if (!instruction) {
      return NextResponse.json({ error: 'Instruction not found' }, { status: 404 })
    }

    return NextResponse.json({ instruction })
  } catch (error: any) {
    console.error('Get instruction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    const { slug, id } = await params
    const auth = await authenticateAny(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || (auth.type === 'user' ? team.userId !== auth.user.id : team.ownerToken !== auth.token)) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const body = await req.json()
    const { title, content, assigneeId } = body

    const instruction = await db.instruction.update({
      where: { id, teamId: team.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(assigneeId !== undefined && { assigneeId }),
      },
    })

    return NextResponse.json({ instruction })
  } catch (error: any) {
    console.error('Update instruction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    const { slug, id } = await params
    const auth = await authenticateAny(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || (auth.type === 'user' ? team.userId !== auth.user.id : team.ownerToken !== auth.token)) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    await db.instruction.delete({ where: { id, teamId: team.id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete instruction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
