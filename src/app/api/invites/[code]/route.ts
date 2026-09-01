import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateAgentToken } from '@/lib/token'

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params

    const invite = await db.invite.findFirst({
      where: { code },
      include: { team: true },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.status === 'used') {
      return NextResponse.json({ error: 'Invite already used' }, { status: 410 })
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    }

    const response: any = {
      id: invite.id,
      code: invite.code,
      type: invite.type,
      role: invite.role,
      teamSlug: invite.team.slug,
      teamName: invite.team.name,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    }

    // For human type, also return credentials
    if (invite.type === 'human' && invite.credentials) {
      response.credentials = JSON.parse(invite.credentials)
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Get invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const body = await req.json()
    const { name, role: bodyRole } = body

    const invite = await db.invite.findFirst({
      where: { code },
      include: { team: true },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite.status === 'used') {
      return NextResponse.json({ error: 'Invite already used' }, { status: 410 })
    }

    if (invite.status !== 'active') {
      return NextResponse.json({ error: 'Invite is not active' }, { status: 400 })
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    }

    // Increment use count
    const newUseCount = invite.useCount + 1
    const isNowUsed = newUseCount >= (invite.maxUses || 1)

    if (invite.type === 'agent') {
      if (!name) {
        return NextResponse.json({ error: 'Agent name required' }, { status: 400 })
      }

      const token = generateAgentToken()
      const agentRole = bodyRole || invite.role || 'member'

      const agent = await db.agent.create({
        data: {
          name,
          role: agentRole,
          token,
          teamId: invite.teamId,
        },
      })

      // Update invite
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
        token: agent.token,
      })
    }

    if (invite.type === 'human') {
      // Mark invite as claimed
      await db.invite.update({
        where: { id: invite.id },
        data: {
          useCount: newUseCount,
          status: isNowUsed ? 'used' : 'claimed',
        },
      })

      // Return credentials
      const creds = invite.credentials ? JSON.parse(invite.credentials) : null
      return NextResponse.json({
        username: creds?.username,
        loginToken: creds?.loginToken,
      })
    }

    return NextResponse.json({ error: 'Invalid invite type' }, { status: 400 })
  } catch (error: any) {
    console.error('Claim invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
