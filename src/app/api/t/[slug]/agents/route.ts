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

    const agents = await db.agent.findMany({
      where: { teamId: auth.team.id },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        lastSeen: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ agents })
  } catch (error: any) {
    console.error('Agent list agents error:', error)
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

    // Update last seen (heartbeat)
    await db.agent.update({
      where: { id: auth.agent.id },
      data: { lastSeen: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Agent heartbeat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}