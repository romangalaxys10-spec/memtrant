'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Lang, LANGUAGES, isRTL, getTimeAgo, useT } from '@/lib/i18n'

// ── Types ──────────────────────────────────────────────────────────────────
type View = 'landing' | 'auth' | 'dashboard' | 'team'
type TeamTab = 'overview' | 'agents' | 'memory' | 'instructions' | 'invites' | 'api'
type AgentRole = 'lead' | 'worker' | 'observer'
type InstructionStatus = 'pending' | 'in_progress' | 'done' | 'failed'
type InstructionPriority = 'low' | 'normal' | 'high' | 'urgent'

// ── Interfaces ─────────────────────────────────────────────────────────────
interface Team {
  id: string; slug: string; name: string; description: string | null;
  ownerToken: string; userId: string; createdAt: string;
  fileCount?: number; totalSize?: number;
  _count?: { agents: number; instructions: number };
}
interface Agent {
  id: string; name: string; role: string; token: string; status: string;
  lastSeen: string; createdAt: string;
  _count?: { assignedInstructions: number; createdInstructions: number };
}
interface Instruction {
  id: string; title: string; content: string; status: string; priority: string;
  assigneeId: string | null; creatorId: string; teamId: string;
  createdAt: string; updatedAt: string;
  assignee?: { id: string; name: string; role: string } | null;
}
interface FileEntry { name: string; type: 'file' | 'directory'; size?: number; modified?: string }
interface Invite {
  id: string; code: string; type: string; role: string | null; status: string;
  credentials: string | null; createdAt: string; expiresAt: string | null;
  useCount: number; maxUses: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
}

// ── Constants ──────────────────────────────────────────────────────────────
const priorityColors: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  normal: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
}
const statusColors: Record<string, string> = {
  pending: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  in_progress: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
}
const roleIcons: Record<string, string> = { lead: '👑', worker: '⚙️', observer: '👁️' }
const statusIcons: Record<string, string> = { idle: '🟢', working: '🔵', offline: '⚫' }
const API = ''

// ── Apple-style spring physics ────────────────────────────────────────
const spring = { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 }
const springGentle = { type: 'spring' as const, stiffness: 250, damping: 25, mass: 1 }
const springBounce = { type: 'spring' as const, stiffness: 500, damping: 28, mass: 0.6 }
const easeApple = [0.16, 1, 0.3, 1] as [number, number, number, number]
const easeSmooth = [0.25, 0.1, 0.25, 1] as [number, number, number, number]

// ── Stagger container for children ──────────────────────────────────────
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}
const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeApple } },
}
const staggerItemSlow = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeApple } },
}

const modalOverlay = {
  initial: { opacity: 0, backdropFilter: 'blur(0px)' },
  animate: { opacity: 1, backdropFilter: 'blur(12px)' },
  exit: { opacity: 0, backdropFilter: 'blur(0px)' },
  transition: { duration: 0.35, ease: easeSmooth },
}
const modalContent = {
  initial: { opacity: 0, scale: 0.92, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 20 },
  transition: { ...spring, stiffness: 350, damping: 28 },
}

// ── Animated Counter Component ──────────────────────────────────────────
function AnimatedCounter({ target, duration = 1.5, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, target, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

// ── Section Reveal Wrapper ──────────────────────────────────────────
function SectionReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: easeApple, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Feature Card with Mouse Spotlight ───────────────────────────────
function SpotlightCard({ icon, title, desc, delay = 0 }: { icon: string; title: string; desc: string; delay?: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    cardRef.current?.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    cardRef.current?.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }, [])
  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      variants={staggerItemSlow}
      whileHover={{ y: -6, transition: springGentle }}
      whileTap={{ scale: 0.98, transition: spring }}
      className="apple-feature-card apple-glass rounded-2xl p-7 text-center hover:border-white/[0.12] transition-colors duration-300 group cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-4xl mb-4 transition-transform duration-500 group-hover:scale-110 drop-shadow-lg">{icon}</div>
      <div className="text-sm font-semibold text-zinc-100 tracking-[-0.01em] mb-2">{title}</div>
      <div className="text-xs text-zinc-500 leading-relaxed">{desc}</div>
    </motion.div>
  )
}

