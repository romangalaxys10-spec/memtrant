import fs from 'fs'
import path from 'path'
import os from 'os'
import { gzipSync, gunzipSync } from 'zlib'
import { waitUntil } from '@vercel/functions'

// GitHub-as-database: persists the SQLite file and the memory-file uploads to
// the private memtrant-brain repo. On cold start we hydrate local /tmp copies
// from the repo; after writes we commit changes back (debounced).
// Consistency model is last-write-wins — GitHub has no transactions.

const REPO = process.env.GH_DB_REPO || ''
const TOKEN = process.env.GH_DB_TOKEN || ''
const BRANCH = process.env.GH_DB_BRANCH || 'main'
// Pinned host — the only remote endpoint this module may ever talk to.
const API_BASE = 'https://api.github.com'
// Operator-supplied repo slug must be strictly "owner/repo"; blocks path
// traversal and any attempt to redirect the request at another host/path.
const REPO_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,80}\/[A-Za-z0-9._-]{1,100}$/
const BRANCH_RE = /^[A-Za-z0-9._\/-]{1,120}$/
const ENABLED = !!(REPO && TOKEN && REPO_RE.test(REPO) && BRANCH_RE.test(BRANCH))
export const DB_LOCAL_PATH = path.join(os.tmpdir(), 'memtrant.db')
export const FILES_DIR = path.join(os.tmpdir(), 'memtrant-data')
const FILES_ARCHIVE = path.join(os.tmpdir(), 'memtrant-files.json.gz')

const DB_REPO_PATH = 'data/custom.db'
const FILES_REPO_PATH = 'data/files.json.gz'

interface Pair {
  localPath: string
  repoPath: string
  sha: string | null
  timer: ReturnType<typeof setTimeout> | null
  inFlight: Promise<void> | null
  pending: boolean
  attempts: number
  lastSynced: string | null // "size:mtimeMs" of the file at last successful sync
  etag: string | null // GitHub ETag of the last hydrated version
}

function newPair(localPath: string, repoPath: string): Pair {
  return { localPath, repoPath, sha: null, timer: null, inFlight: null, pending: false, attempts: 0, lastSynced: null, etag: null }
}

const pairs: Record<string, Pair> = {}

function fileSignature(p: string): string | null {
  try {
    const st = fs.statSync(p)
    return `${st.size}:${Math.round(st.mtimeMs)}`
  } catch {
    return null
  }
}

function ghApi(pair: Pair, init?: RequestInit): Promise<{ status: number; body: any; etag: string | null }> {
  const url = new URL(`${API_BASE}/repos/${REPO}/contents/${pair.repoPath}`)
  url.searchParams.set('ref', BRANCH)
  return fetch(url, {
    ...init,
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'memtrant-ghdb',
      ...(init?.headers || {}),
    },
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null), etag: r.headers.get('etag') }))
}

function writeLocal(pair: Pair, base64: string) {
  fs.mkdirSync(path.dirname(pair.localPath), { recursive: true })
  fs.writeFileSync(pair.localPath, Buffer.from(base64, 'base64'))
}

async function hydratePair(pair: Pair, bootstrap?: () => void): Promise<void> {
  const res = await ghApi(pair)
  if (res.status === 200 && res.body?.content) {
    writeLocal(pair, res.body.content)
    pair.sha = res.body.sha
    pair.etag = res.etag
    pair.lastSynced = fileSignature(pair.localPath)
    return
  }
  if (res.status === 404 && bootstrap) {
    // First ever run: seed the repo file from the app bundle
    bootstrap()
    await flushPair(pair, 'bootstrap')
    return
  }
  throw new Error(`ghdb hydrate failed: ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`)
}

// Other serverless instances may have committed newer data since this one
// hydrated. Cheap conditional check (ETag → 304 when unchanged); pull the
// fresh file only when someone else changed it. Called before reads.
export async function refreshDbIfChanged(): Promise<void> {
  if (!ENABLED) return
  const pair = pairs.db
  if (!pair || pair.inFlight) return
  try {
    const res = await ghApi(pair, pair.etag ? { headers: { 'If-None-Match': pair.etag } } : undefined)
    if (res.status === 200 && res.body?.content) {
      writeLocal(pair, res.body.content)
      pair.sha = res.body.sha
      pair.etag = res.etag
      pair.lastSynced = fileSignature(pair.localPath)
    }
    // 304 → our copy is current, nothing to do
  } catch (e) {
    console.error('ghdb refresh failed:', errMsg(e))
  }
}

async function putContents(pair: Pair, content: string, label: string): Promise<{ status: number; body: any }> {
  const url = new URL(`${API_BASE}/repos/${REPO}/contents/${pair.repoPath}`)
  return fetch(url, {
    method: 'PUT',
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'memtrant-ghdb',
    },
    body: JSON.stringify({
      message: `ghdb: ${label} ${pair.repoPath}`,
      content,
      sha: pair.sha || undefined,
      branch: BRANCH,
    }),
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))
}

