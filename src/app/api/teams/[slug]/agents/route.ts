import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateTeam } from '@/lib/auth'
import { generateAgentToken } from '@/lib/token'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateTeam(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || team.ownerToken !== auth.token) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const agents = await db.agent.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ agents })
  } catch (error: any) {
    console.error('List agents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateTeam(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || team.ownerToken !== auth.token) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, role } = body

    if (!name) {
      return NextResponse.json({ error: 'Agent name required' }, { status: 400 })
    }

    // Enforce one lead agent per team
    if (role === 'lead') {
      const existingLead = await db.agent.findFirst({
        where: { teamId: team.id, role: 'lead' },
      })
      if (existingLead) {
        return NextResponse.json({ error: 'Team already has a lead agent' }, { status: 409 })
      }
    }

    const token = generateAgentToken()

    const agent = await db.agent.create({
      data: {
        name,
        role: role || 'member',
        token,
        teamId: team.id,
      },
    })

    return NextResponse.json({ success: true, agent }, { status: 201 })
  } catch (error: any) {
    console.error('Create agent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