// ── GitHub Pair Card ────────────────────────────────────────────────────────
function GithubPairCard({ username, loginToken }: { username: string; loginToken: string }) {
  const [open, setOpen] = useState(false)
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [pairedRepo, setPairedRepo] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!username) return
    fetch(`/api/auth/github?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((d) => setPairedRepo(d.repo || null))
      .catch(() => {})
  }, [username])

  async function pair() {
    setStatus('working')
    setMessage('')
    try {
      const res = await fetch('/api/auth/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
        body: JSON.stringify({ username, repo: repo.trim(), token: token.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setPairedRepo(data.repo)
        setToken('')
        setOpen(false)
        setMessage('')
        setStatus('idle')
      } else {
        setStatus('error')
        setMessage(data.error || 'Pairing failed')
      }
    } catch {
      setStatus('error')
      setMessage('Network error')
    }
  }

  async function unpair() {
    try {
      const res = await fetch('/api/auth/github', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
        body: JSON.stringify({ username }),
      })
      if (res.ok) setPairedRepo(null)
    } catch {}
  }

  return (
    <div className="apple-glass rounded-2xl p-5 mb-8 border border-white/[0.08]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl">🔗</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">GitHub Brain</span>
              <span className="text-[10px] uppercase tracking-wide text-zinc-500 border border-white/[0.08] rounded-full px-2 py-0.5">optional</span>
            </div>
            {pairedRepo ? (
              <p className="text-xs text-emerald-400 font-mono truncate mt-0.5">🟢 {pairedRepo}</p>
            ) : (
              <p className="text-xs text-zinc-500 mt-0.5">Store your team memories in your own private GitHub repo</p>
            )}
          </div>
        </div>
        {pairedRepo ? (
          <div className="flex items-center gap-2">
            <a
              href={`https://github.com/${pairedRepo}/commits`}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-zinc-200"
            >View commits</a>
            <button onClick={unpair} className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-red-400">Unpair</button>
          </div>
        ) : (
          <button onClick={() => setOpen((o) => !o)} className="text-xs px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 text-white font-semibold">
            {open ? 'Cancel' : 'Pair your repo'}
          </button>
        )}
      </div>

      {open && !pairedRepo && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
          <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
            <li>Create a <span className="text-zinc-300">private</span> repo: <a className="text-emerald-400 hover:underline" href="https://github.com/new" target="_blank" rel="noreferrer">github.com/new</a></li>
            <li>Create a token (fine-grained): <a className="text-emerald-400 hover:underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">github.com/settings/personal-access-tokens/new</a> — select your repo, set <span className="text-zinc-300">Contents: Read and write</span></li>
            <li>Paste the repo name and token below</li>
          </ol>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="my-memtrant-brain (repo name)"
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40"
            />
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_…"
              type="password"
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40"
            />
          </div>
          {message && <p className="text-xs text-red-400">{message}</p>}
          <button
            onClick={pair}
            disabled={status === 'working' || !repo.trim() || !token.trim()}
            className="apple-btn-primary px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'working' ? 'Validating & pairing…' : 'Pair repo'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Data Explorer Card ──────────────────────────────────────────────────────
interface ExplorerFile { name: string; type: 'file' | 'directory'; size?: number }
interface ExplorerTeam { slug: string; name: string; source: string; files: ExplorerFile[] }

function DataExplorerCard({ loginToken }: { loginToken: string }) {
  const [teams, setTeams] = useState<ExplorerTeam[]>([])
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<{ path: string; content: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/explorer', { headers: { Authorization: `Bearer ${loginToken}` } })
      if (res.ok) {
        const data = await res.json()
        setTeams(data.teams || [])
        setLoaded(true)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (loginToken) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginToken])

  async function openFile(slug: string, path: string) {
    setFileContent({ path, content: 'Loading…' })
    try {
      const res = await fetch('/api/explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
        body: JSON.stringify({ slug, path }),
      })
      const data = await res.json()
      setFileContent(res.ok ? { path, content: data.content } : { path, content: data.error || 'Failed to load' })
    } catch {
      setFileContent({ path, content: 'Network error' })
    }
  }

  return (
    <div className="apple-glass rounded-2xl p-5 mb-8 border border-white/[0.08]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xl">🗂</span>
          <div>
            <span className="text-sm font-semibold text-zinc-100">Data Explorer</span>
            <p className="text-xs text-zinc-500 mt-0.5">Browse the memories stored per team — straight from the source of truth</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 disabled:opacity-40">
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {loaded && teams.length === 0 && (
        <p className="text-xs text-zinc-600 mt-4">No teams yet — create one to start storing memories.</p>
      )}

      <div className="mt-4 space-y-2">
        {teams.map((team) => (
          <div key={team.slug} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <button
              onClick={() => { setOpenSlug(openSlug === team.slug ? null : team.slug); setFileContent(null) }}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-zinc-200">{team.name}</span>
                <span className="text-[10px] text-zinc-600 font-mono ml-2">{team.slug}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 border ${team.source === 'paired-repo' ? 'text-emerald-400 border-emerald-500/20' : 'text-zinc-500 border-white/[0.08]'}`}>
                  {team.source === 'paired-repo' ? '🔗 paired repo' : '📦 archive'}
                </span>
                <span className="text-xs text-zinc-500">{team.files.filter((f) => f.type === 'file').length} files</span>
                <span className="text-zinc-600 text-xs">{openSlug === team.slug ? '▾' : '▸'}</span>
              </div>
            </button>
            {openSlug === team.slug && (
              <div className="border-t border-white/[0.06] px-4 py-3">
                {team.files.length === 0 && <p className="text-xs text-zinc-600">No files yet.</p>}
                <ul className="space-y-1">
                  {team.files.map((f) => (
                    <li key={f.name}>
                      {f.type === 'file' ? (
                        <button
                          onClick={() => openFile(team.slug, f.name)}
                          className={`text-xs font-mono hover:text-emerald-400 transition-colors ${fileContent?.path === f.name ? 'text-emerald-400' : 'text-zinc-400'}`}
                        >
                          📄 {f.name}{f.size !== undefined && <span className="text-zinc-600 ml-2">{f.size} B</span>}
                        </button>
                      ) : (
                        <span className="text-xs font-mono text-zinc-500">📁 {f.name}/</span>
                      )}
                    </li>
                  ))}
                </ul>
                {fileContent && (
                  <div className="mt-3 rounded-lg bg-black/40 border border-white/[0.06] p-3 overflow-x-auto max-h-64 overflow-y-auto">
                    <div className="text-[10px] text-zinc-600 font-mono mb-1">{fileContent.path}</div>
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">{fileContent.content}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Agent Data Section (inside agent modal) ────────────────────────────────
function AgentDataSection({ loginToken, teamSlug, agentId }: { loginToken: string; teamSlug: string; agentId: string }) {
  const [data, setData] = useState<{ assigned: { title: string; status: string }[]; created: { title: string; status: string }[] } | null>(null)
  const [files, setFiles] = useState<{ name: string; size?: number }[]>([])
  const [open, setOpen] = useState(false)
  const [fileContent, setFileContent] = useState<{ path: string; content: string } | null>(null)

  useEffect(() => {
    fetch('/api/explorer/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
      body: JSON.stringify({ slug: teamSlug, agentId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData({ assigned: d.assigned || [], created: d.created || [] }))
      .catch(() => {})
    fetch('/api/explorer', { headers: { Authorization: `Bearer ${loginToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const team = (d?.teams || []).find((t: any) => t.slug === teamSlug)
        setFiles(team ? team.files : [])
      })
      .catch(() => {})
  }, [loginToken, teamSlug, agentId])

  async function openFile(path: string) {
    setFileContent({ path, content: 'Loading…' })
    try {
      const res = await fetch('/api/explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
        body: JSON.stringify({ slug: teamSlug, path }),
      })
      const d = await res.json()
      setFileContent(res.ok ? { path, content: d.content } : { path, content: d.error || 'Failed to load' })
    } catch {
      setFileContent({ path, content: 'Network error' })
    }
  }

  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-2">🗂 Data & Tasks</h3>
      {data && (data.assigned.length > 0 || data.created.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wide text-zinc-600 mb-1.5">Assigned to agent</div>
            <ul className="space-y-1">
              {data.assigned.map((t, i) => (
                <li key={i} className="text-xs text-zinc-300 truncate">
                  <span className={t.status === 'done' ? 'text-emerald-400' : 'text-amber-400'}>●</span> {t.title}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wide text-zinc-600 mb-1.5">Created by agent</div>
            <ul className="space-y-1">
              {data.created.map((t, i) => (
                <li key={i} className="text-xs text-zinc-300 truncate">✏️ {t.title}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
        <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-left">
          <span className="text-xs text-zinc-400">📄 Team memory files this agent can access ({files.length})</span>
          <span className="text-zinc-600 text-xs">{open ? '▾' : '▸'}</span>
        </button>
        {open && (
          <div className="mt-2">
            {files.length === 0 && <p className="text-xs text-zinc-600">No files yet.</p>}
            <ul className="space-y-1">
              {files.map((f) => (
                <li key={f.name}>
                  <button
                    onClick={() => openFile(f.name)}
                    className={`text-xs font-mono hover:text-emerald-400 transition-colors ${fileContent?.path === f.name ? 'text-emerald-400' : 'text-zinc-400'}`}
                  >
                    📄 {f.name}{f.size !== undefined && <span className="text-zinc-600 ml-2">{f.size} B</span>}
                  </button>
                </li>
              ))}
            </ul>
            {fileContent && (
              <div className="mt-2 rounded-lg bg-black/40 border border-white/[0.06] p-3 overflow-x-auto max-h-56 overflow-y-auto">
                <div className="text-[10px] text-zinc-600 font-mono mb-1">{fileContent.path}</div>
                <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">{fileContent.content}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Home Component ─────────────────────────────────────────────────────────
export default function Home() {
  // ── i18n State ─────────────────────────────────────────────────────────
  const [lang, setLang] = useState<Lang>('en')
  const t = useT(lang)
  const timeAgo = getTimeAgo(lang)

  useEffect(() => {
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  // ── View ───────────────────────────────────────────────────────────────
  const [view, setView] = useState<View>('landing')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')
  const [username, setUsername] = useState('')
  const [loginToken, setLoginToken] = useState('')
  const [tokenMode, setTokenMode] = useState<'auto' | 'custom'>('auto')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Credentials
  const [loginTokenSaved, setLoginTokenSaved] = useState('')
  const [currentLoginToken, setCurrentLoginToken] = useState('')
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [savedOfflineChecked, setSavedOfflineChecked] = useState(false)
  const [copiedFeedback, setCopiedFeedback] = useState('')

  // Teams
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)

  // Team detail
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamTab, setTeamTab] = useState<TeamTab>('overview')
  const [agents, setAgents] = useState<Agent[]>([])
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [files, setFiles] = useState<FileEntry[]>([])
  const [teamLoading, setTeamLoading] = useState(false)

  // Invites
  const [invites, setInvites] = useState<Invite[]>([])
  const [humanInviteResult, setHumanInviteResult] = useState<{ code: string; credentials: string; username: string; token: string } | null>(null)

  // Memory
  const [memoryPath, setMemoryPath] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [previewName, setPreviewName] = useState('')

  // API snippets
  const [snippetTab, setSnippetTab] = useState<'curl' | 'python' | 'nodejs'>('curl')

  // Agent detail
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  // Dialogs
  const [showNewTeam, setShowNewTeam] = useState(false)
  const [showNewAgent, setShowNewAgent] = useState(false)
  const [showNewInstruction, setShowNewInstruction] = useState(false)
  const [showNewInviteHuman, setShowNewInviteHuman] = useState(false)
  const [showNewInviteAgent, setShowNewInviteAgent] = useState(false)
  const [showToken, setShowToken] = useState(false)

  // Form state
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [teamError, setTeamError] = useState('')
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentRole, setNewAgentRole] = useState<AgentRole>('worker')
  const [newInstTitle, setNewInstTitle] = useState('')
  const [newInstContent, setNewInstContent] = useState('')
  const [newInstPriority, setNewInstPriority] = useState<InstructionPriority>('normal')
  const [newInstAssigneeId, setNewInstAssigneeId] = useState('')
  const [inviteAgentRole, setInviteAgentRole] = useState<AgentRole>('worker')
  const [inviteExpiryHours, setInviteExpiryHours] = useState('24')
  const [inviteResult, setInviteResult] = useState<{ code: string; token: string } | null>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFeedback(t('modal.copied'))
      setTimeout(() => setCopiedFeedback(''), 2000)
    })
  }

  function formatTimeAgo(date: string): string {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (s < 60) return timeAgo.justNow
    if (s < 3600) return timeAgo.minutesAgo(Math.floor(s / 60))
    if (s < 86400) return timeAgo.hoursAgo(Math.floor(s / 3600))
    return timeAgo.daysAgo(Math.floor(s / 86400))
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  const SESSION_KEY = 'memtrant_session'
  function saveSession(username: string, token: string) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ username, token })) } catch {}
  }
  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY) } catch {}
  }

  async function handleAuth() {
    setAuthError('')
    setAuthLoading(true)
    try {
      const endpoint = authMode === 'register' ? `${API}/api/auth/register` : `${API}/api/auth/login`
      const body: any = { username }
      if (authMode === 'register') {
        if (tokenMode === 'custom' && loginToken.trim()) {
          body.loginToken = loginToken.trim()
        }
      } else {
        body.loginToken = loginToken
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Auth failed')
      if (authMode === 'register') {
        setLoginTokenSaved(data.loginToken)
        setCurrentLoginToken(data.loginToken)
        setShowSignupModal(true)
        setView('dashboard')
        saveSession(username, data.loginToken)
        await loadTeams(data.loginToken)
      } else {
        setCurrentLoginToken(loginToken)
        setView('dashboard')
        saveSession(username, loginToken)
        await loadTeams(loginToken)
      }
    } catch (e: any) {
      setAuthError(e.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // Session persistence: restore login after a page refresh (validated server-side)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (!s?.username || !s?.token) return
      fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: s.username, loginToken: s.token }),
      }).then(async (res) => {
        if (!res.ok) { clearSession(); return }
        setUsername(s.username)
        setCurrentLoginToken(s.token)
        setView('dashboard')
        loadTeams(s.token)
      }).catch(() => {})
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadTeams(tokenArg?: string) {
    setTeamsLoading(true)
    try {
      const res = await fetch(`${API}/api/teams`, {
        headers: { Authorization: `Bearer ${tokenArg ?? currentLoginToken}` },
      })
      const data = await res.json()
      setTeams(Array.isArray(data) ? data : data.teams || [])
    } catch { setTeams([]) }
    finally { setTeamsLoading(false) }
  }

  // Near-real-time: re-poll teams while the dashboard is open and on focus,
  // so changes pushed by agents elsewhere show up without a manual reload.
  useEffect(() => {
    if (view !== 'dashboard' || !currentLoginToken) return
    const tick = () => {
      if (document.visibilityState === 'visible') loadTeams()
    }
    const id = setInterval(tick, 10000)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', tick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentLoginToken])

  async function handleCreateTeam() {
    setTeamError('')
    try {
      const res = await fetch(`${API}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentLoginToken}` },
        body: JSON.stringify({ name: newTeamName, description: newTeamDesc || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create team')
      setShowNewTeam(false)
      setNewTeamName('')
      setNewTeamDesc('')
      await loadTeams()
    } catch (e: any) {
      setTeamError(e.message)
    }
  }

  // ── Team Detail ──────────────────────────────────────────────────────────
  async function loadTeam(slug: string) {
    setTeamLoading(true)
    setTeamTab('overview')
    setMemoryPath('')
    setPreviewContent('')
    setPreviewName('')
    setInvites([])
    setHumanInviteResult(null)
    try {
      const authHeaders = { Authorization: `Bearer ${currentLoginToken}` }
      const [teamRes, agentRes, instRes] = await Promise.all([
        fetch(`${API}/api/teams/${slug}`, { headers: authHeaders }),
        fetch(`${API}/api/teams/${slug}/agents`, { headers: authHeaders }),
        fetch(`${API}/api/teams/${slug}/instructions`, { headers: authHeaders }),
      ])
      const teamData = await teamRes.json()
      const teamRaw = teamData.team || teamData
      setSelectedTeam({ ...teamRaw, fileCount: teamData.files?.length || 0, totalSize: teamData.storageBytes || 0 })
      const agentData = await agentRes.json()
      setAgents(Array.isArray(agentData) ? agentData : agentData.agents || [])
      const instData = await instRes.json()
      setInstructions(Array.isArray(instData) ? instData : instData.instructions || [])
    } catch { /* ignore */ }
    finally { setTeamLoading(false) }
  }

  function openTeam(team: Team) {
    setSelectedTeam(team)
    setView('team')
    loadTeam(team.slug)
  }

  // ── Agents ───────────────────────────────────────────────────────────────
  async function handleAddAgent() {
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentLoginToken}` },
        body: JSON.stringify({ name: newAgentName, role: newAgentRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShowNewAgent(false)
      setNewAgentName('')
      setAgents(prev => [...prev, data.agent || data])
    } catch (e: any) { alert(e.message) }
  }

  async function removeAgent(agentId: string) {
    if (!confirm(t('modal.confirmRemoveAgent'))) return
    try {
      await fetch(`${API}/api/teams/${selectedTeam!.slug}/agents/${agentId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${currentLoginToken}` } })
      setAgents(prev => prev.filter(a => a.id !== agentId))
    } catch { /* ignore */ }
  }

  async function updateAgentRole(agentId: string, role: string) {
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentLoginToken}` },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      const updatedAgent = data.agent || data
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ...updatedAgent } : a))
    } catch { /* ignore */ }
  }

  // ── Instructions ─────────────────────────────────────────────────────────
  async function handleCreateInstruction() {
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/instructions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentLoginToken}` },
        body: JSON.stringify({
          title: newInstTitle, content: newInstContent, priority: newInstPriority,
          assigneeId: newInstAssigneeId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShowNewInstruction(false)
      setNewInstTitle('')
      setNewInstContent('')
      setNewInstPriority('normal')
      setNewInstAssigneeId('')
      setInstructions(prev => [data.instruction || data, ...prev])
    } catch (e: any) { alert(e.message) }
  }

  async function updateInstructionStatus(id: string, status: string) {
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/instructions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentLoginToken}` },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      const updatedInst = data.instruction || data
      setInstructions(prev => prev.map(i => i.id === id ? { ...i, ...updatedInst } : i))
    } catch { /* ignore */ }
  }

  // ── Team delete ──────────────────────────────────────────────────────────
  async function deleteTeam(slug: string) {
    if (!confirm(t('modal.confirmDeleteTeam'))) return
    try {
      await fetch(`${API}/api/teams/${slug}`, { method: 'DELETE', headers: { Authorization: `Bearer ${currentLoginToken}` } })
      setTeams(prev => prev.filter(t => t.slug !== slug))
      setView('dashboard')
    } catch { /* ignore */ }
  }

  // ── Memory ───────────────────────────────────────────────────────────────
  async function browsePath(path: string) {
    setMemoryPath(path)
    setPreviewContent('')
    setPreviewName('')
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/files?path=${encodeURIComponent(path)}`, { headers: { Authorization: `Bearer ${currentLoginToken}` } })
      const data = await res.json()
      setFiles(Array.isArray(data) ? data : data.files || [])
    } catch { setFiles([]) }
  }

  async function previewFile(fileName: string) {
    const fullPath = memoryPath ? `${memoryPath}/${fileName}` : fileName
    setPreviewName(fullPath)
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/files/content?path=${encodeURIComponent(fullPath)}`, { headers: { Authorization: `Bearer ${currentLoginToken}` } })
      if (!res.ok) { setPreviewContent(`Failed to load (${res.status})`); return }
      const text = await res.text()
      setPreviewContent(typeof text === 'string' ? text : JSON.stringify(text, null, 2))
    } catch { setPreviewContent(t('modal.fileLoadError')) }
  }

  // Auto-load the file listing when the Memory tab opens (and re-sync when
  // returning to root), so it never shows a stale/empty view.
  useEffect(() => {
    if (view === 'team' && teamTab === 'memory' && selectedTeam) {
      browsePath(memoryPath)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, teamTab, selectedTeam?.slug])

  // ── Invites ──────────────────────────────────────────────────────────────
  async function loadInvites(slug: string) {
    try {
      const res = await fetch(`${API}/api/teams/${slug}/invites`, {
        headers: { Authorization: `Bearer ${currentLoginToken}` },
      })
      const data = await res.json()
      setInvites(Array.isArray(data) ? data : data.invites || [])
    } catch { setInvites([]) }
  }

  async function handleCreateInvite(type: 'agent' | 'human') {
    if (type === 'human') setShowNewInviteHuman(true)
    try {
      const body: any = { type }
      if (type === 'agent') {
        body.role = inviteAgentRole
        if (inviteExpiryHours) body.expiresIn = parseInt(inviteExpiryHours) * 3600
      }
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentLoginToken}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (type === 'human' && data.credentials) {
        let creds: any = data.credentials
        if (typeof creds === 'string') { try { creds = JSON.parse(creds) } catch { creds = { username: '', loginToken: creds } } }
        setHumanInviteResult({
          code: data.code,
          credentials: typeof data.credentials === 'string' ? data.credentials : JSON.stringify(data.credentials),
          username: creds.username || '',
          token: creds.loginToken || creds.token || '',
        })
      } else if (type === 'agent') {
        setInviteResult({ code: data.code, token: data.token || data.agentToken || '' })
      }
      setShowNewInviteAgent(false)
      setShowNewInviteHuman(false)
      await loadInvites(selectedTeam!.slug)
    } catch (e: any) { alert(e.message); setShowNewInviteHuman(false) }
  }

  // ── Download helper ──────────────────────────────────────────────────────
  function downloadAsFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Activation prompt generator ──────────────────────────────────────────
  function generateActivationPrompt(agent: Agent) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const team = selectedTeam!
    return `# MemTrant Agent Activation Prompt

You are **${agent.name}**, a ${agent.role} agent in the team **"${team.name}"**.

## Your Identity
- Name: ${agent.name}
- Role: ${agent.role}
- Team: ${team.name} (${team.slug})

## Your Authentication Token
\`\`\`
${agent.token}
\`\`\`
**NEVER** share this token. It is your unique credential for all API calls.

## MemTrant API Base URL
\`\`\`
${baseUrl}
\`\`\`

## Available API Endpoints

All requests must include the header: \`Authorization: Bearer ${agent.token}\`

### 📁 Shared Memory (File Storage)
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | /api/t/${team.slug}/memory/<path> | Store a file |
| GET | /api/t/${team.slug}/memory/<path> | Read a file |
| GET | /api/t/${team.slug}/memory/ | Browse directory |
| DELETE | /api/t/${team.slug}/memory/<path> | Delete a file |

### 📋 Instructions (Tasks)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/teams/${team.slug}/instructions | List all instructions |
| POST | /api/teams/${team.slug}/instructions | Create a new instruction |
| PATCH | /api/teams/${team.slug}/instructions/:id | Update instruction status |

### 🤖 Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/teams/${team.slug}/agents | List team agents |

## How to Work

1. **Check for instructions**: Periodically fetch your assigned tasks via \`GET /api/teams/${team.slug}/instructions\`. Look for instructions assigned to you.
2. **Read shared memory**: Use \`GET /api/t/${team.slug}/memory/<path>\` to read context files written by other agents.
3. **Write to shared memory**: Use \`PUT /api/t/${team.slug}/memory/<path>\` to store your findings, progress, or results.
4. **Update task status**: When you start working on a task, update it to \`in_progress\`. When done, set it to \`done\` (or \`failed\` if blocked).
5. **Create tasks**: If you discover new work items, create instructions for yourself or other agents.

## Example Workflow
\`\`\`bash
# Read shared context
curl -H "Authorization: Bearer ${agent.token}" \
  ${baseUrl}/api/t/${team.slug}/memory/context.md

# Write your findings
curl -X PUT -H "Authorization: Bearer ${agent.token}" \
  -d "Found 3 issues in the codebase" \
  ${baseUrl}/api/t/${team.slug}/memory/analysis/results.md

# Get your assigned tasks
curl -H "Authorization: Bearer ${agent.token}" \
  ${baseUrl}/api/teams/${team.slug}/instructions

# Update a task status
curl -X PATCH -H "Authorization: Bearer ${agent.token}" \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}' \
  ${baseUrl}/api/teams/${team.slug}/instructions/<instruction-id>
\`\`\`

## Behavior Guidelines
- Always check for new instructions before starting work.
- Store important findings in shared memory so other agents can access them.
- Update task status promptly so the team lead can track progress.
- If blocked, update the task to \`failed\` with a description of what's needed.
- Coordinate with other agents through the shared memory layer.`
  }

  // ── Team tabs ────────────────────────────────────────────────────────────
  const tabItems: { key: TeamTab; label: string; icon: string }[] = [
    { key: 'overview', label: t('team.tabOverview'), icon: '📊' },
    { key: 'agents', label: t('team.tabAgents'), icon: '🤖' },
    { key: 'memory', label: t('team.tabMemory'), icon: '🧠' },
    { key: 'instructions', label: t('team.tabInstructions'), icon: '📋' },
    { key: 'invites', label: t('team.tabInvites'), icon: '🔗' },
    { key: 'api', label: t('team.tabAPI'), icon: '⚡' },
  ]

  // ── API Snippets ─────────────────────────────────────────────────────────
  const teamSlug = selectedTeam?.slug || 'my-team'
  const apiSnippets: Record<string, string> = {
    curl: `# Store files` + '\n' + `curl -X PUT \\\n   ${API}/api/t/${teamSlug}/memory/context.md \\\n   -H "Authorization: Bearer <AGENT_TOKEN>" \\\n   -d "Shared context for the team"` + '\n\n' + `# Read files` + '\n' + `curl ${API}/api/t/${teamSlug}/memory/context.md \\\n   -H "Authorization: Bearer <AGENT_TOKEN>"` + '\n\n' + `# Browse directory` + '\n' + `curl ${API}/api/t/${teamSlug}/memory/ \\\n   -H "Authorization: Bearer <AGENT_TOKEN>"` + '\n\n' + `# Create instruction` + '\n' + `curl -X POST ${API}/api/teams/${teamSlug}/instructions \\\n   -H "Authorization: Bearer <AGENT_TOKEN>" \\\n   -H "Content-Type: application/json" \\\n   -d '{"title":"Task","content":"Do something","priority":"normal"}'`,
    python: `import requests` + '\n\n' + `BASE = "${API}"` + '\n' + `HEADERS = {"Authorization": "Bearer <AGENT_TOKEN>"}` + '\n\n' + `# Store file` + '\n' + `requests.put(f"{BASE}/api/t/${teamSlug}/memory/context.md",` + '\n' + `    headers=HEADERS, data="Shared context")` + '\n\n' + `# Read file` + '\n' + `r = requests.get(f"{BASE}/api/t/${teamSlug}/memory/context.md",` + '\n' + `    headers=HEADERS)` + '\n' + `print(r.text)` + '\n\n' + `# Browse directory` + '\n' + `r = requests.get(f"{BASE}/api/t/${teamSlug}/memory/",` + '\n' + `    headers=HEADERS)` + '\n' + `print(r.json())` + '\n\n' + `# Create instruction` + '\n' + `requests.post(f"{BASE}/api/teams/${teamSlug}/instructions",` + '\n' + `    headers={**HEADERS, "Content-Type": "application/json"},` + '\n' + `    json={"title":"Task","content":"Do something","priority":"normal"})`,
    nodejs: `const BASE = "${API}";` + '\n' + `const HEADERS = { Authorization: "Bearer <AGENT_TOKEN>" };` + '\n\n' + `// Store file` + '\n' + `await fetch(\`\${BASE}/api/t/${teamSlug}/memory/context.md\`, {` + '\n' + `  method: "PUT", headers: HEADERS, body: "Shared context"` + '\n' + `});` + '\n\n' + `// Read file` + '\n' + `const r = await fetch(\`\${BASE}/api/t/${teamSlug}/memory/context.md\`, { headers: HEADERS });` + '\n' + `console.log(await r.text());` + '\n\n' + `// Browse directory` + '\n' + `const d = await fetch(\`\${BASE}/api/t/${teamSlug}/memory/\`, { headers: HEADERS });` + '\n' + `console.log(await d.json());` + '\n\n' + `// Create instruction` + '\n' + `await fetch(\`\${BASE}/api/teams/${teamSlug}/instructions\`, {` + '\n' + `  method: "POST",` + '\n' + `  headers: { ...HEADERS, "Content-Type": "application/json" },` + '\n' + `  body: JSON.stringify({ title: "Task", content: "Do something", priority: "normal" })` + '\n' + `});`,
  }

  // ── Language Selector ────────────────────────────────────────────────────
  // ── Language Selector ────────────────────────────────────────────────────
  const langSelector = (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeApple, delay: 0.3 }}
      className="fixed top-4 right-4 z-40"
    >
      <select
        value={lang}
        onChange={e => setLang(e.target.value as Lang)}
        className="apple-glass rounded-xl px-3 py-1.5 text-xs text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 appearance-none cursor-pointer hover:border-white/[0.15] hover:text-zinc-200 transition-all duration-300 pr-7"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.flag} {l.nativeLabel}</option>
        ))}
      </select>
    </motion.div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="dark min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      {langSelector}
      <main className="flex-1 flex flex-col">

        {/* ════════════ LANDING ════════════ */}
        {view === 'landing' && (
          <div className="flex-1 relative overflow-hidden">
            {/* ════════════ HERO SECTION ════════════ */}
            <section className="flex flex-col items-center justify-center px-6 pt-28 pb-20 md:pt-36 md:pb-28 relative overflow-hidden min-h-[90vh]">
              {/* Animated gradient orbs — Apple-style organic drift */}
              <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-emerald-500/[0.07] rounded-full blur-[180px]" style={{ animation: 'orb-drift-1 20s ease-in-out infinite' }} />
              <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-500/[0.06] rounded-full blur-[160px]" style={{ animation: 'orb-drift-2 25s ease-in-out infinite' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/[0.04] rounded-full blur-[200px]" style={{ animation: 'orb-drift-1 30s ease-in-out infinite reverse' }} />

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="apple-particle"
                    style={{
                      left: `${15 + (i * 12) % 80}%`,
                      top: `${20 + (i * 17) % 60}%`,
                      width: `${3 + (i % 3)}px`,
                      height: `${3 + (i % 3)}px`,
                      background: i % 3 === 0 ? 'rgba(16, 185, 129, 0.35)' : i % 3 === 1 ? 'rgba(6, 182, 212, 0.25)' : 'rgba(139, 92, 246, 0.2)',
                      animation: `particle-float-${(i % 3) + 1} ${12 + i * 3}s ease-in-out infinite`,
                      animationDelay: `${i * 0.8}s`,
                    }}
                  />
                ))}
              </div>

              {/* Hero content — staggered reveal */}
              <motion.div
                initial="initial" animate="animate"
                variants={{ animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
                className="relative z-10 text-center max-w-3xl"
              >
                {/* Floating brain emoji — bigger, more glow */}
                <motion.div
                  variants={{ initial: { opacity: 0, scale: 0.3, y: 30 }, animate: { opacity: 1, scale: 1, y: 0, transition: { ...springBounce, delay: 0 } } }}
                  className="text-[100px] md:text-[120px] mb-6 apple-float select-none leading-none"
                  style={{ filter: 'drop-shadow(0 0 60px rgba(16, 185, 129, 0.25))' }}
                >
                  🧠
                </motion.div>

                {/* Title — gradient shimmer */}
                <motion.h1
                  variants={{ initial: { opacity: 0, y: 30, filter: 'blur(10px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: easeApple } } }}
                  className="text-7xl md:text-9xl font-bold tracking-[-0.05em] bg-gradient-to-b from-emerald-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-6 leading-[0.9] apple-gradient-shimmer"
                >
                  MemTrant
                </motion.h1>

                {/* Subtitle — stronger presence */}
                <motion.p
                  variants={staggerItem}
                  className="text-2xl md:text-3xl text-zinc-100 font-semibold mb-3 tracking-[-0.02em]"
                >
                  {t('landing.subtitle')}
                </motion.p>

                {/* Description */}
                <motion.p
                  variants={staggerItem}
                  className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed"
                >
                  {t('landing.description')}
                </motion.p>

                {/* CTA Buttons — larger, more impactful */}
                <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                    onClick={() => { setAuthMode('register'); setView('auth'); setTokenMode('auto'); setLoginToken('') }}
                    className="apple-btn-primary px-10 py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_8px_40px_-8px_rgba(16,185,129,0.35)] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_20px_60px_-12px_rgba(16,185,129,0.5)]"
                  >
                    {t('landing.getStarted')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                    onClick={() => { setAuthMode('login'); setView('auth') }}
                    className="apple-btn-secondary px-10 py-4 rounded-2xl font-semibold text-base bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:text-white"
                  >
                    {t('landing.signIn')}
                  </motion.button>
                </motion.div>
              </motion.div>
            </section>

            {/* ════════════ METRICS TICKER ════════════ */}
            <section className="relative z-10 w-full max-w-4xl mx-auto px-6 -mt-4 mb-16">
              <div className="apple-glass-strong rounded-3xl p-1">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
                  {[
                    { value: 18, suffix: '+', label: t('landing.metricEndpoints'), color: 'text-emerald-400' },
                    { value: 5, suffix: '', label: t('landing.metricLanguages'), color: 'text-cyan-400' },
                    { value: 4, suffix: '', label: t('landing.metricTokenTypes'), color: 'text-violet-400' },
                    { value: 3, suffix: '', label: t('landing.metricRoles'), color: 'text-amber-400' },
                  ].map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: easeApple }}
                      className="py-6 px-4 text-center"
                    >
                      <div className={`text-3xl md:text-4xl font-bold tracking-[-0.03em] apple-metric-value ${m.color}`}>
                        <AnimatedCounter target={m.value} suffix={m.suffix} />
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1.5 font-medium uppercase tracking-wider">{m.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* ════════════ FEATURES GRID ════════════ */}
            <section className="relative z-10 w-full max-w-4xl mx-auto px-6 mb-24">
              <SectionReveal className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-xs font-medium mb-5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Core Features
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 tracking-[-0.03em]">
                  Everything your agents need
                </h2>
              </SectionReveal>
              <motion.div
                initial="initial" whileInView="animate" viewport={{ once: true, margin: '-50px' }}
                variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                <SpotlightCard icon="🧠" title={t('landing.featureMemory')} desc={t('landing.featureMemoryDesc')} />
                <SpotlightCard icon="📋" title={t('landing.featureInstructions')} desc={t('landing.featureInstructionsDesc')} />
                <SpotlightCard icon="🔗" title={t('landing.featureInvite')} desc={t('landing.featureInviteDesc')} />
                <SpotlightCard icon="💾" title={t('landing.featureStorage')} desc={t('landing.featureStorageDesc')} />
                <SpotlightCard icon="🔑" title={t('landing.featureTokens')} desc={t('landing.featureTokensDesc')} />
                <SpotlightCard icon="👑" title={t('landing.featureRoles')} desc={t('landing.featureRolesDesc')} />
              </motion.div>
            </section>

            {/* ════════════ HOW IT WORKS ════════════ */}
            <section className="relative z-10 w-full max-w-3xl mx-auto px-6 mb-24">
              <SectionReveal className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 tracking-[-0.03em] mb-3">
                  {t('landing.howTitle')}
                </h2>
                <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full mx-auto" />
              </SectionReveal>

              <div className="relative">
                {/* Vertical connector line (desktop) */}
                <div className="hidden md:block absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 via-cyan-500/20 to-transparent" />

                {[
                  { step: 1, emoji: '🚀', title: t('landing.howStep1Title'), desc: t('landing.howStep1Desc'), bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', ring: 'bg-emerald-500/20', label: 'text-emerald-400' },
                  { step: 2, emoji: '🤖', title: t('landing.howStep2Title'), desc: t('landing.howStep2Desc'), bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', ring: 'bg-cyan-500/20', label: 'text-cyan-400' },
                  { step: 3, emoji: '⚡', title: t('landing.howStep3Title'), desc: t('landing.howStep3Desc'), bg: 'bg-violet-500/10', border: 'border-violet-500/20', ring: 'bg-violet-500/20', label: 'text-violet-400' },
                ].map((s, i) => (
                  <SectionReveal key={i} delay={i * 0.15} className="relative flex gap-6 md:gap-8 mb-12 last:mb-0">
                    {/* Step number with pulse ring */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-16 h-16 rounded-2xl ${s.bg} ${s.border} border flex items-center justify-center text-2xl relative z-10`}>
                        {s.emoji}
                      </div>
                      <div className={`absolute inset-0 w-16 h-16 rounded-2xl ${s.ring} apple-pulse-ring`} />
                    </div>
                    {/* Content */}
                    <div className="pt-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${s.label}`}>Step {s.step}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-100 tracking-[-0.01em] mb-1.5">{s.title}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed max-w-md">{s.desc}</p>
                    </div>
                  </SectionReveal>
                ))}
              </div>
            </section>

            {/* ════════════ TECH STACK ════════════ */}
            <section className="relative z-10 w-full max-w-4xl mx-auto px-6 mb-24">
              <SectionReveal className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-zinc-100 tracking-[-0.03em] mb-3">
                  {t('landing.techTitle')}
                </h2>
                <p className="text-sm text-zinc-500">{t('landing.techSubtitle')}</p>
              </SectionReveal>
              <motion.div
                initial="initial" whileInView="animate" viewport={{ once: true, margin: '-50px' }}
                variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {[
                  { name: t('landing.techNextjs'), desc: t('landing.techNextjsDesc'), icon: '▲', color: 'text-white' },
                  { name: t('landing.techPrisma'), desc: t('landing.techPrismaDesc'), icon: '◆', color: 'text-zinc-100' },
                  { name: t('landing.techTailwind'), desc: t('landing.techTailwindDesc'), icon: '🎨', color: 'text-cyan-400' },
                  { name: t('landing.techFramer'), desc: t('landing.techFramerDesc'), icon: '✦', color: 'text-violet-400' },
                ].map((tech, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    whileHover={{ y: -4, transition: springGentle }}
                    className="apple-glass rounded-2xl p-6 text-center group hover:border-white/[0.1] transition-colors duration-300"
                  >
                    <div className={`text-2xl mb-3 ${tech.color} group-hover:scale-110 transition-transform duration-300`}>{tech.icon}</div>
                    <div className="text-sm font-bold text-zinc-100 mb-1">{tech.name}</div>
                    <div className="text-[11px] text-zinc-500 leading-relaxed">{tech.desc}</div>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* ════════════ SOCIAL PROOF BADGES ════════════ */}
            <section className="relative z-10 w-full max-w-3xl mx-auto px-6 mb-24">
              <motion.div
                initial="initial" whileInView="animate" viewport={{ once: true, margin: '-50px' }}
                variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {[
                  { icon: '🔓', title: t('landing.openSource'), desc: t('landing.openSourceDesc') },
                  { icon: '⚡', title: t('landing.selfHost'), desc: t('landing.selfHostDesc') },
                  { icon: '🌍', title: t('landing.multiLang'), desc: t('landing.multiLangDesc') },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    whileHover={{ y: -3, transition: springGentle }}
                    className="apple-glass rounded-2xl p-5 text-center hover:border-emerald-500/15 transition-colors duration-300"
                  >
                    <div className="text-2xl mb-2">{b.icon}</div>
                    <div className="text-xs font-bold text-zinc-100 mb-1">{b.title}</div>
                    <div className="text-[11px] text-zinc-500 leading-relaxed">{b.desc}</div>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* ════════════ CTA + GITHUB + Z.AI ════════════ */}
            <section className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-12">
              {/* GitHub Badge */}
              <SectionReveal>
                <motion.a
                  href="https://github.com/romangalaxys10-spec/memtrant"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, transition: springGentle }}
                  className="block w-full rounded-2xl apple-glass-strong p-5 flex items-center gap-4 group cursor-pointer mb-5 hover:border-white/[0.1] transition-colors duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors duration-300">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors duration-300">{t('github.star')}</span>
                  <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 ms-auto transition-all duration-300 group-hover:translate-x-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </motion.a>
              </SectionReveal>

              {/* Z.AI GLM 5 Turbo Promo */}
              <SectionReveal delay={0.1}>
                <motion.div
                  whileHover={{ y: -2, transition: springGentle }}
                  className="w-full mb-8"
                >
                  <div className="relative rounded-2xl apple-glass p-8 overflow-hidden hover:border-emerald-500/20 transition-all duration-500">
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-[80px]" style={{ animation: 'orb-drift-2 15s ease-in-out infinite' }} />
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-cyan-500/[0.06] rounded-full blur-[80px]" style={{ animation: 'orb-drift-1 18s ease-in-out infinite' }} />

                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {t('promo.builtWith')} {t('promo.modelName')}
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{t('promo.inviteTitle')}</h3>
                      <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{t('promo.inviteDesc')}</p>
                      <motion.a
                        href="https://z.ai/subscribe?ic=R0K78RJKNW"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                        className="apple-btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold text-[14px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_8px_24px_-8px_rgba(16,185,129,0.25)]"
                      >
                        {t('promo.joinNow')}
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </motion.a>
                    </div>
                  </div>
                </motion.div>
              </SectionReveal>

              {/* ── Credits Footer ── */}
              <SectionReveal delay={0.2}>
                <footer className="text-center pt-8 pb-6 border-t border-white/[0.04]">
                  <p className="text-xs text-zinc-600 mb-3">{t('footer.text')}</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <a href="https://t.me/romangalaxys10" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.12] transition-all duration-300">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      {t('credits.telegram')}
                    </a>
                    <a href="https://linkedin.com/in/romangalaxys10" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.12] transition-all duration-300">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </a>
                    <a href="https://romangalaxys10.dev" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.12] transition-all duration-300">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      {t('credits.portfolio')}
                    </a>
                    <a href="https://romangalaxys10.hashnode.dev" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.12] transition-all duration-300">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      {t('credits.blog')}
                    </a>
                  </div>
                </footer>
              </SectionReveal>
            </section>
          </div>
        )}

        {/* ════════════ AUTH ════════════ */}
        {view === 'auth' && (
          <section className="flex-1 flex items-center justify-center p-4 relative">
            {/* Subtle background orb */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[160px]" style={{ animation: 'orb-drift-1 20s ease-in-out infinite' }} />
            <motion.div {...modalContent} className="apple-glass-strong rounded-3xl p-10 w-full max-w-md relative z-10">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...springBounce, delay: 0.15 }}
                  className="text-4xl mb-3"
                >🧠</motion.div>
                <h2 className="text-2xl font-bold text-zinc-100 tracking-[-0.02em]">{authMode === 'register' ? t('auth.createAccount') : t('auth.signIn')}</h2>
                <p className="text-zinc-500 text-sm mt-2">{t('auth.tagline')}</p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('auth.username')}</label>
                  <input value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/20 text-zinc-100 placeholder:text-zinc-600 transition-all duration-300"
                    placeholder={t('auth.usernamePlaceholder')} />
                </div>
                {authMode === 'register' ? (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2 font-medium">{t('auth.loginToken')}</label>
                    <div className="flex gap-2 mb-3">
                      <button type="button" onClick={() => { setTokenMode('auto'); setLoginToken(''); setAuthError('') }}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${tokenMode === 'auto' ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400' : 'bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.15]'}`}>
                        🔄 {t('auth.autoGenerate')}
                      </button>
                      <button type="button" onClick={() => { setTokenMode('custom'); setAuthError('') }}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${tokenMode === 'custom' ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400' : 'bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.15]'}`}>
                        ✏️ {t('auth.customToken')}
                      </button>
                    </div>
                    {tokenMode === 'custom' && (
                      <input value={loginToken} onChange={e => setLoginToken(e.target.value)}
                        type="text"
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100 placeholder:text-zinc-600 transition-all duration-200"
                        placeholder={t('auth.customTokenPlaceholder')} />
                    )}
                    {tokenMode === 'auto' && (
                      <p className="text-xs text-zinc-600 leading-relaxed">{t('auth.autoGenerateHint')}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('auth.loginToken')}</label>
                    <input value={loginToken} onChange={e => setLoginToken(e.target.value)}
                      type="password"
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100 placeholder:text-zinc-600 transition-all duration-200"
                      placeholder={t('auth.loginTokenPlaceholder')} />
                  </div>
                )}
                <AnimatePresence>
                  {authError && (
                    <motion.p
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ duration: 0.25, ease: easeApple }}
                      className="text-red-400 text-sm overflow-hidden"
                    >{authError}</motion.p>
                  )}
                </AnimatePresence>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring} onClick={handleAuth} disabled={authLoading || !username || (authMode === 'login' && !loginToken) || (authMode === 'register' && tokenMode === 'custom' && loginToken.trim().length < 8)}
                  className="apple-btn-primary w-full py-3.5 rounded-2xl font-semibold text-[15px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_8px_32px_-8px_rgba(16,185,129,0.25)] disabled:opacity-40 disabled:cursor-not-allowed">
                  {authLoading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : authMode === 'register' ? t('auth.createAccount') : t('auth.signIn')}
                </motion.button>
                <p className="text-center text-sm text-zinc-500">
                  {authMode === 'register' ? t('auth.alreadyHaveAccount') : t('auth.needAccount')}{' '}
                  <button onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setAuthError(''); setTokenMode('auto'); setLoginToken('') }}
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200">
                    {authMode === 'register' ? t('auth.signIn') : t('auth.register')}
                  </button>
                </p>
              </div>
            </motion.div>
          </section>
        )}

        {/* ════════════ DASHBOARD ════════════ */}
        {view === 'dashboard' && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: easeApple }}
            className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full"
          >
            {/* Sticky header with glass effect */}
            <header className="sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-4 mb-8 bg-[#09090b]/80 backdrop-blur-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ ...springBounce, delay: 0.1 }}
                    className="text-2xl"
                  >🧠</motion.span>
                  <h1 className="text-2xl font-bold tracking-[-0.02em] bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">MemTrant</h1>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-500 font-medium">{username}</span>
                  <button onClick={() => { clearSession(); setCurrentLoginToken(''); setView('landing') }} className="apple-btn-secondary text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-200">{t('dashboard.logout')}</button>
                </div>
              </div>
            </header>

            <GithubPairCard username={username} loginToken={currentLoginToken} />

            <DataExplorerCard loginToken={currentLoginToken} />

            <div className="flex items-center justify-between mb-8">
              <motion.h2
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: easeApple, delay: 0.1 }}
                className="text-xl font-semibold text-zinc-100 tracking-[-0.01em]"
              >{t('dashboard.yourTeams')}</motion.h2>
              <motion.button
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={spring}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setNewTeamName(''); setNewTeamDesc(''); setTeamError(''); setShowNewTeam(true) }}
                className="apple-btn-primary px-5 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_6px_24px_-6px_rgba(16,185,129,0.25)]"
              >
                {t('dashboard.newTeam')}
              </motion.button>
            </div>

            {teamsLoading ? (
              <div className="space-y-3 py-8">
                {[1,2,3].map(i => <div key={i} className="apple-shimmer h-20 rounded-2xl" />)}
              </div>
            ) : teams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: easeApple }}
                className="apple-glass rounded-2xl p-20 text-center"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-5xl mb-5"
                >📭</motion.div>
                <p className="text-zinc-400 text-sm">{t('dashboard.noTeams')}</p>
              </motion.div>
            ) : (
              <motion.div
                initial="initial" animate="animate"
                variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
                className="grid gap-3"
              >
                {teams.map((team, i) => (
                  <motion.div
                    key={team.id}
                    variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeApple } } }}
                    whileHover={{ y: -2, transition: springGentle }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => openTeam(team)}
                    className="apple-glass rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-white/[0.12] transition-colors duration-300 group"
                  >
                    <div>
                      <h3 className="font-semibold text-zinc-100 group-hover:text-white transition-colors duration-200">{team.name}</h3>
                      <p className="text-xs text-zinc-600 mt-0.5">{team.description || t('dashboard.noDescription')} · <span className="font-mono text-zinc-700">{team.slug}</span></p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      {team._count && <span className="flex items-center gap-1"><span className="text-zinc-600">🤖</span>{team._count.agents}</span>}
                      {team._count && <span className="flex items-center gap-1"><span className="text-zinc-600">📋</span>{team._count.instructions}</span>}
                      <span className="text-zinc-600">{formatTimeAgo(team.createdAt)}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
        )}
        {view === 'team' && selectedTeam && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: easeApple }}
            className="flex-1 flex flex-col max-w-6xl mx-auto w-full"
          >
            {/* Team header — sticky glass */}
            <header className="sticky top-0 z-30 p-4 md:p-6 border-b border-white/[0.06] flex items-center justify-between bg-[#09090b]/80 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView('dashboard')}
                  className="text-zinc-500 hover:text-zinc-100 text-sm transition-colors duration-200 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  {t('team.back')}
                </motion.button>
                <div>
                  <h1 className="text-xl font-bold text-zinc-100 tracking-[-0.02em]">{selectedTeam.name}</h1>
                  <p className="text-xs text-zinc-600 font-mono">/{selectedTeam.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowToken(true)} className="apple-btn-secondary text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-200">
                  {t('team.token')}
                </button>
                <button onClick={() => deleteTeam(selectedTeam.slug)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-red-400/70 hover:text-red-300 hover:border-red-500/20 hover:bg-red-500/5 transition-all duration-300">
                  {t('team.delete')}
                </button>
              </div>
            </header>

            {/* Tabs — Apple-style with animated underline */}
            <nav className="px-4 md:px-6 pt-2 flex gap-1 border-b border-white/[0.06] overflow-x-auto relative">
              {tabItems.map(tab => {
                const isActive = teamTab === tab.key
                return (
                  <button key={tab.key} onClick={() => {
                    setTeamTab(tab.key)
                    if (tab.key === 'memory' && !memoryPath && files.length === 0) browsePath('')
                    if (tab.key === 'invites' && invites.length === 0) loadInvites(selectedTeam.slug)
                  }}
                    className={`px-4 py-2.5 text-sm whitespace-nowrap transition-all duration-300 relative ${
                      isActive
                        ? 'text-emerald-400'
                        : 'text-zinc-500 hover:text-zinc-200'
                    }`}>
                    <span className="mr-1.5">{tab.icon}</span>{tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="active-tab"
                        className="absolute bottom-0 inset-x-2 h-0.5 bg-emerald-400 rounded-full"
                        style={{ boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Tab content */}
            <div className="flex-1 p-4 md:p-6 overflow-auto">
              {teamLoading ? (
                <div className="space-y-4 py-8">
                  {[1,2,3,4].map(i => <div key={i} className="apple-shimmer h-24 rounded-2xl" />)}
                </div>
              ) : (
                <>
                  {/* ── OVERVIEW ── */}
                  {teamTab === 'overview' && (
                    <motion.div
                      initial="initial" animate="animate"
                      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: t('team.statAgents'), value: agents.length, icon: '🤖' },
                          { label: t('team.statInstructions'), value: instructions.length, icon: '📋' },
                          { label: t('team.statFiles'), value: selectedTeam.fileCount || 0, icon: '📁' },
                          { label: t('team.statStorage'), value: formatBytes(selectedTeam.totalSize || 0), icon: '💾' },
                        ].map((s, i) => (
                          <motion.div
                            key={i}
                            variants={{ initial: { opacity: 0, y: 12, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: easeApple } } }}
                            whileHover={{ y: -2, transition: springGentle }}
                            className="apple-glass rounded-2xl p-5"
                          >
                            <div className="text-xs text-zinc-500 mb-2 font-medium">{s.icon} {s.label}</div>
                            <div className="text-2xl font-bold text-zinc-100 tracking-[-0.02em]">{s.value}</div>
                          </motion.div>
                        ))}
                      </div>
                      <motion.div variants={staggerItem} className="apple-glass rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-2">{t('team.description')}</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">{selectedTeam.description || t('team.noDescription')}</p>
                      </motion.div>
                      <motion.div variants={staggerItem} className="apple-glass rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-2">{t('team.teamLead')}</h3>
                        {agents.find(a => a.role === 'lead')
                          ? <p className="text-sm text-zinc-400">👑 {agents.find(a => a.role === 'lead')!.name}</p>
                          : <p className="text-sm text-zinc-600">{t('team.noLead')}</p>}
                      </motion.div>
                      <motion.div variants={staggerItem} className="apple-glass rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-3">{t('team.recentInstructions')}</h3>
                        {instructions.length === 0
                          ? <p className="text-sm text-zinc-600">{t('team.noInstructions')}</p>
                          : <div className="space-y-2">{instructions.slice(0, 5).map(inst => (
                            <div key={inst.id} className="flex items-center justify-between text-sm">
                              <span className="text-zinc-300">{inst.title}</span>
                              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusColors[inst.status] || statusColors.pending}`}>{inst.status}</span>
                            </div>
                          ))}</div>}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* ── AGENTS ── */}
                  {teamTab === 'agents' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">{t('team.agents')} ({agents.length})</h2>
                        <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} transition={spring}
                          onClick={() => { setNewAgentName(''); setNewAgentRole('worker'); setShowNewAgent(true) }}
                          className="apple-btn-primary px-5 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_6px_24px_-6px_rgba(16,185,129,0.25)]">
                          {t('team.addAgent')}
                        </motion.button>
                      </div>
                      {agents.length === 0
                        ? <div className="apple-glass rounded-2xl p-16 text-center">
                            <div className="text-4xl mb-4">🤖</div>
                            <p className="text-zinc-600 text-sm">{t('team.noAgents')}</p>
                          </div>
                        : <>
                        <p className="text-xs text-zinc-600 mb-3">{t('modal.clickToViewAgent')}</p>
                        <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.05 } } }} className="space-y-2">{agents.map(a => (
                          <motion.div key={a.id} variants={staggerItem} whileHover={{ x: 4, transition: { duration: 0.2 } }}
                            onClick={() => setSelectedAgent(a)}
                            className="apple-glass rounded-2xl p-4 md:p-5 flex items-center justify-between hover:border-emerald-500/20 cursor-pointer transition-colors duration-300 group">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-lg flex-shrink-0">{roleIcons[a.role] || '🤖'}</span>
                              <div className="min-w-0">
                                <div className="font-semibold text-zinc-100 group-hover:text-white transition-colors duration-200">{a.name}</div>
                                <div className="text-xs text-zinc-600">{a.role} · {formatTimeAgo(a.lastSeen)}{a._count ? ` · ${a._count.assignedInstructions} tasks` : ''}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <span className="text-sm">{statusIcons[a.status] || '⚫'}</span>
                              <select value={a.role} onChange={e => updateAgentRole(a.id, e.target.value)}
                                className="bg-white/[0.03] border border-white/[0.08] text-xs rounded-lg px-2 py-1 text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30">
                                <option value="worker">{t('team.roleWorker')}</option>
                                <option value="observer">{t('team.roleObserver')}</option>
                                <option value="lead">{t('team.roleLead')}</option>
                              </select>
                              <button onClick={() => removeAgent(a.id)} className="text-xs text-red-400/70 hover:text-red-300 transition-colors duration-200 px-1.5 py-1 rounded-lg hover:bg-red-500/10">{t('team.remove')}</button>
                            </div>
                          </motion.div>
                        ))}</motion.div>
                        </>}
                    </div>
                  )}

                  {/* ── MEMORY ── */}
                  {teamTab === 'memory' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <span className="text-zinc-600">{t('team.path')}</span>
                          <span className="font-mono text-xs text-emerald-400">/{memoryPath || t('team.root')}</span>
                        </div>
                        <button onClick={() => browsePath('')} className="text-xs text-zinc-600 hover:text-zinc-200 transition-colors duration-200">{t('team.rootBtn')}</button>
                      </div>
                      {files.length === 0 && !memoryPath && <div className="apple-glass rounded-2xl p-16 text-center text-zinc-600">{t('team.memoryEmpty')}</div>}
                      {files.length > 0 && (
                        <div className="apple-glass rounded-2xl divide-y divide-white/[0.04] overflow-hidden">
                          {memoryPath && (
                            <button onClick={() => browsePath(memoryPath.split('/').slice(0, -1).join('/'))}
                              className="w-full px-5 py-3.5 text-left text-sm text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02] flex items-center gap-2 transition-colors duration-200">
                              <span>⬆️</span> ..
                            </button>
                          )}
                          {files.map((f, i) => (
                            <button key={i} onClick={() => f.type === 'directory' ? browsePath(memoryPath ? `${memoryPath}/${f.name}` : f.name) : previewFile(f.name)}
                              className="w-full px-5 py-3.5 text-left text-sm hover:bg-white/[0.02] flex items-center justify-between transition-colors duration-200">
                              <span className={`flex items-center gap-2 ${f.type === 'directory' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                <span>{f.type === 'directory' ? '📁' : '📄'}</span> {f.name}
                              </span>
                              {f.size != null && <span className="text-xs text-zinc-600">{formatBytes(f.size)}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {previewName && (
                        <div className="apple-glass rounded-2xl p-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-zinc-300">📄 {previewName}</span>
                            <button onClick={() => { setPreviewContent(''); setPreviewName('') }} className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors duration-200">{t('team.close')}</button>
                          </div>
                          <pre className="bg-black/40 rounded-xl p-4 text-xs text-zinc-300 overflow-auto max-h-96 font-mono whitespace-pre-wrap">{previewContent}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── INSTRUCTIONS ── */}
                  {teamTab === 'instructions' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">{t('team.tabInstructions')} ({instructions.length})</h2>
                        <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} transition={spring}
                          onClick={() => { setNewInstTitle(''); setNewInstContent(''); setNewInstPriority('normal'); setNewInstAssigneeId(''); setShowNewInstruction(true) }}
                          className="apple-btn-primary px-5 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_6px_24px_-6px_rgba(16,185,129,0.25)]">
                          {t('team.newInstruction')}
                        </motion.button>
                      </div>
                      {instructions.length === 0
                        ? <div className="apple-glass rounded-2xl p-16 text-center text-zinc-600">{t('team.noInstructions')}</div>
                        : <div className="space-y-3">{instructions.map(inst => (
                          <div key={inst.id} className="apple-glass rounded-2xl p-5 hover:border-white/[0.1] transition-all duration-200">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-zinc-100">{inst.title}</h3>
                                <p className="text-xs text-zinc-600 mt-0.5">
                                  {inst.assignee ? `→ ${inst.assignee.name}` : t('team.unassigned')} · {formatTimeAgo(inst.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${priorityColors[inst.priority] || priorityColors.normal}`}>{inst.priority}</span>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${statusColors[inst.status] || statusColors.pending}`}>{inst.status}</span>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-400 mb-3 leading-relaxed">{inst.content}</p>
                            <div className="flex gap-1.5">
                              {(['pending', 'in_progress', 'done', 'failed'] as InstructionStatus[]).map(s => (
                                <button key={s} onClick={() => updateInstructionStatus(inst.id, s)}
                                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${inst.status === s ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' : 'border-white/[0.06] text-zinc-600 hover:text-zinc-300 hover:border-white/[0.12]'}`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}</div>}
                    </div>
                  )}

                  {/* ── INVITES ── */}
                  {teamTab === 'invites' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">{t('team.tabInvites')} ({invites.length})</h2>
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setInviteAgentRole('worker'); setInviteExpiryHours('24'); setInviteResult(null); setShowNewInviteAgent(true) }}
                            className="px-4 py-2.5 rounded-2xl text-sm font-medium bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.15] transition-all duration-200">
                            {t('team.inviteAgent')}
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setHumanInviteResult(null); handleCreateInvite('human') }}
                            className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                            {t('team.inviteHuman')}
                          </motion.button>
                        </div>
                      </div>
                      {invites.length === 0
                        ? <div className="apple-glass rounded-2xl p-16 text-center text-zinc-600">{t('team.noInvites')}</div>
                        : <div className="space-y-2">{invites.map(inv => (
                          <div key={inv.id} className="apple-glass rounded-2xl p-5 flex items-center justify-between hover:border-white/[0.1] transition-all duration-200">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${inv.type === 'human' ? 'bg-violet-500/15 text-violet-400 border-violet-500/30' : 'bg-sky-500/15 text-sky-400 border-sky-500/30'}`}>
                                {inv.type}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs font-mono text-emerald-400 cursor-pointer" onClick={() => copyToClipboard(inv.code)} title="Click to copy">{inv.code.slice(0, 12)}...</code>
                                </div>
                                <div className="text-xs text-zinc-600 mt-0.5">
                                  {inv.role && <span>{t('team.role')}: {inv.role} · </span>}
                                  {formatTimeAgo(inv.createdAt)}
                                  {inv.expiresAt && <span> · {t('team.expires')} {new Date(inv.expiresAt).toLocaleDateString()}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${
                                inv.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : inv.status === 'used' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'}`}>
                                {inv.status}
                              </span>
                              <span className="text-xs text-zinc-600">{inv.useCount}/{inv.maxUses || '∞'}</span>
                              {inv.type === 'human' && inv.credentials && (
                                <button onClick={() => {
                                  let creds = inv.credentials
                                  if (typeof creds === 'string') { try { creds = JSON.parse(creds) } catch {} }
                                  setHumanInviteResult({
                                    code: inv.code,
                                    credentials: typeof creds === 'string' ? creds : JSON.stringify(creds, null, 2),
                                    username: (creds as any).username || '',
                                    token: (creds as any).loginToken || (creds as any).token || '',
                                  })
                                }} className="text-xs text-violet-400 hover:text-violet-300 transition-colors duration-200">
                                  {t('team.viewCredentials')}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}</div>}
                    </div>
                  )}

                  {/* ── API ── */}
                  {teamTab === 'api' && (
                    <div className="space-y-5">
                      <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">{t('team.apiReference')}</h2>
                      <div className="apple-glass rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-white/[0.06]">
                            <th className="text-start px-5 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">{t('team.method')}</th>
                            <th className="text-start px-5 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">{t('team.endpoint')}</th>
                            <th className="text-start px-5 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">{t('team.apiDescription')}</th>
                          </tr></thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {[
                              ['PUT', `/api/t/${teamSlug}/memory/<path>`, t('team.apiStore')],
                              ['GET', `/api/t/${teamSlug}/memory/<path>`, t('team.apiRead')],
                              ['DELETE', `/api/t/${teamSlug}/memory/<path>`, t('team.apiDelete')],
                              ['POST', `/api/teams/${teamSlug}/instructions`, t('team.apiCreateInst')],
                              ['GET', `/api/teams/${teamSlug}/instructions`, t('team.apiListInst')],
                              ['PATCH', `/api/teams/${teamSlug}/instructions/:id`, t('team.apiUpdateInst')],
                              ['GET', `/api/teams/${teamSlug}/agents`, t('team.apiListAgents')],
                              ['POST', `/api/teams/${teamSlug}/invites`, t('team.apiCreateInvite')],
                              ['GET', `/api/teams/${teamSlug}/invites`, t('team.apiListInvites')],
                            ].map(([m, ep, desc], i) => (
                              <tr key={i} className="hover:bg-white/[0.02] transition-colors duration-150">
                                <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-md font-mono ${m === 'GET' ? 'bg-emerald-500/15 text-emerald-400' : m === 'POST' ? 'bg-sky-500/15 text-sky-400' : m === 'PATCH' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>{m}</span></td>
                                <td className="px-5 py-3 font-mono text-xs text-zinc-400">{ep}</td>
                                <td className="px-5 py-3 text-zinc-500">{desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="apple-glass rounded-2xl p-5">
                        <div className="flex gap-1 mb-4">
                          {(['curl', 'python', 'nodejs'] as const).map(snippet => (
                            <button key={snippet} onClick={() => setSnippetTab(snippet)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${snippetTab === snippet ? 'bg-emerald-500/15 text-emerald-400' : 'text-zinc-600 hover:text-zinc-300'}`}>
                              {snippet}
                            </button>
                          ))}
                        </div>
                        <pre className="bg-black/40 rounded-xl p-5 text-xs text-zinc-300 overflow-auto max-h-96 font-mono whitespace-pre-wrap">{apiSnippets[snippetTab]}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.section>
        )}
      </main>

      {/* ════════════ FOOTER ════════════ */}
      {view !== 'landing' && (
      <footer className="mt-auto border-t border-white/[0.04] px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="text-center text-[11px] text-zinc-700 tracking-wide uppercase">{t('footer.text')}</p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
            <span>{t('credits.developedBy')}</span>
            <span className="text-zinc-300 font-semibold">{t('credits.name')}</span>
          </div>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {[
              { href: 'https://t.me/VibeCodePrompterSystem', label: t('credits.telegram') },
              { href: 'https://www.linkedin.com/in/r%D0%BEman-m-793b3310/', label: 'LinkedIn' },
              { href: 'https://www.rommark.dev', label: t('credits.portfolio') },
              { href: 'https://claw.rommark.dev', label: t('credits.blog') },
            ].map((link, i) => (
              <a key={i} href={link.href} target="_blank" rel="noopener noreferrer nofollow"
                className="text-[11px] text-zinc-600 hover:text-emerald-400 transition-colors duration-300 hover:underline underline-offset-2">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODALS
         ════════════════════════════════════════════════════════════════════════ */}

      {/* ── Signup Modal ── */}
      <AnimatePresence>
        {showSignupModal && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 z-[100]">
            <motion.div {...modalContent} className="apple-glass-strong rounded-3xl p-10 w-full max-w-md relative">
              <h2 className="text-xl font-bold text-zinc-100 mb-1">{t('modal.accountCreated')}</h2>
              <p className="text-sm text-zinc-500 mb-5">{t('modal.saveCredentials')}</p>
              <div className="space-y-3 mb-5">
                <div className="bg-black/40 rounded-xl p-4">
                  <div className="text-xs text-zinc-600 mb-1">{t('modal.username')}</div>
                  <div className="font-mono text-sm text-emerald-400 break-all">{username}</div>
                </div>
                <div className="bg-black/40 rounded-xl p-4">
                  <div className="text-xs text-zinc-600 mb-1">{t('modal.loginToken')}</div>
                  <div className="font-mono text-sm text-emerald-400 break-all select-all">{loginTokenSaved}</div>
                </div>
              </div>
              <div className="flex gap-2 mb-5">
                <button onClick={() => {
                  copyToClipboard(`Username: ${username}\nLogin Token: ${loginTokenSaved}`)
                }} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                  {copiedFeedback || t('modal.copyToClipboard')}
                </button>
                <button onClick={() => downloadAsFile(`Username: ${username}\nLogin Token: ${loginTokenSaved}\n`, 'memtrant-credentials.txt')}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-medium bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:border-white/[0.15] transition-all duration-200">
                  {t('modal.downloadAsFile')}
                </button>
              </div>
              <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-4 mb-5">
                <p className="text-sm font-semibold text-red-400 mb-2">{t('modal.dontClose')}</p>
                <ul className="text-xs text-red-300/60 space-y-1.5 list-disc list-inside">
                  <li>{t('modal.noRecovery')}</li>
                  <li>{t('modal.losingToken')}</li>
                  <li>{t('modal.storeSecurely')}</li>
                </ul>
              </div>
              <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
                <input type="checkbox" checked={savedOfflineChecked} onChange={e => setSavedOfflineChecked(e.target.checked)}
                  className="mt-0.5 accent-emerald-500" />
                <span className="text-sm text-zinc-500 leading-relaxed">{t('modal.savedConfirm')}</span>
              </label>
              <button onClick={() => { setShowSignupModal(false); setSavedOfflineChecked(false) }}
                disabled={!savedOfflineChecked}
                className="w-full py-3 rounded-2xl font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-40">
                {t('modal.continueDashboard')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Team Modal ── */}
      <AnimatePresence>
        {showNewTeam && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 z-50" onClick={() => setShowNewTeam(false)}>
            <motion.div {...modalContent} className="apple-glass-strong rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-5">{t('modal.createTeam')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.teamName')}</label>
                  <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100 placeholder:text-zinc-600 transition-all duration-200"
                    placeholder={t('modal.teamNamePlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.teamDesc')}</label>
                  <textarea value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} rows={2}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100 resize-none placeholder:text-zinc-600 transition-all duration-200"
                    placeholder={t('modal.teamDescPlaceholder')} />
                </div>
                {teamError && <p className="text-red-400 text-sm">{teamError}</p>}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowNewTeam(false)} className="flex-1 py-2.5 rounded-2xl text-sm bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.15] transition-all duration-200">{t('modal.cancel')}</button>
                  <button onClick={handleCreateTeam} disabled={!newTeamName}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-40">
                    {t('modal.createTeamBtn')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Agent Modal ── */}
      <AnimatePresence>
        {showNewAgent && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 z-50" onClick={() => setShowNewAgent(false)}>
            <motion.div {...modalContent} className="apple-glass-strong rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-5">{t('modal.addAgent')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.agentName')}</label>
                  <input value={newAgentName} onChange={e => setNewAgentName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100 placeholder:text-zinc-600 transition-all duration-200"
                    placeholder={t('modal.agentNamePlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.role')}</label>
                  <select value={newAgentRole} onChange={e => setNewAgentRole(e.target.value as AgentRole)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100">
                    <option value="worker">⚙️ {t('team.roleWorker')}</option>
                    <option value="observer">👁️ {t('team.roleObserver')}</option>
                    <option value="lead">👑 {t('team.roleLead')}</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowNewAgent(false)} className="flex-1 py-2.5 rounded-2xl text-sm bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.15] transition-all duration-200">{t('modal.cancel')}</button>
                  <button onClick={handleAddAgent} disabled={!newAgentName}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-40">
                    {t('modal.addAgentBtn')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Instruction Modal ── */}
      <AnimatePresence>
        {showNewInstruction && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 z-50" onClick={() => setShowNewInstruction(false)}>
            <motion.div {...modalContent} className="apple-glass-strong rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-5">{t('modal.newInstruction')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.title')}</label>
                  <input value={newInstTitle} onChange={e => setNewInstTitle(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100 placeholder:text-zinc-600 transition-all duration-200"
                    placeholder={t('modal.titlePlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.content')}</label>
                  <textarea value={newInstContent} onChange={e => setNewInstContent(e.target.value)} rows={3}
                    className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100 resize-none placeholder:text-zinc-600 transition-all duration-200"
                    placeholder={t('modal.contentPlaceholder')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.priority')}</label>
                    <select value={newInstPriority} onChange={e => setNewInstPriority(e.target.value as InstructionPriority)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100">
                      <option value="low">{t('modal.priorityLow')}</option>
                      <option value="normal">{t('modal.priorityNormal')}</option>
                      <option value="high">{t('modal.priorityHigh')}</option>
                      <option value="urgent">{t('modal.priorityUrgent')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.assignee')}</label>
                    <select value={newInstAssigneeId} onChange={e => setNewInstAssigneeId(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100">
                      <option value="">{t('team.unassigned')}</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowNewInstruction(false)} className="flex-1 py-2.5 rounded-2xl text-sm bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.15] transition-all duration-200">{t('modal.cancel')}</button>
                  <button onClick={handleCreateInstruction} disabled={!newInstTitle}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-40">
                    {t('modal.create')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Invite Agent Modal ── */}
      <AnimatePresence>
        {showNewInviteAgent && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 z-50" onClick={() => setShowNewInviteAgent(false)}>
            <motion.div {...modalContent} className="apple-glass-strong rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-5">{t('modal.inviteAgent')}</h2>
              {inviteResult ? (
                <div className="space-y-4">
                  <p className="text-sm text-emerald-400">{t('modal.inviteCreated')}</p>
                  <div className="bg-black/40 rounded-xl p-4">
                    <div className="text-xs text-zinc-600 mb-1">{t('modal.inviteCode')}</div>
                    <code className="text-sm text-emerald-400 break-all select-all">{inviteResult.code}</code>
                  </div>
                  {inviteResult.token && (
                    <div className="bg-black/40 rounded-xl p-4">
                      <div className="text-xs text-zinc-600 mb-1">{t('modal.agentToken')}</div>
                      <code className="text-sm text-cyan-400 break-all select-all">{inviteResult.token}</code>
                    </div>
                  )}
                  <button onClick={() => { copyToClipboard(inviteResult.code); setInviteResult(null); setShowNewInviteAgent(false) }}
                    className="w-full py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                    {copiedFeedback || t('modal.copyCodeClose')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.role')}</label>
                    <select value={inviteAgentRole} onChange={e => setInviteAgentRole(e.target.value as AgentRole)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100">
                      <option value="worker">⚙️ {t('team.roleWorker')}</option>
                      <option value="observer">👁️ {t('team.roleObserver')}</option>
                      <option value="lead">👑 {t('team.roleLead')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5 font-medium">{t('modal.expiresIn')}</label>
                    <input value={inviteExpiryHours} onChange={e => setInviteExpiryHours(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-zinc-100 placeholder:text-zinc-600 transition-all duration-200"
                      placeholder="24" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowNewInviteAgent(false)} className="flex-1 py-2.5 rounded-2xl text-sm bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.15] transition-all duration-200">{t('modal.cancel')}</button>
                    <button onClick={() => handleCreateInvite('agent')}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                      {t('modal.createInvite')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Invite Human Modal ── */}
      <AnimatePresence>
        {showNewInviteHuman && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <motion.div {...modalContent} className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 w-full max-w-md">
              <div className="text-center py-10">
                <div className="text-3xl mb-3 animate-spin">⏳</div>
                <p className="text-zinc-500">{t('modal.creatingInvite')}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Human Invite Result Modal ── */}
      <AnimatePresence>
        {humanInviteResult && !showNewInviteHuman && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 z-[100]">
            <motion.div {...modalContent} className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 w-full max-w-md">
              <h2 className="text-lg font-bold text-zinc-100 mb-1">{t('modal.humanInviteCreated')}</h2>
              <p className="text-sm text-amber-400 mb-5">{t('modal.shareCredentials')}</p>
              <div className="space-y-3 mb-5">
                <div className="bg-black/40 rounded-xl p-4">
                  <div className="text-xs text-zinc-600 mb-1">{t('modal.inviteCode')}</div>
                  <code className="text-sm text-emerald-400 break-all select-all">{humanInviteResult.code}</code>
                </div>
                {humanInviteResult.username && (
                  <div className="bg-black/40 rounded-xl p-4">
                    <div className="text-xs text-zinc-600 mb-1">{t('modal.username')}</div>
                    <code className="text-sm text-cyan-400 break-all select-all">{humanInviteResult.username}</code>
                  </div>
                )}
                {humanInviteResult.token && (
                  <div className="bg-black/40 rounded-xl p-4">
                    <div className="text-xs text-zinc-600 mb-1">{t('modal.loginToken')}</div>
                    <code className="text-sm text-violet-400 break-all select-all">{humanInviteResult.token}</code>
                  </div>
                )}
              </div>
              <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-4 mb-5">
                <p className="text-xs text-red-400 font-medium">{t('modal.shareWarning')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  const text = humanInviteResult.username
                    ? `Invite Code: ${humanInviteResult.code}\nUsername: ${humanInviteResult.username}\nLogin Token: ${humanInviteResult.token}`
                    : `Invite Code: ${humanInviteResult.code}\nCredentials: ${humanInviteResult.credentials}`
                  copyToClipboard(text)
                }} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                  {copiedFeedback || t('modal.copyAll')}
                </button>
                <button onClick={() => downloadAsFile(
                  humanInviteResult.username
                    ? `Invite Code: ${humanInviteResult.code}\nUsername: ${humanInviteResult.username}\nLogin Token: ${humanInviteResult.token}\n`
                    : `Invite Code: ${humanInviteResult.code}\nCredentials: ${humanInviteResult.credentials}\n`,
                  `memtrant-human-invite-${humanInviteResult.code}.txt`
                )} className="flex-1 py-2.5 rounded-2xl text-sm font-medium bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:border-white/[0.15] transition-all duration-200">
                  {t('modal.download')}
                </button>
              </div>
              <button onClick={() => setHumanInviteResult(null)}
                className="w-full mt-3 py-2.5 rounded-2xl text-sm text-zinc-500 hover:text-zinc-200 transition-colors duration-200">
                {t('modal.close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Token Modal ── */}
      <AnimatePresence>
        {showToken && selectedTeam && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 z-50" onClick={() => setShowToken(false)}>
            <motion.div {...modalContent} className="apple-glass-strong rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-2">{t('modal.ownerToken')}</h2>
              <p className="text-xs text-zinc-600 mb-4 leading-relaxed">{t('modal.ownerTokenDesc')}</p>
              <div className="bg-black/40 rounded-xl p-4 mb-5">
                <code className="text-sm text-emerald-400 break-all select-all font-mono">{selectedTeam.ownerToken}</code>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(selectedTeam.ownerToken)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                  {copiedFeedback || t('modal.copyToken')}
                </button>
                <button onClick={() => setShowToken(false)} className="flex-1 py-2.5 rounded-2xl text-sm bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.15] transition-all duration-200">{t('modal.close')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Agent Detail Modal ── */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center p-4 z-50" onClick={() => setSelectedAgent(null)}>
            <motion.div {...modalContent} className="apple-glass-strong rounded-3xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{roleIcons[selectedAgent.role] || '🤖'}</span>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100">{selectedAgent.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full border border-white/[0.08] text-zinc-400">{selectedAgent.role}</span>
                      <span className="text-sm">{statusIcons[selectedAgent.status] || '⚫'}</span>
                      <span className="text-xs text-zinc-600">{selectedAgent.status}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="text-zinc-600 hover:text-zinc-200 transition-colors duration-200 text-lg leading-none">✕</button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-xs text-zinc-600 mb-1">📋 {t('modal.agentAssignedTasks')}</div>
                  <div className="text-xl font-bold text-zinc-100">{selectedAgent._count?.assignedInstructions || 0}</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-xs text-zinc-600 mb-1">✏️ {t('modal.agentCreatedTasks')}</div>
                  <div className="text-xl font-bold text-zinc-100">{selectedAgent._count?.createdInstructions || 0}</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-xs text-zinc-600 mb-1">🕐 {t('modal.agentLastSeen')}</div>
                  <div className="text-sm font-medium text-zinc-300">{formatTimeAgo(selectedAgent.lastSeen)}</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-xs text-zinc-600 mb-1">📅 {t('modal.agentCreated')}</div>
                  <div className="text-sm font-medium text-zinc-300">{new Date(selectedAgent.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Agent data explorer */}
              {selectedTeam && (
                <AgentDataSection loginToken={currentLoginToken} teamSlug={selectedTeam.slug} agentId={selectedAgent.id} />
              )}

              {/* Agent Token (Brain) */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-300">🧠 {t('modal.agentToken')} <span className="font-normal text-zinc-600">({t('modal.agentTokenDesc').split('.')[0]})</span></h3>
                  <button onClick={() => copyToClipboard(selectedAgent.token)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-emerald-500/10">
                    {copiedFeedback || t('modal.copyAgentToken')}
                  </button>
                </div>
                <div className="bg-black/40 rounded-xl p-4">
                  <code className="text-xs text-cyan-400 break-all select-all font-mono leading-relaxed">{selectedAgent.token}</code>
                </div>
              </div>

              {/* Agent's assigned instructions */}
              {selectedAgent._count && selectedAgent._count.assignedInstructions > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">📋 {t('modal.agentAssignedTasks')}</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {instructions.filter(i => i.assignee?.id === selectedAgent.id).slice(0, 10).map(inst => (
                      <div key={inst.id} className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-zinc-300 truncate mr-3">{inst.title}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[inst.priority] || priorityColors.normal}`}>{inst.priority}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[inst.status] || statusColors.pending}`}>{inst.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activation Prompt */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-zinc-300">🚀 {t('modal.activationPrompt')}</h3>
                </div>
                <p className="text-xs text-zinc-600 mb-3 leading-relaxed">{t('modal.activationPromptDesc')}</p>
                <pre className="bg-black/40 rounded-xl p-4 text-[11px] text-zinc-300 overflow-auto max-h-64 font-mono whitespace-pre-wrap leading-relaxed">{generateActivationPrompt(selectedAgent)}</pre>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => copyToClipboard(generateActivationPrompt(selectedAgent))}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                    {copiedFeedback || t('modal.copyPrompt')}
                  </button>
                  <button onClick={() => downloadAsFile(generateActivationPrompt(selectedAgent), `memtrant-${selectedAgent.name.toLowerCase().replace(/\s+/g, '-')}-prompt.txt`)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15] transition-all duration-200">
                    {t('modal.downloadPrompt')}
                  </button>
                </div>
              </div>

              {/* Close */}
              <button onClick={() => setSelectedAgent(null)}
                className="w-full py-2.5 rounded-2xl text-sm bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.15] transition-all duration-200">
                {t('modal.close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}