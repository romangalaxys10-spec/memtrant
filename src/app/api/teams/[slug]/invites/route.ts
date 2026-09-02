import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateAny } from '@/lib/auth'
import { generateInviteCode, generateSlug, generateToken } from '@/lib/token'

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

    const invites = await db.invite.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ invites })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
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
    const { type, role, expiresIn } = body
    if (!type || !['agent', 'human'].includes(type)) {
      return NextResponse.json({ error: "Type must be 'agent' or 'human'" }, { status: 400 })
    }
    const code = generateInviteCode()
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : null
    let credentials: string | null = null
    if (type === 'human') {
      const randomSuffix = generateSlug().slice(0, 6)
      const username = `user_${randomSuffix}`
      const loginToken = 'login_' + generateToken('')
      const newUser = await db.user.create({ data: { username, loginToken } })
      credentials = JSON.stringify({ username: newUser.username, loginToken: newUser.loginToken })
    }
    const invite = await db.invite.create({
      data: {
        code, type, role: role || null, teamId: team.id, createdById: team.userId,
        expiresAt, credentials, maxUses: 1, useCount: 0, status: 'active',
      },
    })
    return NextResponse.json({ invite, code }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
