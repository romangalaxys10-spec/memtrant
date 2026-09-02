import { PrismaClient } from '@prisma/client'
import { initSync, scheduleDbFlush } from './ghdb'

// Hydrate the SQLite file from the GitHub-backed store before the client
// connects (top-level await runs once per serverless instance).
await initSync()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const baseClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

// After any model call, schedule a GitHub commit; the sync layer diffs the
// file (size + mtime) and skips the commit when nothing actually changed.
const db = baseClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query: runModel }) {
        const result = await runModel(args)
        scheduleDbFlush()
        return result
      },
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = baseClient

export { db }
