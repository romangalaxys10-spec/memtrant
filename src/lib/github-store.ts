// GitHub Contents-API driver for users' paired private repos (BYO storage).
// Mirrors MemBox's github-store.ts. Only ever talks to https://api.github.com.
// Credentials arrive per-call in GhCtx — never from user-supplied URLs.

const API_BASE = 'https://api.github.com'
const REPO_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,80}\/[A-Za-z0-9._-]{1,100}$/
const BRANCH_RE = /^[A-Za-z0-9._/-]{1,120}$/
const PATH_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,200}$/

export interface GhCtx {
  repo: string // owner/name
  token: string
  branch?: string
  prefix?: string // folder inside the repo, e.g. "memtrant/<slug>"
}

function assertCtx(ctx: GhCtx) {
  if (!REPO_SLUG_RE.test(ctx.repo)) throw new Error('invalid repo slug')
  if (ctx.branch && !BRANCH_RE.test(ctx.branch)) throw new Error('invalid branch')
}

async function api(ctx: GhCtx, repoPath: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  assertCtx(ctx)
  if (!PATH_RE.test(repoPath)) throw new Error('invalid repo path')
  const url = new URL(`${API_BASE}/repos/${ctx.repo}/contents/${repoPath}`)
  if (ctx.branch) url.searchParams.set('ref', ctx.branch)
  const res = await fetch(url, {
    ...init,
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'memtrant-user-storage',
      ...(init?.headers || {}),
    },
  })
  return { status: res.status, body: await res.json().catch(() => null) }
}

function remoteKey(ctx: GhCtx, key: string): string {
  return ctx.prefix ? `${ctx.prefix}/${key}` : key
}

/** Verify a token and return the login (owner) it belongs to. */
export async function ghGetLogin(token: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/user`, {
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'memtrant-user-storage',
    },
  })
  if (!res.ok) return null
  const body = await res.json().catch(() => null)
  return body?.login ?? null
}

export async function ghRepoExists(ctx: GhCtx): Promise<boolean> {
  const r = await api(ctx, '')
  return r.status === 200
}

export async function ghCreatePrivateRepo(name: string, token: string): Promise<boolean> {
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(name)) throw new Error('invalid repo name')
  const res = await fetch(`${API_BASE}/user/repos`, {
    method: 'POST',
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'memtrant-user-storage',
    },
    body: JSON.stringify({ name, private: true, auto_init: false }),
  })
  // 422 = already exists, which is fine
  return res.status === 201 || res.status === 422
}

export async function ghPutFile(
  ctx: GhCtx,
  key: string,
  content: Buffer,
  message: string
): Promise<boolean> {
  const repoPath = remoteKey(ctx, key)
  const existing = await api(ctx, repoPath)
  const sha = existing.status === 200 ? existing.body?.sha : undefined
  const res = await api(ctx, repoPath, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: content.toString('base64'),
      branch: ctx.branch,
      sha,
    }),
  })
  return res.status === 200 || res.status === 201
}

export async function ghGetFile(ctx: GhCtx, key: string): Promise<Buffer | null> {
  const res = await api(ctx, remoteKey(ctx, key))
  if (res.status !== 200 || !res.body?.content) return null
  return Buffer.from(res.body.content, 'base64')
}

/** Confirm the token can push to the repo. */
export async function validateRepoAccess(ctx: GhCtx): Promise<boolean> {
  assertCtx(ctx)
  const url = new URL(`${API_BASE}/repos/${ctx.repo}`)
  const res = await fetch(url, {
    redirect: 'error',
    headers: {
      Authorization: `Bearer ${ctx.token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'memtrant-user-storage',
    },
  })
  if (!res.ok) return false
  const body = await res.json().catch(() => null)
  return !!body?.permissions?.push
}
