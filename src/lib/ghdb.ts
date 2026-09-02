import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
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
const FILES_TAR = path.join(os.tmpdir(), 'memtrant-files.tar.gz')

const DB_REPO_PATH = 'data/custom.db'
const FILES_REPO_PATH = 'data/files.tar.gz'

interface Pair {
  localPath: string
  repoPath: string
  sha: string | null
  timer: ReturnType<typeof setTimeout> | null
  inFlight: Promise<void> | null
  pending: boolean
  attempts: number
  lastSynced: string | null // "size:mtimeMs" of the file at last successful sync
}

function newPair(localPath: string, repoPath: string): Pair {
  return { localPath, repoPath, sha: null, timer: null, inFlight: null, pending: false, attempts: 0, lastSynced: null }
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

function ghApi(pair: Pair, init?: RequestInit): Promise<{ status: number; body: any }> {
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
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))
}

function writeLocal(pair: Pair, base64: string) {
  fs.mkdirSync(path.dirname(pair.localPath), { recursive: true })
  fs.writeFileSync(pair.localPath, Buffer.from(base64, 'base64'))
}

async function hydratePair(pair: Pair, bootstrap?: () => void): Promise<void> {
  const res = await ghApi(pair)
  if (res.status === 200 && res.body?.content) {
    pair.sha = res.body.sha
    writeLocal(pair, res.body.content)
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
        else console.error('ghdb flush task failed permanently:', (e as Error).message)
      }
    })()
  )
}

function listTarEntries(tarPath: string): Promise<string[] | null> {
  return new Promise((resolve) => {
    execFile('tar', ['-tzf', tarPath], (err, stdout) => {
      resolve(err ? null : stdout.split('\n').filter(Boolean))
    })
  })
}

function extractFilesTar() {
  fs.mkdirSync(FILES_DIR, { recursive: true })
  return new Promise<void>((resolve) => {
    listTarEntries(FILES_TAR).then((entries) => {
      if (entries === null) return resolve()
      // Refuse anything that could escape FILES_DIR: absolute paths, '..' segments,
      // or link entries (shown as 'link -> target' in the listing)
      const malicious = entries.some(
        (e) => e.startsWith('/') || e.split('/').includes('..') || e.includes('->')
      )
      if (malicious) {
        console.error('ghdb: refusing unsafe archive entries')
        return resolve()
      }
      execFile('tar', ['-xzf', FILES_TAR, '-C', FILES_DIR], (err) => {
        if (err) console.error('ghdb tar extract failed:', err.message)
        resolve()
      })
    })
  })
}

function createFilesTar(): Promise<void> {
  return new Promise((resolve) => {
    fs.mkdirSync(FILES_DIR, { recursive: true })
    execFile('tar', ['-czf', FILES_TAR, '-C', FILES_DIR, '.'], (err) => {
      if (err) console.error('ghdb tar create failed:', err.message)
      resolve()
    })
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

  pairs.files = newPair(FILES_TAR, FILES_REPO_PATH)
  try {
    await hydratePair(pairs.files)
    await extractFilesTar()
  } catch (e) {
    console.error('ghdb files hydrate skipped:', (e as Error).message)
    fs.mkdirSync(FILES_DIR, { recursive: true })
  }
}

export function scheduleDbFlush() {
  schedule('db')
}

// The files "live data" is a directory, not a single file: rebuild the tarball
// right before flushing it.
export function scheduleFilesFlush() {
  schedule('files', 3000, createFilesTar)
}

// Best-effort flush if the instance is being recycled
process.on('beforeExit', () => {
  schedule('db', 0)
  scheduleFilesFlush()
})
