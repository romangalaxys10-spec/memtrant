import { db } from './db'
import { decryptSecret } from './crypto'
import { GhCtx } from './github-store'

// Resolve a paired GitHub storage context for a team, based on the team
// owner's pairing. Returns null when the owner hasn't paired a repo.
export async function storageCtxForTeam(slug: string): Promise<GhCtx | null> {
  try {
    const team = await db.team.findUnique({ where: { slug } })
    if (!team) return null
    const user = await db.user.findUnique({ where: { id: team.userId } })
    if (!user?.githubRepo || !user.githubTokenEnc) return null
    const token = decryptSecret(user.githubTokenEnc)
    return { repo: user.githubRepo, token, prefix: `memtrant/${slug}` }
  } catch {
    return null
  }
}
