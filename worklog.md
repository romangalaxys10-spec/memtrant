# MemTrant Worklog

## Task 4 — Token Choice Feature (Custom vs Auto-Generate)

**Summary:** Added ability for users and agents to choose between providing a custom token or having the app auto-generate one during signup/registration.

### Files Modified (4)

**Backend API routes (3):**
- `src/app/api/auth/register/route.ts` — Now accepts optional `loginToken` field. If provided (min 8 chars) and unique, uses it. Otherwise auto-generates `login_` prefixed token.
- `src/app/api/agents/register/route.ts` — Now accepts optional `token` field. If provided (min 8 chars) and unique, uses it. Otherwise auto-generates `agt_` prefixed token.
- `src/app/api/invites/[code]/route.ts` — POST claim for agent type now accepts optional `token` field with same custom/auto logic.

**Frontend (1):**
- `src/app/page.tsx` — Added `tokenMode` state ('auto'|'custom'). Register form now shows two toggle buttons: "🔄 Auto-Generate" (default, selected) and "✏️ Custom Token". In auto mode, no token input shown and a helper text explains the token will appear after signup. In custom mode, a text input appears for entering a custom token (min 8 chars enforced on submit). Login mode unchanged (always requires token input).

### Verification
- Backend curl tests: ✅ Auto-generate creates `login_` prefix token, ✅ Custom token stored as-is, ✅ Login with custom token works, ✅ Wrong token rejected
- Visual browser test: ✅ Auto-Generate mode shows active toggle + no input, ✅ Custom Token mode shows active toggle + text input with placeholder

---

## Task 3-b — Backend Rebuild | Agent: backend-rebuild

**Date:** $(date -u +%Y-%m-%d\ %H:%M:%S) UTC
**Summary:** Rebuilt all backend files after deployment wipe.

### Files Created (17 total)

**Lib utilities (3):**
- `src/lib/token.ts` — Crypto token generators (mt_, agt_, inv_ prefixes, slug generator)
- `src/lib/storage.ts` — File system operations for team memory storage
- `src/lib/auth.ts` — Team and agent authentication helpers via Bearer/x-memtrant-token headers

**Auth API routes (3):**
- `src/app/api/auth/register/route.ts` — POST: create User with username + loginToken
- `src/app/api/auth/login/route.ts` — POST: verify username + loginToken credentials
- `src/app/api/auth/check/route.ts` — GET: check if username exists

**Team management API routes (8):**
- `src/app/api/teams/route.ts` — GET list / POST create teams (FK via user.id lookup)
- `src/app/api/teams/[slug]/route.ts` — GET detail with files / DELETE cascade
- `src/app/api/teams/[slug]/agents/route.ts` — GET list / POST add (one-lead enforcement)
- `src/app/api/teams/[slug]/agents/[agentId]/route.ts` — GET/PATCH/DELETE single agent
- `src/app/api/teams/[slug]/instructions/route.ts` — GET list / POST create (creatorId via user lookup)
- `src/app/api/teams/[slug]/instructions/[id]/route.ts` — GET/PATCH/DELETE single instruction
- `src/app/api/teams/[slug]/invites/route.ts` — GET list / POST create (human auto-creates User, agent creates code)

**Invite + Agent registration routes (2):**
- `src/app/api/invites/[code]/route.ts` — GET view invite / POST claim (agent creates Agent, human returns credentials)
- `src/app/api/agents/register/route.ts` — POST: agent self-registration via invite code

**Agent-facing API routes (4):**
- `src/app/api/t/[slug]/route.ts` — GET list all memories
- `src/app/api/t/[slug]/[...path]/route.ts` — GET/PUT/POST/DELETE shared memories + file upload
- `src/app/api/t/[slug]/files/[...path]/route.ts` — GET file download with MIME detection
- `src/app/api/t/[slug]/agents/route.ts` — GET list agents / POST heartbeat
- `src/app/api/t/[slug]/instructions/route.ts` — GET filtered instructions / POST create (lead only)

### Key Design Decisions
- All dynamic route params use `Promise<{...}>` pattern for Next.js 16 compatibility
- User FK lookups: routes receiving a username first resolve `db.user.findUnique({where:{username}})` then use `user.id`
- Team auth uses `ownerToken` matching; agent auth uses `token` with team include
- Invite system supports both agent (auto-creates Agent on claim) and human (auto-creates User with credentials) flows
- Agent-facing routes under `/t/` authenticate via agent token and verify team slug match
