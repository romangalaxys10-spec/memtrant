import { promises as fs } from 'fs'
import path from 'path'
import { scheduleFilesFlush } from './ghdb'
import { ghPutFile, ghGetFile, GhCtx } from './github-store'

// Vercel's filesystem is read-only except /tmp; locally fall back to ./data
const BASE_PATH = process.env.STORAGE_PATH || (process.env.VERCEL ? '/tmp/memtrant-data' : './data/memtrant')

export function getTeamPath(slug: string): string {
  return path.join(BASE_PATH, slug)
}

export function getFilePath(slug: string, filePath: string): string {
  const sanitized = filePath.split('/').filter(Boolean).join('/').replace(/\.{2,}/g, '')
  return path.join(BASE_PATH, slug, sanitized)
}

// Relative key inside a user's paired repo — the storage ctx prefix already
// carries the "memtrant" root, the team slug comes first here.
function relKey(slug: string, filePath: string): string {
  const sanitized = filePath.split('/').filter(Boolean).join('/').replace(/\.{2,}/g, '')
  return `${slug}/${sanitized}`
}

export async function ensureTeamDir(slug: string): Promise<void> {
  await fs.mkdir(getTeamPath(slug), { recursive: true })
}

export async function listTeamFiles(slug: string, dirPath = ''): Promise<{ name: string; type: 'file' | 'directory'; size?: number; modified?: string }[]> {
  const target = dirPath ? getFilePath(slug, dirPath) : getTeamPath(slug)
  try {
    const entries = await fs.readdir(target, { withFileTypes: true })
    const results: { name: string; type: 'file' | 'directory'; size?: number; modified?: string }[] = []
    for (const entry of entries) {
      const fullPath = path.join(target, entry.name)
      if (entry.isDirectory()) {
        results.push({ name: entry.name, type: 'directory' })
      } else {
        const stat = await fs.stat(fullPath)
        results.push({
          name: entry.name,
          type: 'file',
          size: stat.size,
          modified: stat.mtime.toISOString()
        })
      }
    }
    return results.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  } catch {
    return []
  }
}

export async function readFileContent(slug: string, filePath: string, ctx?: GhCtx | null): Promise<string | null> {
  const rel = relKey(slug, filePath)
  if (ctx) {
    const remote = await ghGetFile(ctx, rel)
    if (remote !== null) return remote.toString('utf-8')
  }
  try {
    return await fs.readFile(getFilePath(slug, filePath), 'utf-8')
  } catch {
    return null
  }
}

export async function writeFileContent(slug: string, filePath: string, content: string, ctx?: GhCtx | null): Promise<void> {
  const target = getFilePath(slug, filePath)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content, 'utf-8')
  if (ctx) await ghPutFile(ctx, relKey(slug, filePath), Buffer.from(content, 'utf-8'), `memtrant(${slug}): write ${filePath}`)
  scheduleFilesFlush()
}

export async function writeFileBinary(slug: string, filePath: string, buffer: Buffer, ctx?: GhCtx | null): Promise<void> {
  const target = getFilePath(slug, filePath)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, buffer)
  if (ctx) await ghPutFile(ctx, relKey(slug, filePath), buffer, `memtrant(${slug}): upload ${filePath}`)
  scheduleFilesFlush()
}

export async function readFileBinary(slug: string, filePath: string, ctx?: GhCtx | null): Promise<Buffer | null> {
  const rel = relKey(slug, filePath)
  if (ctx) {
    const remote = await ghGetFile(ctx, rel)
    if (remote !== null) return remote
  }
  try {
    return await fs.readFile(getFilePath(slug, filePath))
  } catch {
    return null
  }
}

export async function deleteFileOrDir(slug: string, filePath: string): Promise<boolean> {
  try {
    await fs.rm(getFilePath(slug, filePath), { recursive: true, force: true })
    scheduleFilesFlush()
    return true
  } catch {
    return false
  }
}

export async function getTeamSize(slug: string): Promise<number> {
  let totalSize = 0
  async function walk(dir: string) {
    try {
      for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await walk(fullPath)
        } else {
          totalSize += (await fs.stat(fullPath)).size
        }
      }
    } catch {}
  }
  await walk(getTeamPath(slug))
  return totalSize
}

export async function deleteTeamDir(slug: string): Promise<void> {
  await fs.rm(getTeamPath(slug), { recursive: true, force: true })
  scheduleFilesFlush()
}
