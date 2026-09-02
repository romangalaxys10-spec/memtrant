import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateUser } from '@/lib/auth'

// Per-agent data explorer: everything stored for/about one agent.

// POST { slug, agentId } → { agent, assigned, created }
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { slug, agentId } = body
    if (!slug || !agentId) return NextResponse.json({ error: 'slug and agentId required' }, { status: 400 })

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || team.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const agent = await db.agent.findFirst({ where: { id: agentId, teamId: team.id } })
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const assigned = await db.instruction.findMany({
      where: { assigneeId: agent.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const created = await db.instruction.findMany({
      where: { creatorId: agent.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      agent: { id: agent.id, name: agent.name, role: agent.role, status: agent.status, lastSeen: agent.lastSeen },
      assigned: assigned.map((i) => ({ id: i.id, title: i.title, status: i.status, priority: i.priority })),
      created: created.map((i) => ({ id: i.id, title: i.title, status: i.status })),
    })
  } catch (error: any) {
    console.error('Agent explorer error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
