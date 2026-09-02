# MemTrant Worklog

## Task 6 — Multi-Language UI, GitHub Badge, Z.AI Promo, Credits, Apple/Dell UI

**Summary:** Complete internationalization (5 languages), new landing page sections, and design overhaul.

### Files Created (1)
- `src/lib/i18n.ts` — 1250-line self-contained i18n system. 156 translation keys × 5 languages (EN/RU/KA/AR/HE). Exports: `Lang`, `LANGUAGES`, `translations`, `isRTL()`, `getTimeAgo()`, `useT()`. Proper pluralization for RU/AR/HE. Georgian in ქართული script.

### Files Modified (1)
- `src/app/page.tsx` — Complete rewrite (1366 lines):
  - **i18n**: All 156 strings use `t('key')` calls. Language selector in top-right on all views.
  - **RTL**: Arabic/Hebrew set `document.documentElement.dir = 'rtl'`
  - **GitHub Badge**: Immersive gradient banner linking to `https://github.com/romangalaxys10-spec/memtrant`
  - **Z.AI GLM 5 Turbo**: Glowing badge + promo card with invite link `https://z.ai/subscribe?ic=R0K78RJKNW`
  - **Credits Footer**: Developed by Roman, Telegram (@VibeCodePrompterSystem), LinkedIn, Portfolio (rommark.dev), LLM Blog (claw.rommark.dev)
  - **Apple/Dell Design**: Larger typography, rounded-2xl cards with `bg-white/[0.03] border-white/[0.06]`, refined buttons with rounded-2xl, generous whitespace, smooth transitions

### Verification
- ✅ All 5 languages verified via browser agent (EN/RU/KA/AR/HE)
- ✅ Language selector accessible from all views
- ✅ GitHub badge, Z.AI promo, credits all visible
- ✅ Auth form with token choice still works in all languages
- ✅ ESLint clean

---

## Task 5 — Fix "Unauthorized" on Create Team

**Summary:** Fixed the 401 Unauthorized error when clicking "Create New Team" from the dashboard. Root cause: `/api/teams` GET/POST required `ownerToken` auth (team-level) but the frontend sent no auth header at all.

### Files Modified (3)

**`src/lib/auth.ts`:**
- Added `authenticateUser()` — validates login tokens against User.loginToken
- Added `authenticateAny()` — dual auth that tries user auth first (login_ tokens), then team owner auth (mt_ tokens)

**`src/app/api/teams/route.ts`:**
- GET: Changed from `authenticateTeam` to `authenticateAny`. Now accepts user login tokens. Resolves userId from user or team auth.
- POST: Same change. Uses `description` field from body (was missing). Removed unused `userId` body param — auth header determines ownership.

**`src/app/page.tsx`:**
- Added `currentLoginToken` state — stores the authenticated user's login token
- `handleAuth()`: Sets `currentLoginToken` on both register (from server response) and login (from input)
- `loadTeams()`: Now sends `Authorization: Bearer ${currentLoginToken}` header
- `handleCreateTeam()`: Same auth header added, removed `userId` from body
- Logout: Clears `currentLoginToken` on sign out

### Verification (7-step curl E2E)
- ✅ Register user with custom token
- ✅ GET /api/teams with login token → empty array
- ✅ POST /api/teams with login token → team created
- ✅ GET /api/teams again → shows created team with _count
- ✅ GET /api/teams/{slug} with owner token → team detail
- ✅ POST add agent to team
- ✅ POST create agent invite

---

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
---
Task ID: apple-ux-polish
Agent: main
Task: Apply Apple/Steve Jobs-style magic touch UX tweaks to home page

Work Log:
- Created Apple-style CSS globals: custom thin scrollbar (macOS-style), emerald selection highlight, smooth scroll, antialiased font rendering
- Added keyframe animations: orb-drift (organic background motion), apple-float (hero emoji), shimmer (skeleton loading), fade-up-in (stagger entrance)
- Created CSS classes: apple-glass, apple-glass-strong (frosted glass surfaces), apple-btn-primary (light-sweep hover), apple-btn-secondary (lift hover), apple-shimmer (loading skeleton)
- Landing page: Staggered hero reveal with spring-bounce emoji entrance, blur-to-sharp title animation, floating brain emoji, 3 animated gradient orbs with drift, spring-physics feature card hovers with scale, refined CTA buttons with precise box-shadow layers
- Auth page: Glass card with backdrop-blur-60, spring-animated emoji, animated error messages (height + opacity), loading spinner replaces "..." text, refined input focus rings
- Dashboard: Sticky glass header with backdrop-blur-2xl, spring-animated logo, shimmer skeleton loading states, staggered team card entrance, empty state with floating envelope animation, team cards with spring hover lift
- Team detail: Sticky glass header, animated chevron back button, spring-physics animated tab underline (layoutId), shimmer loading states, staggered overview stat cards with scale entrance, agent list items with slide-in stagger
- Modals: Frosted glass backdrop (backdrop-blur-xl), spring entrance/exit animations (scale 0.92 + y:20), apple-glass-strong modal cards
- Footer: Refined typography, emerald hover accent on links, cleaner spacing
- Language selector: Glass styling, staggered entrance animation
- Buttons: All primary buttons use apple-btn-primary with light-sweep overlay, all secondary use apple-btn-secondary with lift effect
- All cards: Replaced bg-white/[0.03] with apple-glass for consistent frosted glass
- Fixed 3 JSX tag mismatch errors (motion.section/motion.div closing tags)
- Fixed duplicate transition prop lint error
- Verified in browser: landing renders with animations, auth view transitions smoothly, zero console errors

Stage Summary:
- Applied 30+ Apple-style UX improvements across all views
- Zero lint errors, zero runtime errors
- Key Apple design principles applied: spring physics, staggered reveals, frosted glass, organic motion, precise shadows, generous spacing, purposeful animation

