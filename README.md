/> # 🧠 MemTrant

**Transit Memory Server for AI Agent Teams**

MemTrant is a self-hosted shared memory server that lets AI agent teams coordinate, store files, and manage task instructions — all through a clean token-based API.

---

## ✨ Features

- **Teams** — Create and manage isolated teams, each with its own slug, description, and owner token
- **Agents** — Register AI agents with roles (`lead`, `worker`, `observer`) and track their status
- **Instructions** — Full task lifecycle: create, assign, prioritize, and track instructions across agents
- **Shared File Storage** — Upload, browse, and download files per team via a filesystem-based memory box
- **Invite System** — Generate invite codes for agents or humans to join teams
- **Token-Based Auth** — Secure, token-based authentication with customizable or auto-generated tokens
- **Multi-Language UI** — Full i18n support for English, Russian, Georgian, Arabic, and Hebrew (with RTL)
- **Dark Glassmorphism UI** — Modern, responsive interface built with Next.js 16, shadcn/ui, and Framer Motion
- **Dual Auth** — Supports both user login tokens (`login_` prefix) and team owner tokens (`mt_` prefix)

---

## 🏗 Architecture

```
User ──login──▸ Dashboard ──create──▸ Team ──register──▸ Agent(s)
                  │                        │
                  │                        ├─ Instructions (tasks)
                  │                        ├─ File Storage (memory box)
                  │                        └─ Invites (agent/human)
                  │
                  └─ Auth via login token or team owner token
```

### Data Model

| Model | Description |
|-------|-------------|
| **User** | Has a username and login token. Owns teams. |
| **Team** | Belongs to a user. Has slug, name, description, and owner token. Contains agents, instructions, and invites. |
| **Agent** | Belongs to a team. Has role (`lead`/`worker`/`observer`), token, and status. Can create and be assigned instructions. |
| **Instruction** | A task within a team. Has title, content, status, priority, and optional assignee. |
| **Invite** | A shareable code to invite agents or humans to a team. Supports max uses and expiration. |

### Token System

| Prefix | Type | Used For |
|--------|------|----------|
| `login_` | User login token | User authentication (signup/login) |
| `mt_` | Team owner token | Team-level API access |
| `agt_` | Agent token | Agent authentication and API access |
| `inv_` | Invite code | Claiming team invitations |

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- SQLite (bundled via Prisma)

### Installation

```bash
# Clone the repository
git clone https://github.com/romangalaxys10-spec/memtrant.git
cd memtrant

# Install dependencies
bun install

# Set up the database
bun run db:push

# Start development server
bun run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file (see `.env.example` or copy from existing):

```env
DATABASE_URL="file:./db/custom.db"
```

---

## 📡 API Reference

All API endpoints use JSON. Authentication is via `Authorization: Bearer <token>` header or `X-Memtrant-Token` header.

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user (optional custom token) |
| `POST` | `/api/auth/login` | Login with username + token |
| `GET` | `/api/auth/check` | Verify authentication |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams` | List user's teams |
| `POST` | `/api/teams` | Create a new team |
| `GET` | `/api/teams/[slug]` | Get team details |
| `PATCH` | `/api/teams/[slug]` | Update team |
| `DELETE` | `/api/teams/[slug]` | Delete team |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/agents/register` | Register a new agent |
| `GET` | `/api/teams/[slug]/agents` | List team agents |
| `DELETE` | `/api/teams/[slug]/agents/[id]` | Remove agent |

### Instructions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams/[slug]/instructions` | List instructions |
| `POST` | `/api/teams/[slug]/instructions` | Create instruction |
| `PATCH` | `/api/teams/[slug]/instructions/[id]` | Update instruction |
| `DELETE` | `/api/teams/[slug]/instructions/[id]` | Delete instruction |

### File Storage

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams/[slug]/files/[...path]` | Browse/download files |
| `PUT` | `/api/teams/[slug]/files/[...path]` | Upload file |
| `DELETE` | `/api/teams/[slug]/files/[...path]` | Delete file |

### Invites

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/teams/[slug]/invites` | Create invite code |
| `GET` | `/api/teams/[slug]/invites` | List invites |
| `POST` | `/api/invites/[code]` | Claim an invite |

### Public Team API (Token-Based)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/t/[slug]` | Public team info |
| `GET` | `/api/t/[slug]/agents` | Public agent list |
| `GET` | `/api/t/[slug]/instructions` | Public instructions |
| `GET/PUT/DELETE` | `/api/t/[slug]/files/[...path]` | Public file access |

---

## 🌍 Multi-Language Support

MemTrant's UI is fully translated into 5 languages with automatic RTL support:

| Language | Code | Direction |
|----------|------|-----------|
| English 🇺🇸 | `en` | LTR |
| Russian 🇷🇺 | `ru` | LTR |
| Georgian 🇬🇪 | `ka` | LTR |
| Arabic 🇸🇦 | `ar` | RTL |
| Hebrew 🇮🇱 | `he` | RTL |

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|----------|
| [Next.js 16](https://nextjs.org/) | Full-stack framework (App Router) |
| [TypeScript 5](https://www.typescriptlang.org/) | Type safety |
| [Prisma](https://www.prisma.io/) | ORM with SQLite |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Zustand](https://zustand.docs.pmnd.rs/) | Client state management |
| [Bun](https://bun.sh/) | JavaScript runtime & package manager |

---

## 📁 Project Structure

```
memtrant/
├── prisma/
│   └── schema.prisma          # Database schema (SQLite)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main SPA (dashboard, teams, agents, etc.)
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── api/
│   │       ├── auth/          # Register, login, check endpoints
│   │       ├── teams/         # Team CRUD, agents, instructions, invites, files
│   │       ├── agents/        # Agent registration
│   │       ├── invites/       # Invite claiming
│   │       └── t/[slug]/      # Public token-based team API
│   ├── components/ui/         # shadcn/ui components
│   └── lib/
│       ├── db.ts              # Prisma client
│       ├── auth.ts            # Authentication helpers
│       ├── i18n.ts            # Multi-language translations (5 languages)
│       ├── token.ts           # Token generation utilities
│       └── storage.ts         # Filesystem memory box CRUD
├── public/
│   ├── logo.svg               # App logo
│   └── robots.txt
├── package.json
├── bun.lock
└── Caddyfile                  # Reverse proxy config
```

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:reset` | Reset database |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 👨‍💻 Developer

**Roman** — [rommark.dev](https://www.rommark.dev)

- Telegram: [@VibeCodePrompterSystem](https://t.me/VibeCodePrompterSystem)
- LinkedIn: [Roman M.](https://www.linkedin.com/in/r%D0%BEman-m-793b3310/)
- LLM Tech Blog: [claw.rommark.dev](https://claw.rommark.dev)

---

<p align="center">
  <strong>Built with</strong> <a href="https://z.ai/subscribe?ic=R0K78RJKNW">Z.AI GLM 5 Turbo</a> — Get <strong>10% OFF</strong> with this <a href="https://z.ai/subscribe?ic=R0K78RJKNW">affiliate link</a>
</p>

<p align="center">
  <a href="https://github.com/romangalaxys10-spec/memtrant">
    <img src="https://img.shields.io/badge/Support%20on-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Support on GitHub" />
  </a>
</p>
