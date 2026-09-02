'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
        await loadTeams()
      } else {
        setCurrentLoginToken(loginToken)
        setView('dashboard')
        await loadTeams()
      }
    } catch (e: any) {
      setAuthError(e.message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function loadTeams() {
    setTeamsLoading(true)
    try {
      const res = await fetch(`${API}/api/teams`, {
        headers: { Authorization: `Bearer ${currentLoginToken}` },
      })
      const data = await res.json()
      setTeams(Array.isArray(data) ? data : data.teams || [])
    } catch { setTeams([]) }
    finally { setTeamsLoading(false) }
  }

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
      const [teamRes, agentRes, instRes] = await Promise.all([
        fetch(`${API}/api/teams/${slug}`),
        fetch(`${API}/api/teams/${slug}/agents`),
        fetch(`${API}/api/teams/${slug}/instructions`),
      ])
      const teamData = await teamRes.json()
      setSelectedTeam(teamData)
      const agentData = await agentRes.json()
      setAgents(Array.isArray(agentData) ? agentData : [])
      const instData = await instRes.json()
      setInstructions(Array.isArray(instData) ? instData : [])
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAgentName, role: newAgentRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShowNewAgent(false)
      setNewAgentName('')
      setAgents(prev => [...prev, data])
    } catch (e: any) { alert(e.message) }
  }

  async function removeAgent(agentId: string) {
    if (!confirm(t('modal.confirmRemoveAgent'))) return
    try {
      await fetch(`${API}/api/teams/${selectedTeam!.slug}/agents/${agentId}`, { method: 'DELETE' })
      setAgents(prev => prev.filter(a => a.id !== agentId))
    } catch { /* ignore */ }
  }

  async function updateAgentRole(agentId: string, role: string) {
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ...data } : a))
    } catch { /* ignore */ }
  }

  // ── Instructions ─────────────────────────────────────────────────────────
  async function handleCreateInstruction() {
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/instructions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setInstructions(prev => [data, ...prev])
    } catch (e: any) { alert(e.message) }
  }

  async function updateInstructionStatus(id: string, status: string) {
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/instructions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      setInstructions(prev => prev.map(i => i.id === id ? { ...i, ...data } : i))
    } catch { /* ignore */ }
  }

  // ── Team delete ──────────────────────────────────────────────────────────
  async function deleteTeam(slug: string) {
    if (!confirm(t('modal.confirmDeleteTeam'))) return
    try {
      await fetch(`${API}/api/teams/${slug}`, { method: 'DELETE' })
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
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/files/${encodeURIComponent(path)}`)
      const data = await res.json()
      setFiles(Array.isArray(data) ? data : data.files || [])
    } catch { setFiles([]) }
  }

  async function previewFile(fileName: string) {
    const fullPath = memoryPath ? `${memoryPath}/${fileName}` : fileName
    setPreviewName(fullPath)
    try {
      const res = await fetch(`${API}/api/teams/${selectedTeam!.slug}/files/${encodeURIComponent(fullPath)}`)
      const text = await res.text()
      setPreviewContent(typeof text === 'string' ? text : JSON.stringify(text, null, 2))
    } catch { setPreviewContent(t('modal.fileLoadError')) }
  }

  // ── Invites ──────────────────────────────────────────────────────────────
  async function loadInvites(slug: string) {
    try {
      const res = await fetch(`${API}/api/teams/${slug}/invites`, {
        headers: { Authorization: `Bearer ${selectedTeam?.ownerToken}` },
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${selectedTeam!.ownerToken}` },
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
          <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 md:py-32 relative overflow-hidden">
            {/* Animated gradient orbs — Apple-style organic drift */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.06] rounded-full blur-[160px]" style={{ animation: 'orb-drift-1 20s ease-in-out infinite' }} />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/[0.05] rounded-full blur-[140px]" style={{ animation: 'orb-drift-2 25s ease-in-out infinite' }} />
            {/* Subtle warm accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full blur-[180px]" style={{ animation: 'orb-drift-1 30s ease-in-out infinite reverse' }} />

            {/* Hero content — staggered reveal */}
            <motion.div
              initial="initial" animate="animate"
              variants={{
                animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
              }}
              className="relative z-10 text-center max-w-2xl"
            >
              {/* Floating brain emoji */}
              <motion.div variants={{ initial: { opacity: 0, scale: 0.5, y: 20 }, animate: { opacity: 1, scale: 1, y: 0, transition: { ...springBounce, delay: 0 } } }}
                className="text-8xl mb-8 apple-float select-none"
                style={{ filter: 'drop-shadow(0 0 40px rgba(16, 185, 129, 0.2))' }}
              >
                🧠
              </motion.div>

              {/* Title — reveal with slight upward motion */}
              <motion.h1
                variants={{ initial: { opacity: 0, y: 30, filter: 'blur(8px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: easeApple } } }}
                className="text-7xl md:text-8xl font-bold tracking-[-0.04em] bg-gradient-to-b from-emerald-300 via-emerald-400 to-cyan-500 bg-clip-text text-transparent mb-7 leading-[0.95]"
              >
                MemTrant
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={staggerItem}
                className="text-xl md:text-2xl text-zinc-200 font-medium mb-3 tracking-[-0.01em]"
              >
                {t('landing.subtitle')}
              </motion.p>

              {/* Description */}
              <motion.p
                variants={staggerItem}
                className="text-base md:text-lg text-zinc-500 max-w-lg mx-auto mb-14 leading-relaxed"
              >
                {t('landing.description')}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={staggerItem} className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={() => { setAuthMode('register'); setView('auth'); setTokenMode('auto'); setLoginToken('') }}
                  className="apple-btn-primary px-8 py-3.5 rounded-2xl font-semibold text-[15px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_8px_32px_-8px_rgba(16,185,129,0.3)] hover:shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_16px_48px_-12px_rgba(16,185,129,0.4)]"
                >
                  {t('landing.getStarted')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={() => { setAuthMode('login'); setView('auth') }}
                  className="apple-btn-secondary px-8 py-3.5 rounded-2xl font-semibold text-[15px] bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:text-white"
                >
                  {t('landing.signIn')}
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Feature Cards — staggered entrance with spring hover */}
            <motion.div
              initial="initial" animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } } }}
              className="relative z-10 mt-24 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl w-full"
            >
              {[
                { icon: '🧠', title: t('landing.featureMemory'), desc: t('landing.featureMemoryDesc') },
                { icon: '📋', title: t('landing.featureInstructions'), desc: t('landing.featureInstructionsDesc') },
                { icon: '🔗', title: t('landing.featureInvite'), desc: t('landing.featureInviteDesc') },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  variants={staggerItemSlow}
                  whileHover={{ y: -4, transition: springGentle }}
                  className="apple-glass rounded-2xl p-7 text-center hover:border-white/[0.1] transition-colors duration-300 group"
                >
                  <div className="text-3xl mb-3 transition-transform duration-500 group-hover:scale-110">{f.icon}</div>
                  <div className="text-sm font-semibold text-zinc-200 tracking-[-0.01em]">{f.title}</div>
                  <div className="text-xs text-zinc-500 mt-2 leading-relaxed">{f.desc}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* ── GitHub Badge ── */}
            <motion.a
              href="https://github.com/romangalaxys10-spec/memtrant"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6, ease: easeApple }}
              whileHover={{ y: -2, transition: springGentle }}
              className="relative z-10 mt-12 w-full max-w-2xl rounded-2xl apple-glass-strong p-5 flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors duration-300">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors duration-300">{t('github.star')}</span>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 ms-auto transition-all duration-300 group-hover:translate-x-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </motion.a>

            {/* ── Z.AI GLM 5 Turbo Promo ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.6, ease: easeApple }}
              whileHover={{ y: -2, transition: springGentle }}
              className="relative z-10 mt-6 mb-4 w-full max-w-2xl"
            >
              <div className="relative rounded-2xl apple-glass p-8 overflow-hidden hover:border-emerald-500/20 transition-all duration-500">
                {/* Glowing accent — animated */}
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
          </section>
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
                  <button onClick={() => { setCurrentLoginToken(''); setView('landing') }} className="apple-btn-secondary text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-500 hover:text-zinc-200">{t('dashboard.logout')}</button>
                </div>
              </div>
            </header>

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
                        ? <div className="apple-glass rounded-2xl p-16 text-center text-zinc-600">{t('team.noAgents')}</div>
                        : <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.05 } } }} className="space-y-2">{agents.map(a => (
                          <motion.div key={a.id} variants={staggerItem} whileHover={{ x: 4, transition: { duration: 0.2 } }} className="apple-glass rounded-2xl p-5 flex items-center justify-between hover:border-white/[0.1] transition-colors duration-300">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{roleIcons[a.role] || '🤖'}</span>
                              <div>
                                <div className="font-semibold text-zinc-100">{a.name}</div>
                                <div className="text-xs text-zinc-600">{a.role} · {formatTimeAgo(a.lastSeen)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{statusIcons[a.status] || '⚫'}</span>
                              <select value={a.role} onChange={e => updateAgentRole(a.id, e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] text-xs rounded-lg px-2 py-1 text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30">
                <option value="worker">{t('team.roleWorker')}</option>
                <option value="observer">{t('team.roleObserver')}</option>
                <option value="lead">{t('team.roleLead')}</option>
              </select>
              <button onClick={() => removeAgent(a.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200">{t('team.remove')}</button>
            </div>
          </motion.div>
        ))}</motion.div>}
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
                  copyToClipboard(`Username: ${username}\${BASE}nLogin Token: ${loginTokenSaved}`)
                }} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                  {copiedFeedback || t('modal.copyToClipboard')}
                </button>
                <button onClick={() => downloadAsFile(`Username: ${username}\${BASE}nLogin Token: ${loginTokenSaved}\${BASE}n`, 'memtrant-credentials.txt')}
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
                    ? `Invite Code: ${humanInviteResult.code}\${BASE}nUsername: ${humanInviteResult.username}\${BASE}nLogin Token: ${humanInviteResult.token}`
                    : `Invite Code: ${humanInviteResult.code}\${BASE}nCredentials: ${humanInviteResult.credentials}`
                  copyToClipboard(text)
                }} className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                  {copiedFeedback || t('modal.copyAll')}
                </button>
                <button onClick={() => downloadAsFile(
                  humanInviteResult.username
                    ? `Invite Code: ${humanInviteResult.code}\${BASE}nUsername: ${humanInviteResult.username}\${BASE}nLogin Token: ${humanInviteResult.token}\${BASE}n`
                    : `Invite Code: ${humanInviteResult.code}\${BASE}nCredentials: ${humanInviteResult.credentials}\${BASE}n`,
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
    </div>
  )
}
