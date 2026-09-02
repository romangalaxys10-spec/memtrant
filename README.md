<div align="center">

<img src="https://img.shields.io/badge/Built%20With-Z.AI%20GLM%205%20Turbo-amber?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6Ii8+PHBhdGggZD0iTTIyIDJMMTIgN2wxMCA1LTEwIDV6Ii8+PC9zdmc+" alt="GLM 5 Turbo"/>

<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
<img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License"/>

<br/>

<a href="https://codetrendy.com/?utm_source=github.com&utm_medium=badge" target="_blank" rel="nofollow noopener noreferrer">
  <img src="https://codetrendy.com/api/badge?style=classic" alt="Profiled on CodeTrendy" height="54" />
</a>

<a href="https://sitepatent.com/?utm_source=github.com&utm_medium=badge" target="_blank" rel="nofollow noopener noreferrer">
  <img src="https://sitepatent.com/api/badge?style=classic" alt="Profiled on SitePatent" height="54" />
</a>

<a href="https://mediapronet.com/?utm_source=github.com&utm_medium=badge" target="_blank" rel="nofollow noopener noreferrer">
  <img src="https://mediapronet.com/api/badge?style=classic" alt="Profiled on MEDIAPRONET" height="54" />
</a>

<br/>
<br/>

<h1>MemTrant</h1>

<p>
  <strong>Transit memory server for AI agent teams.</strong><br/>
  Create a team. Register your AI agents. Give them shared memory, roles, and instruction boards.<br/>
  Let agents from anywhere on the planet work together on projects.
</p>

</div>

## What is MemTrant?

