import { PrismaClient } from '@prisma/client'
import { initSync, scheduleDbFlush } from './ghdb'

// The real client is created only after the GitHub-backed store has been
// hydrated (initSync sets DATABASE_URL to the downloaded SQLite file).
const globalForPrisma = globalThis as unknown as {
  prismaReady?: Promise<PrismaClient>
}

function getClient(): Promise<PrismaClient> {
  if (!globalForPrisma.prismaReady) {
    globalForPrisma.prismaReady = initSync().then(
      () =>
        new PrismaClient({
          log: ['error', 'warn'],
        })
    )
  }
  return globalForPrisma.prismaReady
}

// Async-initializing proxy: every method call waits for hydration, then runs
// on the real client. Any call schedules a GitHub commit; the sync layer
// diffs the file (size + mtime) and skips it when nothing changed.
type AnyRecord = Record<string | symbol, any>

function lazyModel(model: string): AnyRecord {
  return new Proxy({} as AnyRecord, {
    get(_t, method: string) {
      return async (...callArgs: unknown[]) => {
        const client = await getClient()
        const result = await (client as AnyRecord)[model][method](...callArgs)
        scheduleDbFlush()
        return result
      }
    },
  })
}

export const db: PrismaClient = new Proxy({} as unknown as PrismaClient, {
  get(_t, model: string | symbol) {
    if (typeof model !== 'string' || model.startsWith('$')) {
      // $connect, $disconnect, $on, etc.
      return async (...callArgs: unknown[]) => {
        const client = await getClient()
        return (client as AnyRecord)[model](...callArgs)
      }
    }
    return lazyModel(model)
  },
}) as PrismaClient
