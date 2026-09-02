import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

// Serverless platforms (Vercel) have a read-only filesystem except /tmp, so
// when DATABASE_URL points there, seed it from the bundled SQLite file on cold start.
const dbUrl = process.env.DATABASE_URL ?? ''
if (dbUrl.startsWith('file:/tmp/')) {
  const target = dbUrl.slice('file:'.length)
  if (!fs.existsSync(target)) {
    const bundled = path.join(process.cwd(), 'db', 'custom.db')
    if (fs.existsSync(bundled)) {
      try {
        fs.copyFileSync(bundled, target)
      } catch (e) {
        console.error('Failed to seed SQLite db into /tmp:', e)
      }
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
