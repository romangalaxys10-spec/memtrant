import { NextRequest } from 'next/server'
import { db } from './db'

export async function authenticateTeam(req: NextRequest): Promise<{ team: any; token: string } | null> {
  const auth = req.headers.get('authorization') || req.headers.get('x-memtrant-token') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null

  const team = await db.team.findFirst({ where: { ownerToken: token } })
  return team ? { team, token } : null
}

export async function authenticateAgent(req: NextRequest): Promise<{ agent: any; team: any } | null> {
  const auth = req.headers.get('authorization') || req.headers.get('x-memtrant-token') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null

  const agent = await db.agent.findFirst({ where: { token }, include: { team: true } })
  return agent ? { agent, team: agent.team } : null
}
