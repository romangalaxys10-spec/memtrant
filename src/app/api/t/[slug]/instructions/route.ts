import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateAgent } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateAgent(req)
    if (!auth || auth.team.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Filter instructions by agent token: return global + agent-specific
    const instructions = await db.instruction.findMany({
      where: {
        teamId: auth.team.id,
        OR: [
          { agentId: null },
          { agentId: auth.agent.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ instructions })
  } catch (error: any) {
    console.error('Agent get instructions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateAgent(req)
    if (!auth || auth.team.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only lead agents can create instructions
    if (auth.agent.role !== 'lead') {
      return NextResponse.json({ error: 'Only lead agents can create instructions' }, { status: 403 })
    }

    const body = await req.json()
    const { title, content, agentId } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    }

    const instruction = await db.instruction.create({
      data: {
        title,
        content,
        agentId: agentId || null,
        creatorId: auth.agent.id,
        teamId: auth.team.id,
      },
    })

    return NextResponse.json({ instruction }, { status: 201 })
  } catch (error: any) {
    console.error('Agent create instruction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}