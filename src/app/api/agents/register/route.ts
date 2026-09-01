import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateAgentToken } from '@/lib/token'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { inviteCode, name, role: bodyRole } = body

    if (!inviteCode || !name) {
      return NextResponse.json({ error: 'inviteCode and name required' }, { status: 400 })
    }

    // Validate invite
    const invite = await db.invite.findFirst({
      where: { code: inviteCode },
      include: { team: true },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.status !== 'active') {
      return NextResponse.json({ error: 'Invite is not active' }, { status: 400 })
    }

    if (invite.type !== 'agent') {
      return NextResponse.json({ error: 'This invite is not for agents' }, { status: 400 })
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    }

    const token = generateAgentToken()
    const role = bodyRole || invite.role || 'member'

    const agent = await db.agent.create({
      data: {
        name,
        role,
        token,
        teamId: invite.teamId,
      },
    })

    // Update invite usage
    const newUseCount = invite.useCount + 1
    const isNowUsed = newUseCount >= (invite.maxUses || 1)
    await db.invite.update({
      where: { id: invite.id },
      data: {
        useCount: newUseCount,
        status: isNowUsed ? 'used' : 'active',
      },
    })

    return NextResponse.json({
      agentId: agent.id,
      name: agent.name,
      role: agent.role,
      token: agent.token,
      teamSlug: invite.team.slug,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Agent register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
