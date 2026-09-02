import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken, generateSlug } from '@/lib/token'
import { ensureTeamDir } from '@/lib/storage'
import { authenticateAny } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateAny(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine which userId to filter by
    let userId: string
    if (auth.type === 'user') {
      userId = auth.user.id
    } else {
      userId = auth.team.userId
    }

    const teams = await db.team.findMany({
      where: { userId },
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
    const auth = await authenticateAny(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Team name required' }, { status: 400 })
    }

    // Determine the user ID
    let userId: string
    if (auth.type === 'user') {
      userId = auth.user.id
    } else {
      userId = auth.team.userId
    }

    const slug = generateSlug()
    const ownerToken = generateToken('mt_')

    await ensureTeamDir(slug)

    const team = await db.team.create({
      data: {
        name,
        slug,
        ownerToken,
        userId,
        description: description || null,
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
