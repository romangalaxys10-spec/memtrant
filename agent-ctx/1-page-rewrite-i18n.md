# Task 1 — Page Rewrite: i18n, GitHub Badge, Promo, Credits, Apple/Dell UX

**Summary:** Complete rewrite of `src/app/page.tsx` (1366 lines) adding i18n integration, GitHub badge, Z.AI promo section, credits footer, and Apple/Dell-inspired UX improvements.

### Changes Made

1. **i18n Integration**
   - Imported `{ Lang, LANGUAGES, isRTL, getTimeAgo, useT }` from `@/lib/i18n`
   - Added `lang` state with `useState<Lang>('en')`
   - Created `t = useT(lang)` translator function
   - Created `formatTimeAgo()` using `getTimeAgo(lang)` replacing old `timeAgo()`
   - All hardcoded strings replaced with `t('key')` calls
   - RTL support via `useEffect` setting `document.documentElement.dir` and `lang`
   - Language selector dropdown (fixed top-right, z-40) with flags and native labels

2. **GitHub Badge**
   - Below feature cards on landing, before promo
   - Gradient bg from-gray-800 to-gray-900, GitHub SVG icon
   - Motion fade-in with delay 0.55s
   - Links to https://github.com/romangalaxys10-spec/memtrant

3. **Z.AI GLM 5 Turbo Promo**
   - Below GitHub badge on landing page
   - Glowing pill badge, dark glassmorphism card
   - Gradient border accent, blur glow effects
   - CTA button to https://z.ai/subscribe?ic=R0K78RJKNW
   - Motion fade-in with delay 0.7s

4. **Credits/Footer**
   - Comprehensive footer with footer.text, developer credit, links
   - Telegram, LinkedIn, Portfolio, LLM Blog links (all target=_blank, rel=noopener nofollow)
   - Clean minimal Apple-inspired design with `·` separators

5. **Apple/Dell UX/UI**
   - Larger hero: text-6xl/7xl, tracking-tight
   - Cards: `bg-white/[0.03] border border-white/[0.06] rounded-2xl` (replaced `glass`)
   - Buttons: `rounded-2xl`, shadow-lg, hover:shadow transitions
   - Modals: `rounded-3xl`, p-8/p-10, smoother ease animation
   - Inputs: `rounded-xl`, subtle focus:ring-emerald-500/30
   - Generous whitespace throughout (py-20/28, mb-10/12, gap-4/5/6)
   - Zinc-500/600 for muted text, zinc-300 for secondary
   - All interactive elements have smooth transitions

### Preserved
- All state variables, interfaces, async functions, business logic
- All 8 modals (signup, new team, new agent, new instruction, invite agent, invite human, human invite result, token)
- All API endpoints and fetch calls
- `API = ''` constant
- All helper functions (formatBytes, copyToClipboard, downloadAsFile)
- Fixed variable shadowing (`t` → `tab` in map, `t` → `snippet` in snippet tabs)

### i18n Keys Used: 156/156
All translation keys from i18n.ts are used in the component.

### Line Count: 1366
