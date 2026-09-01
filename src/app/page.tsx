'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
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

const modalOverlay = {
  initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 },
  transition: { duration: 0.2 },
}
const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
  transition: { duration: 0.2 },
}

// ── Home Component ─────────────────────────────────────────────────────────
export default function Home() {
  // View
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
      setCopiedFeedback('Copied!')
      setTimeout(() => setCopiedFeedback(''), 2000)
    })
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  async function handleAuth() {
    setAuthError('')
    setAuthLoading(true)
    try {
      const endpoint = authMode === 'register' ? `${API}/api/auth/register` : `${API}/api/auth/login`
      const body: any = { username }
      if (authMode === 'register') {
        // Send custom token only if user chose 'custom' mode
        if (tokenMode === 'custom' && loginToken.trim()) {
          body.loginToken = loginToken.trim()
        }
        // If auto mode, don't send loginToken — server generates it
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
    if (!confirm('Remove this agent?')) return
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
    if (!confirm('Delete this team? This cannot be undone.')) return
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
    } catch { setPreviewContent('Failed to load file.') }
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
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'agents', label: 'Agents', icon: '🤖' },
    { key: 'memory', label: 'Memory', icon: '🧠' },
    { key: 'instructions', label: 'Instructions', icon: '📋' },
    { key: 'invites', label: 'Invites', icon: '🔗' },
    { key: 'api', label: 'API', icon: '⚡' },
  ]

  // ── API Snippets ─────────────────────────────────────────────────────────
  const teamSlug = selectedTeam?.slug || 'my-team'
  const apiSnippets: Record<string, string> = {
    curl: `# Store files\n curl -X PUT \\
   ${API}/api/t/${teamSlug}/memory/context.md \\
   -H "Authorization: Bearer <AGENT_TOKEN>" \\
   -d "Shared context for the team"\n\n# Read files\n curl ${API}/api/t/${teamSlug}/memory/context.md \\
   -H "Authorization: Bearer <AGENT_TOKEN>"\n\n# Browse directory\n curl ${API}/api/t/${teamSlug}/memory/ \\
   -H "Authorization: Bearer <AGENT_TOKEN>"\n\n# Create instruction\n curl -X POST ${API}/api/teams/${teamSlug}/instructions \\
   -H "Authorization: Bearer <AGENT_TOKEN>" \\
   -H "Content-Type: application/json" \\
   -d '{"title":"Task","content":"Do something","priority":"normal"}'`,
    python: `import requests\n\nBASE = "${API}"\nHEADERS = {"Authorization": "Bearer <AGENT_TOKEN>"}\n\n# Store file\nrequests.put(f"{BASE}/api/t/${teamSlug}/memory/context.md",\n    headers=HEADERS, data="Shared context")\n\n# Read file\nr = requests.get(f"{BASE}/api/t/${teamSlug}/memory/context.md",\n    headers=HEADERS)\nprint(r.text)\n\n# Browse directory\nr = requests.get(f"{BASE}/api/t/${teamSlug}/memory/",\n    headers=HEADERS)\nprint(r.json())\n\n# Create instruction\nrequests.post(f"{BASE}/api/teams/${teamSlug}/instructions",\n    headers={**HEADERS, "Content-Type": "application/json"},\n    json={"title":"Task","content":"Do something","priority":"normal"})`,
    nodejs: `const BASE = "${API}";\nconst HEADERS = { Authorization: "Bearer <AGENT_TOKEN>" };\n\n// Store file\nawait fetch(\`\${BASE}/api/t/${teamSlug}/memory/context.md\`, {\n  method: "PUT", headers: HEADERS, body: "Shared context"\n});\n\n// Read file\nconst r = await fetch(\`\${BASE}/api/t/${teamSlug}/memory/context.md\`, { headers: HEADERS });\nconsole.log(await r.text());\n\n// Browse directory\nconst d = await fetch(\`\${BASE}/api/t/${teamSlug}/memory/\`, { headers: HEADERS });\nconsole.log(await d.json());\n\n// Create instruction\nawait fetch(\`\${BASE}/api/teams/${teamSlug}/instructions\`, {\n  method: "POST",\n  headers: { ...HEADERS, "Content-Type": "application/json" },\n  body: JSON.stringify({ title: "Task", content: "Do something", priority: "normal" })\n});`,
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="dark min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      <main className="flex-1 flex flex-col">

        {/* ════════════ LANDING ════════════ */}
        {view === 'landing' && (
          <section className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Gradient blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                MemTrant
              </h1>
              <p className="text-zinc-400 text-lg max-w-md mx-auto mb-2">
                Transit Memory Server for AI Agent Teams
              </p>
              <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-10">
                Shared memory, task coordination, and file storage — the backbone your agents need to collaborate effectively.
              </p>
              <div className="flex gap-4 justify-center">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setAuthMode('register'); setView('auth'); setTokenMode('auto'); setLoginToken('') }}
                  className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25">
                  Get Started
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => { setAuthMode('login'); setView('auth') }}
                  className="px-6 py-3 rounded-xl font-medium glass border border-zinc-700/50 text-zinc-300 hover:text-white">
                  Sign In
                </motion.button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="relative z-10 mt-16 grid grid-cols-3 gap-4 max-w-2xl w-full">
              {[
                { icon: '🧠', title: 'Shared Memory', desc: 'File-based storage agents can read & write' },
                { icon: '📋', title: 'Instructions', desc: 'Create, assign, and track tasks' },
                { icon: '🔗', title: 'Invite System', desc: 'Add agents and humans to your team' },
              ].map((f, i) => (
                <div key={i} className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="text-sm font-medium text-zinc-200">{f.title}</div>
                  <div className="text-xs text-zinc-500 mt-1">{f.desc}</div>
                </div>
              ))}
            </motion.div>
          </section>
        )}

        {/* ════════════ AUTH ════════════ */}
        {view === 'auth' && (
          <section className="flex-1 flex items-center justify-center p-4">
            <motion.div {...modalContent} className="glass rounded-2xl p-8 w-full max-w-md">
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">🧠</div>
                <h2 className="text-2xl font-bold text-zinc-100">{authMode === 'register' ? 'Create Account' : 'Sign In'}</h2>
                <p className="text-zinc-400 text-sm mt-1">MemTrant — Agent Team Memory Server</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Username</label>
                  <input value={username} onChange={e => setUsername(e.target.value)}
                    className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100"
                    placeholder="your-username" />
                </div>
                {authMode === 'register' ? (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-2">Login Token</label>
                    <div className="flex gap-2 mb-2">
                      <button type="button" onClick={() => { setTokenMode('auto'); setLoginToken(''); setAuthError('') }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${tokenMode === 'auto' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' : 'glass border border-border text-zinc-400 hover:text-zinc-200'}`}>
                        🔄 Auto-Generate
                      </button>
                      <button type="button" onClick={() => { setTokenMode('custom'); setAuthError('') }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${tokenMode === 'custom' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400' : 'glass border border-border text-zinc-400 hover:text-zinc-200'}`}>
                        ✏️ Custom Token
                      </button>
                    </div>
                    {tokenMode === 'custom' && (
                      <input value={loginToken} onChange={e => setLoginToken(e.target.value)}
                        type="text"
                        className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100"
                        placeholder="Enter your custom login token (min 8 chars)" />
                    )}
                    {tokenMode === 'auto' && (
                      <p className="text-xs text-zinc-500">A secure token will be generated for you. You'll see it after signup.</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Login Token</label>
                    <input value={loginToken} onChange={e => setLoginToken(e.target.value)}
                      type="password"
                      className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100"
                      placeholder="Enter your login token" />
                  </div>
                )}
                {authError && <p className="text-red-400 text-sm">{authError}</p>}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAuth} disabled={authLoading || !username || (authMode === 'login' && !loginToken) || (authMode === 'register' && tokenMode === 'custom' && loginToken.trim().length < 8)}
                  className="w-full py-2.5 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-50">
                  {authLoading ? '...' : authMode === 'register' ? 'Create Account' : 'Sign In'}
                </motion.button>
                <p className="text-center text-sm text-zinc-400">
                  {authMode === 'register' ? 'Already have an account?' : 'Need an account?'}{' '}
                  <button onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setAuthError(''); setTokenMode('auto'); setLoginToken('') }}
                    className="text-emerald-400 hover:underline">
                    {authMode === 'register' ? 'Sign In' : 'Register'}
                  </button>
                </p>
              </div>
            </motion.div>
          </section>
        )}

        {/* ════════════ DASHBOARD ════════════ */}
        {view === 'dashboard' && (
          <section className="flex-1 p-4 max-w-4xl mx-auto w-full">
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧠</span>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">MemTrant</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">{username}</span>
                <button onClick={() => { setCurrentLoginToken(''); setView('landing') }} className="text-xs text-zinc-500 hover:text-zinc-300">Logout</button>
              </div>
            </header>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-200">Your Teams</h2>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setNewTeamName(''); setNewTeamDesc(''); setTeamError(''); setShowNewTeam(true) }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                + New Team
              </motion.button>
            </div>

            {teamsLoading ? (
              <div className="text-center text-zinc-500 py-12">Loading teams...</div>
            ) : teams.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-zinc-400">No teams yet. Create your first team to get started.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {teams.map(team => (
                  <motion.div key={team.id} whileHover={{ scale: 1.01 }}
                    onClick={() => openTeam(team)}
                    className="glass glass-hover rounded-xl p-4 flex items-center justify-between cursor-pointer">
                    <div>
                      <h3 className="font-medium text-zinc-100">{team.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{team.description || 'No description'} · {team.slug}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      {team._count && <span>🤖 {team._count.agents}</span>}
                      {team._count && <span>📋 {team._count.instructions}</span>}
                      <span>{timeAgo(team.createdAt)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ════════════ TEAM DETAIL ════════════ */}
        {view === 'team' && selectedTeam && (
          <section className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
            {/* Team header */}
            <header className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('dashboard')} className="text-zinc-400 hover:text-zinc-100 text-sm">← Back</button>
                <div>
                  <h1 className="text-xl font-bold text-zinc-100">{selectedTeam.name}</h1>
                  <p className="text-xs text-zinc-500">/{selectedTeam.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowToken(true)} className="text-xs glass rounded-lg px-3 py-1.5 text-zinc-400 hover:text-zinc-200">
                  🔑 Token
                </button>
                <button onClick={() => deleteTeam(selectedTeam.slug)}
                  className="text-xs glass rounded-lg px-3 py-1.5 text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>
            </header>

            {/* Tabs */}
            <nav className="px-4 pt-3 flex gap-1 border-b border-border overflow-x-auto">
              {tabItems.map(t => (
                <button key={t.key} onClick={() => {
                  setTeamTab(t.key)
                  if (t.key === 'memory' && !memoryPath && files.length === 0) browsePath('')
                  if (t.key === 'invites' && invites.length === 0) loadInvites(selectedTeam.slug)
                }}
                  className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    teamTab === t.key
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}>
                  <span className="mr-1.5">{t.icon}</span>{t.label}
                </button>
              ))}
            </nav>

            {/* Tab content */}
            <div className="flex-1 p-4 overflow-auto">
              {teamLoading ? <div className="text-center text-zinc-500 py-12">Loading...</div> : (
                <>
                  {/* ── OVERVIEW ── */}
                  {teamTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Agents', value: agents.length, icon: '🤖' },
                          { label: 'Instructions', value: instructions.length, icon: '📋' },
                          { label: 'Files', value: selectedTeam.fileCount || 0, icon: '📁' },
                          { label: 'Storage', value: formatBytes(selectedTeam.totalSize || 0), icon: '💾' },
                        ].map((s, i) => (
                          <div key={i} className="glass rounded-xl p-4">
                            <div className="text-xs text-zinc-500 mb-1">{s.icon} {s.label}</div>
                            <div className="text-2xl font-bold text-zinc-100">{s.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="glass rounded-xl p-4">
                        <h3 className="text-sm font-medium text-zinc-300 mb-2">Description</h3>
                        <p className="text-sm text-zinc-400">{selectedTeam.description || 'No description set.'}</p>
                      </div>
                      <div className="glass rounded-xl p-4">
                        <h3 className="text-sm font-medium text-zinc-300 mb-2">Team Lead</h3>
                        {agents.find(a => a.role === 'lead')
                          ? <p className="text-sm text-zinc-400">👑 {agents.find(a => a.role === 'lead')!.name}</p>
                          : <p className="text-sm text-zinc-500">No lead assigned.</p>}
                      </div>
                      <div className="glass rounded-xl p-4">
                        <h3 className="text-sm font-medium text-zinc-300 mb-3">Recent Instructions</h3>
                        {instructions.length === 0
                          ? <p className="text-sm text-zinc-500">No instructions yet.</p>
                          : <div className="space-y-2">{instructions.slice(0, 5).map(inst => (
                            <div key={inst.id} className="flex items-center justify-between text-sm">
                              <span className="text-zinc-300">{inst.title}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[inst.status] || statusColors.pending}`}>{inst.status}</span>
                            </div>
                          ))}</div>}
                      </div>
                    </div>
                  )}

                  {/* ── AGENTS ── */}
                  {teamTab === 'agents' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-zinc-200">Agents ({agents.length})</h2>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => { setNewAgentName(''); setNewAgentRole('worker'); setShowNewAgent(true) }}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                          + Add Agent
                        </motion.button>
                      </div>
                      {agents.length === 0
                        ? <div className="glass rounded-2xl p-12 text-center text-zinc-500">No agents yet.</div>
                        : <div className="space-y-2">{agents.map(a => (
                          <div key={a.id} className="glass rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{roleIcons[a.role] || '🤖'}</span>
                              <div>
                                <div className="font-medium text-zinc-100">{a.name}</div>
                                <div className="text-xs text-zinc-500">{a.role} · {timeAgo(a.lastSeen)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{statusIcons[a.status] || '⚫'}</span>
                              <select value={a.role} onChange={e => updateAgentRole(a.id, e.target.value)}
                className="bg-input border border-border text-xs rounded-lg px-2 py-1 text-zinc-300 focus:outline-none">
                <option value="worker">Worker</option>
                <option value="observer">Observer</option>
                <option value="lead">Lead</option>
              </select>
              <button onClick={() => removeAgent(a.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
            </div>
          </div>
        ))}</div>}
                    </div>
                  )}

                  {/* ── MEMORY ── */}
                  {teamTab === 'memory' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <span className="text-zinc-500">Path:</span>
                          <span className="font-mono text-xs text-emerald-400">/{memoryPath || 'root'}</span>
                        </div>
                        <button onClick={() => browsePath('')} className="text-xs text-zinc-400 hover:text-zinc-200">Root</button>
                      </div>
                      {files.length === 0 && !memoryPath && <div className="glass rounded-2xl p-12 text-center text-zinc-500">Memory is empty. Agents can write files here via API.</div>}
                      {files.length > 0 && (
                        <div className="glass rounded-xl divide-y divide-border">
                          {memoryPath && (
                            <button onClick={() => browsePath(memoryPath.split('/').slice(0, -1).join('/'))}
                              className="w-full px-4 py-3 text-left text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-2">
                              <span>⬆️</span> ..
                            </button>
                          )}
                          {files.map((f, i) => (
                            <button key={i} onClick={() => f.type === 'directory' ? browsePath(memoryPath ? `${memoryPath}/${f.name}` : f.name) : previewFile(f.name)}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center justify-between">
                              <span className={`flex items-center gap-2 ${f.type === 'directory' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                <span>{f.type === 'directory' ? '📁' : '📄'}</span> {f.name}
                              </span>
                              {f.size != null && <span className="text-xs text-zinc-500">{formatBytes(f.size)}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {previewName && (
                        <div className="glass rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-zinc-300">📄 {previewName}</span>
                            <button onClick={() => { setPreviewContent(''); setPreviewName('') }} className="text-xs text-zinc-500 hover:text-zinc-300">Close</button>
                          </div>
                          <pre className="bg-black/40 rounded-lg p-4 text-xs text-zinc-300 overflow-auto max-h-96 font-mono whitespace-pre-wrap">{previewContent}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── INSTRUCTIONS ── */}
                  {teamTab === 'instructions' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-zinc-200">Instructions ({instructions.length})</h2>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => { setNewInstTitle(''); setNewInstContent(''); setNewInstPriority('normal'); setNewInstAssigneeId(''); setShowNewInstruction(true) }}
                          className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                          + New Instruction
                        </motion.button>
                      </div>
                      {instructions.length === 0
                        ? <div className="glass rounded-2xl p-12 text-center text-zinc-500">No instructions yet.</div>
                        : <div className="space-y-2">{instructions.map(inst => (
                          <div key={inst.id} className="glass rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-medium text-zinc-100">{inst.title}</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {inst.assignee ? `→ ${inst.assignee.name}` : 'Unassigned'} · {timeAgo(inst.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[inst.priority] || priorityColors.normal}`}>{inst.priority}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[inst.status] || statusColors.pending}`}>{inst.status}</span>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-400 mb-3">{inst.content}</p>
                            <div className="flex gap-1.5">
                              {(['pending', 'in_progress', 'done', 'failed'] as InstructionStatus[]).map(s => (
                                <button key={s} onClick={() => updateInstructionStatus(inst.id, s)}
                                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${inst.status === s ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' : 'border-border text-zinc-500 hover:text-zinc-300'}`}>
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
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-zinc-200">Invites ({invites.length})</h2>
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setInviteAgentRole('worker'); setInviteExpiryHours('24'); setInviteResult(null); setShowNewInviteAgent(true) }}
                            className="px-4 py-2 rounded-lg text-sm font-medium glass border border-border text-zinc-300 hover:text-white">
                            + Invite Agent
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => { setHumanInviteResult(null); handleCreateInvite('human') }}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                            + Invite Human
                          </motion.button>
                        </div>
                      </div>
                      {invites.length === 0
                        ? <div className="glass rounded-2xl p-12 text-center text-zinc-500">No invites yet.</div>
                        : <div className="space-y-2">{invites.map(inv => (
                          <div key={inv.id} className="glass rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${inv.type === 'human' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 'bg-sky-500/20 text-sky-400 border-sky-500/30'}`}>
                                {inv.type}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs font-mono text-emerald-400" onClick={() => copyToClipboard(inv.code)} title="Click to copy">{inv.code.slice(0, 12)}...</code>
                                </div>
                                <div className="text-xs text-zinc-500 mt-0.5">
                                  {inv.role && <span>Role: {inv.role} · </span>}
                                  {timeAgo(inv.createdAt)}
                                  {inv.expiresAt && <span> · Exp: {new Date(inv.expiresAt).toLocaleDateString()}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                inv.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : inv.status === 'used' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'}`}>
                                {inv.status}
                              </span>
                              <span className="text-xs text-zinc-500">{inv.useCount}/{inv.maxUses || '∞'}</span>
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
                                }} className="text-xs text-violet-400 hover:text-violet-300">
                                  View Credentials
                                </button>
                              )}
                            </div>
                          </div>
                        ))}</div>}
                    </div>
                  )}

                  {/* ── API ── */}
                  {teamTab === 'api' && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-zinc-200">API Reference</h2>
                      <div className="glass rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border">
                            <th className="text-left px-4 py-2 text-zinc-400 font-medium">Method</th>
                            <th className="text-left px-4 py-2 text-zinc-400 font-medium">Endpoint</th>
                            <th className="text-left px-4 py-2 text-zinc-400 font-medium">Description</th>
                          </tr></thead>
                          <tbody className="divide-y divide-border">
                            {[
                              ['PUT', `/api/t/${teamSlug}/memory/<path>`, 'Store/update a file'],
                              ['GET', `/api/t/${teamSlug}/memory/<path>`, 'Read a file or browse directory'],
                              ['DELETE', `/api/t/${teamSlug}/memory/<path>`, 'Delete a file'],
                              ['POST', `/api/teams/${teamSlug}/instructions`, 'Create instruction'],
                              ['GET', `/api/teams/${teamSlug}/instructions`, 'List instructions'],
                              ['PATCH', `/api/teams/${teamSlug}/instructions/:id`, 'Update instruction'],
                              ['GET', `/api/teams/${teamSlug}/agents`, 'List agents'],
                              ['POST', `/api/teams/${teamSlug}/invites`, 'Create invite'],
                              ['GET', `/api/teams/${teamSlug}/invites`, 'List invites'],
                            ].map(([m, ep, desc], i) => (
                              <tr key={i}>
                                <td className="px-4 py-2"><span className={`text-xs px-1.5 py-0.5 rounded font-mono ${m === 'GET' ? 'bg-emerald-500/20 text-emerald-400' : m === 'POST' ? 'bg-sky-500/20 text-sky-400' : m === 'PATCH' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{m}</span></td>
                                <td className="px-4 py-2 font-mono text-xs text-zinc-300">{ep}</td>
                                <td className="px-4 py-2 text-zinc-400">{desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="glass rounded-xl p-4">
                        <div className="flex gap-1 mb-3">
                          {(['curl', 'python', 'nodejs'] as const).map(t => (
                            <button key={t} onClick={() => setSnippetTab(t)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${snippetTab === t ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                              {t}
                            </button>
                          ))}
                        </div>
                        <pre className="bg-black/40 rounded-lg p-4 text-xs text-zinc-300 overflow-auto max-h-96 font-mono whitespace-pre-wrap">{apiSnippets[snippetTab]}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="mt-auto glass border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
        MemTrant — Transit Memory Server for AI Agent Teams
      </footer>

      {/* ════════════════════════════════════════════════════════════════════════
          MODALS
         ════════════════════════════════════════════════════════════════════════ */}

      {/* ── Signup Modal ── */}
      <AnimatePresence>
        {showSignupModal && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div {...modalContent} className="glass rounded-2xl p-8 w-full max-w-md relative">
              <h2 className="text-xl font-bold text-zinc-100 mb-1">Account Created!</h2>
              <p className="text-sm text-zinc-400 mb-4">Save your credentials now. They will not be shown again.</p>
              <div className="space-y-3 mb-4">
                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Username</div>
                  <div className="font-mono text-sm text-emerald-400 break-all">{username}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Login Token</div>
                  <div className="font-mono text-sm text-emerald-400 break-all select-all">{loginTokenSaved}</div>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => {
                  copyToClipboard(`Username: ${username}\nLogin Token: ${loginTokenSaved}`)
                }} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                  {copiedFeedback || 'Copy to Clipboard'}
                </button>
                <button onClick={() => downloadAsFile(`Username: ${username}\nLogin Token: ${loginTokenSaved}\n`, 'memtrant-credentials.txt')}
                  className="flex-1 py-2 rounded-lg text-sm font-medium glass border border-border text-zinc-300">
                  Download as File
                </button>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-red-400 mb-1.5">⚠️ Do NOT close this window until you've saved your credentials!</p>
                <ul className="text-xs text-red-300/70 space-y-1 list-disc list-inside">
                  <li>There is no password recovery</li>
                  <li>Losing your token means losing access</li>
                  <li>Store it in a secure password manager</li>
                </ul>
              </div>
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <input type="checkbox" checked={savedOfflineChecked} onChange={e => setSavedOfflineChecked(e.target.checked)}
                  className="mt-0.5 accent-emerald-500" />
                <span className="text-sm text-zinc-400">I have saved my username and login token offline and understand I cannot recover them.</span>
              </label>
              <button onClick={() => { setShowSignupModal(false); setSavedOfflineChecked(false) }}
                disabled={!savedOfflineChecked}
                className="w-full py-2.5 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-40">
                Continue to Dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Team Modal ── */}
      <AnimatePresence>
        {showNewTeam && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowNewTeam(false)}>
            <motion.div {...modalContent} className="glass rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-4">Create New Team</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Team Name</label>
                  <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                    className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100"
                    placeholder="my-awesome-team" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Description (optional)</label>
                  <textarea value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} rows={2}
                    className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100 resize-none"
                    placeholder="What is this team for?" />
                </div>
                {teamError && <p className="text-red-400 text-sm">{teamError}</p>}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowNewTeam(false)} className="flex-1 py-2 rounded-lg text-sm glass border border-border text-zinc-400">Cancel</button>
                  <button onClick={handleCreateTeam} disabled={!newTeamName}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-40">
                    Create Team
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
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowNewAgent(false)}>
            <motion.div {...modalContent} className="glass rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-4">Add Agent</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Agent Name</label>
                  <input value={newAgentName} onChange={e => setNewAgentName(e.target.value)}
                    className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100"
                    placeholder="agent-name" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Role</label>
                  <select value={newAgentRole} onChange={e => setNewAgentRole(e.target.value as AgentRole)}
                    className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100">
                    <option value="worker">⚙️ Worker</option>
                    <option value="observer">👁️ Observer</option>
                    <option value="lead">👑 Lead</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowNewAgent(false)} className="flex-1 py-2 rounded-lg text-sm glass border border-border text-zinc-400">Cancel</button>
                  <button onClick={handleAddAgent} disabled={!newAgentName}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-40">
                    Add Agent
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
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowNewInstruction(false)}>
            <motion.div {...modalContent} className="glass rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-4">New Instruction</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Title</label>
                  <input value={newInstTitle} onChange={e => setNewInstTitle(e.target.value)}
                    className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100"
                    placeholder="Task title" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Content</label>
                  <textarea value={newInstContent} onChange={e => setNewInstContent(e.target.value)} rows={3}
                    className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100 resize-none"
                    placeholder="Describe the task..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Priority</label>
                    <select value={newInstPriority} onChange={e => setNewInstPriority(e.target.value as InstructionPriority)}
                      className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Assignee</label>
                    <select value={newInstAssigneeId} onChange={e => setNewInstAssigneeId(e.target.value)}
                      className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100">
                      <option value="">Unassigned</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowNewInstruction(false)} className="flex-1 py-2 rounded-lg text-sm glass border border-border text-zinc-400">Cancel</button>
                  <button onClick={handleCreateInstruction} disabled={!newInstTitle}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-40">
                    Create
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
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowNewInviteAgent(false)}>
            <motion.div {...modalContent} className="glass rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-4">Invite Agent</h2>
              {inviteResult ? (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-400">Invite created! Share this code with the agent:</p>
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-1">Invite Code</div>
                    <code className="text-sm text-emerald-400 break-all select-all">{inviteResult.code}</code>
                  </div>
                  {inviteResult.token && (
                    <div className="bg-black/40 rounded-lg p-3">
                      <div className="text-xs text-zinc-500 mb-1">Agent Token</div>
                      <code className="text-sm text-cyan-400 break-all select-all">{inviteResult.token}</code>
                    </div>
                  )}
                  <button onClick={() => { copyToClipboard(inviteResult.code); setInviteResult(null); setShowNewInviteAgent(false) }}
                    className="w-full py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                    {copiedFeedback || 'Copy Code & Close'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Role</label>
                    <select value={inviteAgentRole} onChange={e => setInviteAgentRole(e.target.value as AgentRole)}
                      className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100">
                      <option value="worker">⚙️ Worker</option>
                      <option value="observer">👁️ Observer</option>
                      <option value="lead">👑 Lead</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Expires In (hours, optional)</label>
                    <input value={inviteExpiryHours} onChange={e => setInviteExpiryHours(e.target.value)}
                      className="w-full bg-input border border-border text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/50 text-zinc-100"
                      placeholder="24" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowNewInviteAgent(false)} className="flex-1 py-2 rounded-lg text-sm glass border border-border text-zinc-400">Cancel</button>
                    <button onClick={() => handleCreateInvite('agent')}
                      className="flex-1 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                      Create Invite
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
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div {...modalContent} className="glass rounded-2xl p-6 w-full max-w-md">
              <div className="text-center py-8">
                <div className="text-3xl mb-3 animate-spin">⏳</div>
                <p className="text-zinc-400">Creating human invite...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Human Invite Result Modal ── */}
      <AnimatePresence>
        {humanInviteResult && !showNewInviteHuman && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div {...modalContent} className="glass rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-zinc-100 mb-1">Human Invite Created</h2>
              <p className="text-sm text-amber-400 mb-4">Share These Credentials</p>
              <div className="space-y-3 mb-4">
                <div className="bg-black/40 rounded-lg p-3">
                  <div className="text-xs text-zinc-500 mb-1">Invite Code</div>
                  <code className="text-sm text-emerald-400 break-all select-all">{humanInviteResult.code}</code>
                </div>
                {humanInviteResult.username && (
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-1">Username</div>
                    <code className="text-sm text-cyan-400 break-all select-all">{humanInviteResult.username}</code>
                  </div>
                )}
                {humanInviteResult.token && (
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-xs text-zinc-500 mb-1">Login Token</div>
                    <code className="text-sm text-violet-400 break-all select-all">{humanInviteResult.token}</code>
                  </div>
                )}
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-400 font-medium">⚠️ Share these login credentials with the human. They will NOT be shown again.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  const text = humanInviteResult.username
                    ? `Invite Code: ${humanInviteResult.code}\nUsername: ${humanInviteResult.username}\nLogin Token: ${humanInviteResult.token}`
                    : `Invite Code: ${humanInviteResult.code}\nCredentials: ${humanInviteResult.credentials}`
                  copyToClipboard(text)
                }} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                  {copiedFeedback || 'Copy All'}
                </button>
                <button onClick={() => downloadAsFile(
                  humanInviteResult.username
                    ? `Invite Code: ${humanInviteResult.code}\nUsername: ${humanInviteResult.username}\nLogin Token: ${humanInviteResult.token}\n`
                    : `Invite Code: ${humanInviteResult.code}\nCredentials: ${humanInviteResult.credentials}\n`,
                  `memtrant-human-invite-${humanInviteResult.code}.txt`
                )} className="flex-1 py-2 rounded-lg text-sm glass border border-border text-zinc-300">
                  Download
                </button>
              </div>
              <button onClick={() => setHumanInviteResult(null)}
                className="w-full mt-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Token Modal ── */}
      <AnimatePresence>
        {showToken && selectedTeam && (
          <motion.div {...modalOverlay} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowToken(false)}>
            <motion.div {...modalContent} className="glass rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-zinc-100 mb-2">Owner Token</h2>
              <p className="text-xs text-zinc-500 mb-3">Use this token for admin API operations. Keep it secret.</p>
              <div className="bg-black/40 rounded-lg p-3 mb-4">
                <code className="text-sm text-emerald-400 break-all select-all font-mono">{selectedTeam.ownerToken}</code>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(selectedTeam.ownerToken)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                  {copiedFeedback || 'Copy Token'}
                </button>
                <button onClick={() => setShowToken(false)} className="flex-1 py-2 rounded-lg text-sm glass border border-border text-zinc-400">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}