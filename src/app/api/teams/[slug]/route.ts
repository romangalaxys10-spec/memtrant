import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateTeam } from '@/lib/auth'
import { listTeamFiles, getTeamSize, deleteTeamDir } from '@/lib/storage'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const auth = await authenticateTeam(req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const team = await db.team.findUnique({
      where: { slug },
      include: {
        agents: true,
        instructions: {
          orderBy: { createdAt: 'desc' },
        },
        invites: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!team || team.ownerToken !== auth.token) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const files = await listTeamFiles(slug)
    const storageBytes = await getTeamSize(slug)

    return NextResponse.json({ team, files, storageBytes })
  } catch (error: any) {
    console.error('Get team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

    // Delete invites first (FK constraint)
    await db.invite.deleteMany({ where: { teamId: team.id } })
    // Delete instructions
    await db.instruction.deleteMany({ where: { teamId: team.id } })
    // Delete agents
    await db.agent.deleteMany({ where: { teamId: team.id } })
    // Delete team
    await db.team.delete({ where: { id: team.id } })
    // Delete storage
    await deleteTeamDir(slug)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
