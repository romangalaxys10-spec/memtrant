import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken, generateSlug } from '@/lib/token'
import { ensureTeamDir } from '@/lib/storage'
import { authenticateTeam } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateTeam(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use the authenticated token's team - list teams the user owns
    // The token is the ownerToken, so the team found is the user's team
    const teams = await db.team.findMany({
      where: { ownerToken: auth.token },
      include: {
        _count: {
          select: { agents: true, instructions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ teams })
  } catch (error: any) {
    console.error('List teams error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateTeam(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, userId: username } = body

    if (!name) {
      return NextResponse.json({ error: 'Team name required' }, { status: 400 })
    }

    // Look up user by username, then use user.id for FK
    let ownerId = auth.team.userId
    if (username) {
      const user = await db.user.findUnique({ where: { username } })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      ownerId = user.id
    }

    const slug = generateSlug()
    const ownerToken = generateToken('mt_')

    await ensureTeamDir(slug)

    const team = await db.team.create({
      data: {
        name,
        slug,
        ownerToken,
        userId: ownerId,
      },
      include: {
        agents: true,
        instructions: true,
      },
    })

    return NextResponse.json({ success: true, team }, { status: 201 })
  } catch (error: any) {
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