async function flushPair(pair: Pair, label = 'sync'): Promise<void> {
  if (!fs.existsSync(pair.localPath)) return
  const signature = fileSignature(pair.localPath)
  if (signature === null || signature === pair.lastSynced) return // nothing changed
  const content = fs.readFileSync(pair.localPath).toString('base64')

  let res = await putContents(pair, content, label)
  if (res.status === 409) {
    // sha moved (another instance committed): re-read sha, last-write-wins
    const latest = await ghApi(pair)
    pair.sha = latest.status === 200 ? latest.body.sha : null
    res = await putContents(pair, content, label)
  }

  if (res.status === 200 || res.status === 201) {
    pair.sha = res.body?.content?.sha ?? pair.sha
    pair.attempts = 0
    pair.lastSynced = signature
  } else if (res.status >= 500 || res.status === 403 || res.status === 0) {
    // transient: retry with backoff (give up after 3 tries)
    if (++pair.attempts <= 3) schedule(pair === pairs.db ? 'db' : 'files', 5000 * pair.attempts)
    else console.error(`ghdb flush giving up (${pair.repoPath}) after retries`)
  } else {
    console.error(`ghdb flush failed (${pair.repoPath}):`, res.status, JSON.stringify(res.body).slice(0, 200))
  }
}

function schedule(name: 'db' | 'files', delayMs = 1500, before?: () => Promise<void>) {
  if (!ENABLED) return
  const pair = pairs[name]
  if (!pair) return
  if (pair.timer) clearTimeout(pair.timer)
  // Debounce marker: the newest schedule() owns the flush; older waiters see
  // the timer set and bail.
  pair.timer = setTimeout(() => {
    pair.timer = null
  }, delayMs)
  // waitUntil must be called synchronously during the request to keep the
  // serverless instance alive — callbacks queued via setTimeout never run
  // after the response is sent on Vercel.
  waitUntil(
    (async () => {
      await new Promise((r) => setTimeout(r, delayMs))
      if (pair.timer) return // superseded by a newer schedule()
      try {
        if (before) await before()
        if (pair.inFlight) {
          // a write happened mid-flight — run another pass when this one lands
          pair.pending = true
          return
        }
        pair.inFlight = flushPair(pair).finally(() => {
          pair.inFlight = null
          if (pair.pending) {
            pair.pending = false
            schedule(name, 0, before)
          }
        })
        await pair.inFlight
      } catch (e) {
        // network-level failure: flushPair only classifies HTTP errors, so
        // retry here with backoff (cap at 3 attempts)
        if (++pair.attempts <= 3) schedule(name, 5000 * pair.attempts, before)
        else console.error('ghdb flush task failed permanently:', errMsg(e))
      }
    })()
  )
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// Archive format: gzip of JSON [{ path, content(base64) }]. Own format means
// we control extraction safety — no tar/symlink/path-traversal surprises.
function walkFiles(dir: string, base = ''): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...walkFiles(path.join(dir, entry.name), rel))
    else if (entry.isFile()) out.push(rel)
  }
  return out
}

function createFilesArchive(): Promise<void> {
  return new Promise((resolve) => {
    try {
      fs.mkdirSync(FILES_DIR, { recursive: true })
      const entries = walkFiles(FILES_DIR).map((rel) => ({
        path: rel,
        content: fs.readFileSync(path.join(FILES_DIR, rel)).toString('base64'),
      }))
      fs.writeFileSync(FILES_ARCHIVE, gzipSync(Buffer.from(JSON.stringify(entries))))
    } catch (e) {
      console.error('ghdb archive create failed:', errMsg(e))
    }
    resolve()
  })
}

function extractFilesArchive(): Promise<void> {
  return new Promise((resolve) => {
    try {
      fs.mkdirSync(FILES_DIR, { recursive: true })
      const root = path.resolve(FILES_DIR)
      const entries: { path: string; content: string }[] = JSON.parse(
        gunzipSync(fs.readFileSync(FILES_ARCHIVE)).toString()
      )
      for (const e of entries) {
        // Defense in depth: refuse absolute paths and traversal even though
        // we produce the archives ourselves; verify the resolved target stays
        // inside FILES_DIR.
        if (typeof e.path !== 'string' || e.path.startsWith('/') || e.path.split('/').includes('..')) continue
        const target = path.resolve(root, e.path)
        if (target !== root && !target.startsWith(root + path.sep)) continue
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, Buffer.from(e.content, 'base64'))
      }
    } catch (e) {
      console.error('ghdb archive extract failed:', errMsg(e))
    }
    resolve()
  })
}

// Must run before the Prisma client is constructed so DATABASE_URL points at
// the hydrated file.
export async function initSync(): Promise<void> {
  if (!ENABLED) return

  pairs.db = newPair(DB_LOCAL_PATH, DB_REPO_PATH)
  await hydratePair(pairs.db, () => {
    const bundled = path.join(process.cwd(), 'db', 'custom.db')
    if (fs.existsSync(bundled)) fs.copyFileSync(bundled, DB_LOCAL_PATH)
  })
  process.env.DATABASE_URL = `file:${DB_LOCAL_PATH}`

  pairs.files = newPair(FILES_ARCHIVE, FILES_REPO_PATH)
  try {
    await hydratePair(pairs.files)
    await extractFilesArchive()
  } catch (e) {
    console.error('ghdb files hydrate skipped:', errMsg(e))
    fs.mkdirSync(FILES_DIR, { recursive: true })
  }
}

export function scheduleDbFlush() {
  schedule('db')
}

// The files "live data" is a directory, not a single file: rebuild the archive
// right before flushing it.
export function scheduleFilesFlush() {
  schedule('files', 3000, createFilesArchive)
}

// Best-effort flush if the instance is being recycled
process.on('beforeExit', () => {
  schedule('db', 0)
  scheduleFilesFlush()
})
