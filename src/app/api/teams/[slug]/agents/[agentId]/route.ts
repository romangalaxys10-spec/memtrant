import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateTeam } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; agentId: string }> }) {
  try {
    const { slug, agentId } = await params
    const auth = await authenticateTeam(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || team.ownerToken !== auth.token) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const agent = await db.agent.findFirst({
      where: { id: agentId, teamId: team.id },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error('Get agent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string; agentId: string }> }) {
  try {
    const { slug, agentId } = await params
    const auth = await authenticateTeam(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || team.ownerToken !== auth.token) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, role, status } = body

    // Enforce one lead agent per team when promoting to lead
    if (role === 'lead') {
      const existingLead = await db.agent.findFirst({
        where: { teamId: team.id, role: 'lead', id: { not: agentId } },
      })
      if (existingLead) {
        return NextResponse.json({ error: 'Team already has a lead agent' }, { status: 409 })
      }
    }

    const agent = await db.agent.update({
      where: { id: agentId, teamId: team.id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(status && { status }),
      },
    })

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error('Update agent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string; agentId: string }> }) {
  try {
    const { slug, agentId } = await params
    const auth = await authenticateTeam(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({ where: { slug } })
    if (!team || team.ownerToken !== auth.token) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    await db.agent.delete({ where: { id: agentId, teamId: team.id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete agent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
