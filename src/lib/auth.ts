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

export async function authenticateUser(req: NextRequest): Promise<{ user: any; token: string } | null> {
  const auth = req.headers.get('authorization') || req.headers.get('x-memtrant-token') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null

  const user = await db.user.findFirst({ where: { loginToken: token } })
  return user ? { user, token } : null
}

/**
 * Flexible auth that supports both user login tokens and team owner tokens.
 * Returns { type: 'user', user, token } or { type: 'team', team, token } or null.
 */
export async function authenticateAny(req: NextRequest): Promise<
  | { type: 'user'; user: any; token: string }
  | { type: 'team'; team: any; token: string }
  | null
> {
  const auth = req.headers.get('authorization') || req.headers.get('x-memtrant-token') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null

  // Try user auth (login_ prefix or any loginToken)
  const user = await db.user.findFirst({ where: { loginToken: token } })
  if (user) return { type: 'user', user, token }

  // Try team owner auth
  const team = await db.team.findFirst({ where: { ownerToken: token } })
  if (team) return { type: 'team', team, token }

  return null
}
