import { randomBytes } from 'crypto'

export function generateToken(prefix = 'mt_'): string {
  return prefix + randomBytes(32).toString('hex')
}

export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(8)
  let slug = ''
  for (let i = 0; i < bytes.length; i++) {
    slug += chars[bytes[i] % chars.length]
  }
  return slug
}

export function generateAgentToken(): string {
  return 'agt_' + randomBytes(24).toString('hex')
}

export function generateInviteCode(): string {
  return 'inv_' + randomBytes(16).toString('hex')
}
