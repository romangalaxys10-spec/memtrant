import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateUser } from '@/lib/auth'
import { encryptSecret, encryptionAvailable } from '@/lib/crypto'
import { ghGetLogin, ghRepoExists, ghCreatePrivateRepo, validateRepoAccess, ghPutFile, GhCtx } from '@/lib/github-store'

const REPO_NAME_RE = /^[A-Za-z0-9._-]{1,100}$/

// GET ?username=x → { paired, repo }
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'Username query parameter required' }, { status: 400 })
  const user = await db.user.findUnique({ where: { username } })
  return NextResponse.json({ paired: !!user?.githubRepo, repo: user?.githubRepo ?? null })
}

// POST { username, repo, token } → validate + pair
export async function POST(req: NextRequest) {
  try {
    if (!encryptionAvailable) {
      return NextResponse.json({ error: 'Server missing APP_SECRET — pairing disabled' }, { status: 503 })
    }
    const body = await req.json()
    const { username, repo, token } = body
    if (!username || !repo || !token || typeof token !== 'string') {
      return NextResponse.json({ error: 'username, repo and token required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { username } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Token must be the user's own (or their agent-of-record) — simplest guard:
    // require a valid login token in the request too.
    const auth = await authenticateUser(req)
    if (!auth || auth.user.id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repoName = String(repo).trim().replace(/^.*\//, '')
    if (!REPO_NAME_RE.test(repoName)) {
      return NextResponse.json({ error: 'Invalid repo name' }, { status: 400 })
    }

    const login = await ghGetLogin(token.trim())
    if (!login) {
      return NextResponse.json({ error: 'Token rejected by GitHub — check it is valid and not expired' }, { status: 400 })
    }
    const fullRepo = `${login}/${repoName}`
    const ctx: GhCtx = { repo: fullRepo, token: token.trim() }

    if (!(await ghRepoExists(ctx)) && !(await ghCreatePrivateRepo(repoName, token.trim()))) {
      return NextResponse.json({ error: 'Could not create the private repo — token needs repo creation permission' }, { status: 400 })
    }

    if (!(await validateRepoAccess(ctx))) {
      return NextResponse.json({ error: 'Token cannot push to that repo — grant Contents: Read and write' }, { status: 400 })
    }

    // Best-effort scaffold so the repo shows up with context
    await ghPutFile(ctx, 'README.md', Buffer.from('# MemTrant Brain\n\nMemories synced from MemTrant (https://memtrant.vercel.app).\n'), 'memtrant: scaffold')

    await db.user.update({
      where: { id: user.id },
      data: { githubRepo: fullRepo, githubTokenEnc: encryptSecret(token.trim()) },
    })

    return NextResponse.json({ success: true, repo: fullRepo })
  } catch (error: any) {
    console.error('GitHub pair error:', error?.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE { username } → unpair
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { username } = body
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })
  const auth = await authenticateUser(req)
  if (!auth || auth.user.username !== username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await db.user.update({
    where: { username },
    data: { githubRepo: null, githubTokenEnc: null },
  })
  return NextResponse.json({ success: true })
}
