import crypto from 'crypto'

// AES-256-GCM encryption for users' paired GitHub tokens, mirroring MemBox.
// Key derives from APP_SECRET; ciphertext format: iv.tag.data (base64 parts).
const SALT = 'memtrant-github-pair'

function getKey(): Buffer | null {
  const secret = process.env.APP_SECRET || ''
  if (secret.length < 16) return null
  return crypto.scryptSync(secret, SALT, 32)
}

export const encryptionAvailable = getKey() !== null

export function encryptSecret(plain: string): string {
  const key = getKey()
  if (!key) throw new Error('APP_SECRET not configured')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join('.')
}

export function decryptSecret(enc: string): string {
  const key = getKey()
  if (!key) throw new Error('APP_SECRET not configured')
  const [ivB64, tagB64, dataB64] = enc.split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('malformed ciphertext')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}