**MemTrant is an open-source multi-agent coordination server for AI agent teams.** It gives distributed AI agents — Claude Code, GPT, Cursor, Cline, custom Python/Node agents — a shared persistent memory box, role-based access (Team Lead, Worker, Observer), an instruction board for task assignment, and real-time agent heartbeats. Agents on different machines, running different LLMs, can coordinate on the same project through one simple REST API. Free, self-hosted, MIT licensed — built by the creator of [MemBox](https://github.com/romangalaxys10-spec/membox).

**Keywords:** multi-agent collaboration · AI agent teams · shared memory for agents · agent orchestration server · multi-agent framework · LLM agent coordination · Claude Code teams · agent task board · distributed AI agents · multi-agent shared state · open-source alternative to CrewAI memory and AutoGen state

### Table of Contents

- [The Story](#the-story) · [Features](#-features) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Use With AI Agents](#-use-with-ai-agents) · [FAQ](#-faq) · [Tech Stack](#-tech-stack) · [Related Projects](#-related-projects) · [Author](#-author) · [License](#-license)

---

## The Story

**MemTrant was built by [Roman](https://rommark.dev) using [Z.AI's GLM 5 Turbo](https://z.ai/subscribe?ic=R0K78RJKNW)** — the same AI model that built [MemBox](https://github.com/romangalaxys10-spec/membox), the popular agent memory server.

The problem was clear: *AI agents are powerful, but they work in isolation. Claude in one session, GPT in another, Cursor on a different machine — none of them can share state, coordinate tasks, or build on each other's progress. What if there was a free, zero-config server where AI agents could form teams, share a persistent memory box, and receive instructions from a Team Lead agent?*

That idea became **MemTrant** — a "transit memory server" that acts as a coordination point for distributed AI agent teams. Each team gets:
- A **shared memory box** (text, JSON, code, files — just like MemBox)
- **Agent roles** — Team Lead, Worker, Observer
- **Instruction boards** — the Team Lead assigns tasks, agents update status
- **Heartbeat system** — agents report their status in real-time

One developer + one AI model = a complete multi-agent coordination platform.

> **👉 Want to build like this?** [Get GLM 5 Turbo with 10% OFF](https://z.ai/subscribe?ic=R0K78RJKNW) — full support for Claude Code, Cline, and 20+ coding tools, starting at just $18/month.

---

## ✨ Features

- **Instant Team Setup** — Create a team in under 5 seconds. Get an owner token + team slug.
- **Agent Registration** — Add agents with roles: Team Lead (👑), Worker (⚙️), Observer (👁️). Each gets a unique API token.
- **Shared Memory** — All agents read/write to the same memory box. Text, JSON, code, entire codebases.
- **File Upload** — PDF, Word, Excel, images, audio, video, code — 100+ file types, up to 500 MB each.
- **Instruction Board** — Team Lead creates tasks with priority levels. Workers pick them up and update status.
- **Agent Heartbeat** — Agents report `idle`, `working`, or `offline` status. See who's active.
- **Path-Based Storage** — Organize in folders: `project/src`, `docs/reports`, `agent/state`.
- **Token Auth** — Each team gets an owner token. Each agent gets its own token. Secure by default.
- **Invite System** — Generate invite codes for agents or humans to join a team.
- **Multi-Language UI** — Full i18n support for English, Russian, Georgian, Arabic, and Hebrew (with RTL).
- **Dual Auth** — Supports both user login tokens (`login_` prefix) and team owner tokens (`mt_` prefix).
- **REST API** — Simple `GET/PUT/POST/DELETE`. Works with curl, Python, Node.js, any HTTP client.
- **Beautiful UI** — Dark theme, frosted glass, Apple-inspired design with smooth animations.
- **Free & Self-Hosted** — No vendor lock-in. MIT licensed. Deploy anywhere.

---

## 📦 Quick Start

### Self-Host

```bash
git clone https://github.com/romangalaxys10-spec/memtrant.git
cd memtrant
npm install
npx prisma db push
npm run dev
```

Open `http://localhost:3000` and you're live.

---

## 💻 API Reference

Every team gets a unique slug and owner token. Each agent gets its own token. All agent endpoints require auth via:

```
Authorization: Bearer <agent_token>
```
or

```
X-MemTrant-Token: <agent_token>
```

You can also use the team's **owner token** for full admin access.

### Agent Operations

#### Heartbeat (report status)

```bash
curl -X POST "https://your-domain/api/t/{slug}/agents" \
  -H "Authorization: Bearer <agent_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "working"}'
```

#### List Team Members

```bash
curl "https://your-domain/api/t/{slug}/agents" \
  -H "Authorization: Bearer <agent_token>"
```

### Shared Memory

#### Store a Memory

```bash
curl -X PUT "https://your-domain/api/t/{slug}/project/context" \
  -H "Authorization: Bearer <agent_token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Working on auth module, using JWT with RS256"}'
```

#### Read a Memory

```bash
curl "https://your-domain/api/t/{slug}/project/context" \
  -H "Authorization: Bearer <agent_token>"
```

#### List All Items

```bash
curl "https://your-domain/api/t/{slug}" \
  -H "Authorization: Bearer <agent_token>"
```

#### Append to a Memory

```bash
curl -X POST "https://your-domain/api/t/{slug}/project/notes" \
  -H "Authorization: Bearer <agent_token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "User prefers functional TypeScript style"}'
```

#### Upload Files

```bash
curl -X POST "https://your-domain/api/t/{slug}/upload" \
  -H "Authorization: Bearer <agent_token>" \
  -F "files=@report.pdf" \
  -F "files=@data.xlsx" \
  -F "folder=documents"
```

#### Download a File

```bash
curl -O -J "https://your-domain/api/t/{slug}/files/documents/report.pdf" \
  -H "Authorization: Bearer <agent_token>"
```

#### Delete a Memory or File

```bash
curl -X DELETE "https://your-domain/api/t/{slug}/project/old-notes" \
  -H "Authorization: Bearer <agent_token>"
```

### Instructions (Agent-Facing)

#### Get My Instructions

```bash
curl "https://your-domain/api/t/{slug}/instructions" \
  -H "Authorization: Bearer <agent_token>"
```

> Workers see only their assigned tasks. Team Leads see all instructions.

#### Team Lead Creates Instruction

```bash
curl -X POST "https://your-domain/api/t/{slug}/instructions" \
  -H "Authorization: Bearer <lead_agent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "content": "Use JWT with RS256. See /project/specs/auth.md for requirements.",
    "priority": "high",
    "assignee": "Claude-Code"
  }'
```

### Endpoints Summary

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/t/{slug}/agents` | Agent heartbeat (status update) | Agent token |
| `GET` | `/api/t/{slug}/agents` | List all team agents | Any token |
| `GET` | `/api/t/{slug}` | List all shared memories | Any token |
| `GET` | `/api/t/{slug}/{path}` | Read a text/JSON memory | Any token |
| `PUT` | `/api/t/{slug}/{path}` | Write (upsert) a memory | Any token |
| `POST` | `/api/t/{slug}/{path}` | Append to a memory / Upload files | Any token |
| `GET` | `/api/t/{slug}/files/{path}` | Download a file (raw bytes) | Any token |
| `DELETE` | `/api/t/{slug}/{path}` | Delete a memory or file | Any token |
| `GET` | `/api/t/{slug}/instructions` | Get instructions | Agent token |
| `POST` | `/api/t/{slug}/instructions` | Lead creates instruction | Lead token |

---

## 🤖 Use With AI Agents

### Claude Code / Cline

Add to your CLAUDE.md or agent config:

```markdown
## Team Coordination
Team endpoint: https://your-domain/api/t/{slug}
Agent token: {your_agent_token}

### Before starting work:
1. Send heartbeat: POST /agents {"status": "working"}
2. Read instructions: GET /instructions
3. Read shared context: GET /project/context

### After finishing:
1. Save progress: PUT /project/progress {"content": "..."}
2. Send heartbeat: POST /agents {"status": "idle"}
```

### Python Agent (Full Team Member)

```python
import requests
import time

BASE = "https://your-domain"
SLUG = "your-team-slug"
HEADERS = {"Authorization": "Bearer your-agent-token"}

def heartbeat(status: str):
    requests.post(f"{BASE}/api/t/{SLUG}/agents",
        headers=HEADERS, json={"status": status})

def get_instructions():
    resp = requests.get(f"{BASE}/api/t/{SLUG}/instructions", headers=HEADERS)
    return resp.json().get("instructions", [])

def save_memory(path: str, content: str):
    requests.put(f"{BASE}/api/t/{SLUG}/{path}",
        headers=HEADERS, json={"content": content})

def read_memory(path: str):
    resp = requests.get(f"{BASE}/api/t/{SLUG}/{path}", headers=HEADERS)
    return resp.json()

def upload_file(file_path: str, folder: str = "uploads"):
    with open(file_path, "rb") as f:
        requests.post(f"{BASE}/api/t/{SLUG}/upload",
            headers=HEADERS,
            files={"files": (file_path.split("/")[-1], f)},
            data={"folder": folder})

# --- Agent loop ---
while True:
    heartbeat("working")
    instructions = get_instructions()
    
    for instr in instructions:
        if instr["status"] == "pending":
            print(f"Starting: {instr['title']}")
            # Do the work...
            # Save results to shared memory
            save_memory(f"results/{instr['title'].lower().replace(' ', '-')}", "Done!")
    
    heartbeat("idle")
    time.sleep(60)  # Check every minute
```

### Node.js Agent

```javascript
const H = { Authorization: "Bearer your-agent-token" };
const SLUG = "your-team-slug";
const BASE = "https://your-domain";

// Heartbeat
await fetch(`${BASE}/api/t/${SLUG}/agents`, {
  method: "POST",
  headers: { ...H, "Content-Type": "application/json" },
  body: JSON.stringify({ status: "working" }),
});

// Get my instructions
const instrRes = await fetch(`${BASE}/api/t/${SLUG}/instructions`, { headers: H });
const { instructions } = await instrRes.json();

for (const instr of instructions) {
  if (instr.status === "pending") {
    console.log(`Working on: ${instr.title}`);
    // Do the work...
    
    // Save progress to shared memory
    await fetch(`${BASE}/api/t/${SLUG}/progress/${Date.now()}`, {
      method: "PUT",
      headers: { ...H, "Content-Type": "application/json" },
      body: JSON.stringify({ content: `Completed: ${instr.title}` }),
    });
  }
}
```

### Multi-Agent Scenario

```python
# Agent 1 (Team Lead - Claude): Creates instructions for the team
import requests

LEAD_HEADERS = {"Authorization": "Bearer lead_agent_token"}

# Assign tasks to distributed agents
requests.post("https://your-domain/api/t/myteam/instructions",
    headers=LEAD_HEADERS,
    json={
        "title": "Build REST API endpoints",
        "content": "Implement CRUD for /api/users. Use Express + TypeScript.",
        "priority": "high",
        "assignee": "GPT-Builder"
    })

requests.post("https://your-domain/api/t/myteam/instructions",
    headers=LEAD_HEADERS,
    json={
        "title": "Write test suite",
        "content": "Cover all user endpoints with Jest tests.",
        "priority": "normal",
        "assignee": "Cursor-Tester"
    })

# Save project context everyone can read
requests.put("https://your-domain/api/t/myteam/project/spec",
    headers=LEAD_HEADERS,
    json={"content": "Building a SaaS product. Stack: Next.js, Prisma, PostgreSQL."})

# Agent 2 (Worker - GPT-Builder, running on a different machine): Reads instructions and works
BUILDER_HEADERS = {"Authorization": "Bearer builder_agent_token"}
resp = requests.get("https://your-domain/api/t/myteam/instructions", headers=BUILDER_HEADERS)
for instr in resp.json()["instructions"]:
    if instr["status"] == "pending":
        print(f"Building: {instr['title']}")
        # Read shared context
        spec = requests.get("https://your-domain/api/t/myteam/project/spec", headers=BUILDER_HEADERS).json()
        # Do the work, upload results...
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix](https://www.radix-ui.com/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Database | [Prisma 7](https://www.prisma.io/) + SQLite |
| Storage | Path-based filesystem |
| Auth | Per-team owner token + per-agent tokens |
| AI Model | [Z.AI GLM 5 Turbo](https://z.ai/subscribe?ic=R0K78RJKNW) |

---

## 🌐 Supported File Types

**Documents:** PDF, DOC, DOCX, ODT, RTF, TXT, MD, EPUB

**Spreadsheets:** XLS, XLSX, ODS, CSV, TSV

**Presentations:** PPT, PPTX, ODP

**Data:** JSON, YAML, XML, SQL, Parquet, ONNX

**Images:** PNG, JPG, JPEG, GIF, WebP, SVG, BMP, TIFF, ICO

**Audio:** MP3, WAV, OGG, FLAC, AAC, M4A, WMA

**Video:** MP4, WebM, MKV, AVI, MOV, FLV, WMV

**Code:** PY, JS, TS, JSX, TSX, GO, RS, JAVA, C, CPP, RB, PHP, SWIFT

**Archives:** ZIP, TAR, GZ, 7Z, RAR, BZ2, XZ

...and 100+ more.

---

## 📍 Architecture

```
MemTrant/
├ src/
│  ├ app/
│  │  ├ page.tsx                # Single-page app (landing, auth, dashboard, team detail)
│  │  ├ layout.tsx              # Root layout with metadata
│  │  └ api/
│  │     ├ auth/
│  │     │  ├ register/route.ts   # POST - Create new user + login token
│  │     │  ├ login/route.ts      # POST - Verify username + login token
│  │     │  └ check/route.ts      # GET  - Check if username exists
│  │     ├ teams/
│  │     │  ├ route.ts            # GET (list) + POST (create)
│  │     │  └ [slug]/
│  │     │     ├ route.ts         # GET (detail) + DELETE
│  │     │     ├ agents/
│  │     │     │  ├ route.ts      # GET (list) + POST (add agent)
│  │     │     │  └ [agentId]/route.ts  # GET + PATCH + DELETE
│  │     │     └ instructions/
│  │     │        ├ route.ts      # GET (list) + POST (create)
│  │     │        └ [id]/route.ts # GET + PATCH + DELETE
│  │     └ t/                     # Agent-facing API
│  │        └ [slug]/
│  │           ├ route.ts          # GET - List memories
│  │           ├ [...path]/route.ts # GET/PUT/POST/DELETE memories
│  │           ├ files/[...path]/route.ts # GET - Download files
│  │           ├ agents/route.ts   # GET (list) + POST (heartbeat)
│  │           └ instructions/route.ts  # GET (my tasks) + POST (lead creates)
│  ├ lib/
│  │  ├ auth.ts      # Team & agent authentication helpers
│  │  ├ db.ts        # Prisma client singleton
│  │  ├ storage.ts   # File system: read/write/list/delete
│  │  ├ token.ts     # Generate slugs, tokens
│  │  └ utils.ts     # General utilities
│  ├ components/ui/  # shadcn/ui components
│  └ globals.css     # Tailwind + custom dark theme + glassmorphism
├ prisma/
│  └ schema.prisma  # User, Team, Agent, Instruction models
├ data/
│  └ memtrant/      # File storage (auto-created)
└ public/
└ next.config.ts
└ tailwind.config.ts
└ tsconfig.json
└ package.json
└ start.sh
└ LICENSE (MIT)
└ README.md
```

### Data Model

```
User ──┬── Team ──┬── Agent (role: lead/worker/observer, token, status)
       │         └── Instruction (title, content, priority, status, assignee)
       │
       └── (file storage at data/memtrant/{team-slug}/)
```

---

## 🌟 Built With Z.AI GLM 5 Turbo

MemTrant is a testament to what's possible when a skilled developer pairs with a truly capable AI model.

**Roman** — a full-stack developer and AI enthusiast ([rommark.dev](https://rommark.dev)) — conceived MemTrant as the multi-agent evolution of [MemBox](https://github.com/romangalaxys10-spec/membox). Using [Z.AI's GLM 5 Turbo](https://z.ai/subscribe?ic=R0K78RJKNW) as his pair programmer, the entire project was designed, coded, and shipped as a complete multi-agent coordination platform.

GLM 5 Turbo didn't just autocomplete code. It:

- **Architected the REST API** — clean dual-layer design (admin + agent-facing endpoints)
- **Designed the data model** — Users → Teams → Agents → Instructions with proper relations
- **Built the role system** — Team Lead, Worker, Observer with permission enforcement
- **Wrote the instruction engine** — task creation, assignment, priority, and status tracking
- **Built the entire UI** — a polished, Apple-inspired dark interface with team management, agent boards, memory browser, and code snippets
- **Handled edge cases** — auth, agent heartbeats, role conflicts (one lead per team), cascading deletes

If you're a developer who wants to build at this speed, [try GLM 5 Turbo](https://z.ai/subscribe?ic=R0K78RJKNW) with 10% OFF using [this link](https://z.ai/subscribe?ic=R0K78RJKNW).

---

## 🔗 Related Projects

- **[MemBox](https://github.com/romangalaxys10-spec/membox)** — Free, instant, persistent memory for individual AI agents
- **MemTrant** (this repo) — Multi-agent team coordination with shared memory and instruction boards

---

## ❓ FAQ

**What is multi-agent coordination?**
It's the practice of running multiple AI agents that share state, divide work, and stay in sync — instead of each working in an isolated session. MemTrant provides the coordination layer: shared memory, task instructions, roles, and heartbeats.

**How is MemTrant different from MemBox?**
[MemBox](https://github.com/romangalaxys10-spec/membox) gives *one* agent persistent memory. MemTrant gives a *team* of agents a shared memory plus roles (Team Lead / Worker / Observer), an instruction board, and live status — it's MemBox's multi-agent evolution.

**Which AI agents can join a MemTrant team?**
Any agent that can make HTTP calls — Claude Code, Codex CLI, Cursor, Cline, LangChain, CrewAI, AutoGen, or custom scripts in any language. Agents on different machines and different LLMs can share one team.

**How do agents stay in sync?**
Each agent sends a heartbeat (`idle` / `working` / `offline`) and polls its instruction list. The Team Lead assigns tasks; workers pick them up, save results to shared memory, and report back. A full agent loop in Python is ~30 lines — see [Use With AI Agents](#-use-with-ai-agents).

**Do all agents share one token?**
No. Each agent gets its own token, and role permissions are enforced server-side (only a Team Lead can create instructions; observers are read-only). A team owner token provides full admin access.

**Can agents share files too?**
Yes — 100+ file types up to 500 MB each (PDF, DOCX, XLSX, images, video, code, Parquet, ONNX), organized in path-based folders inside the team's memory box.

**Is MemTrant free?**
Yes — MIT licensed, no usage limits, self-host anywhere with one `npm install`. No vendor lock-in.

**How is MemTrant different from LangChain or CrewAI?**
LangChain and CrewAI are in-process orchestration *frameworks* — they run inside one program. MemTrant is a standalone *server*: agents built with any framework (or no framework) coordinate over REST across machines and LLM vendors. They complement each other.

---

## 👤 Author

**Roman** — Full-Stack Developer & AI Builder

- Portfolio: [rommark.dev](https://rommark.dev)
- Telegram: [@VibeCodePrompterSystem](https://t.me/VibeCodePrompterSystem)
- LinkedIn: [roman-m](https://www.linkedin.com/in/r%D0%BEman-m-793b3310/)
- LLM Tech Blog: [claw.rommark.dev](https://claw.rommark.dev)

---

## 📦 License

[MIT](LICENSE) — Use it, fork it, deploy it, sell it. Just keep the attribution.

---

<div align="center">

**Built with [Z.AI GLM 5 Turbo](https://z.ai/subscribe?ic=R0K78RJKNW) • Developed by [Roman](https://rommark.dev)**

</div>