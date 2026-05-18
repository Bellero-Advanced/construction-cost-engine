# Construction Cost Engine — Session Memory

## Current State
- **Phase:** Phase 1 — Foundation + 8 pages complete (uncommitted)
- **Stack:** Next.js 16 + React 19 + TypeScript (strict) + Tailwind CSS 4 inline `@theme` + Recharts + next-intl (TH) + Cloudflare Workers via `@opennextjs/cloudflare`
- **Live URL:** (not deployed yet — needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` GitHub secrets)
- **Worker name:** `construction-cost-engine`
- **GitHub repo:** (new repo to be created)
- **Backend:** None — all mock data in `src/data/`
- **Last updated:** 2026-05-19

## Project Identity
Construction Cost Engine — Demo/prototype calculator for material cost estimation, sourcing prices from 6 sources (TPSO + CGD government, HomePro + Global House + Thai Watsadu + BnB Home retail) across 10 Thai provinces, 20 materials, 12-month trend.

Adapted from Factory Landing's Korn framework — same agent/workflow/skill architecture, but light "Ink & Paper" blueprint theme instead of dark crimson, no backend, TH-only i18n.

## Pages (all in `src/app/[locale]/`)
- [x] `/` — Home (hero + 6 source cards + 3 category cards)
- [x] `/wall-tile` — Wall + Tile calculator
- [x] `/column-beam` — Column + Beam concrete calculator
- [x] `/rebar` — Rebar calculator with dynamic row list
- [x] `/compare` — 10-province price comparison (Recharts horizontal bar)
- [x] `/stores` — 6-source comparison + insight panel (Recharts vertical bar)
- [x] `/trend` — 12-month trend (single material line OR all-rebar multi-line)
- [x] `/sources` — Source detail viewer with table + JSON sample

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Modern SSR + future RSC support |
| Charts | Recharts | React-native, tree-shakes well, matches factory-landing |
| Styling | Tailwind CSS 4 inline `@theme` | No `tailwind.config.ts`; tokens live in `globals.css` |
| i18n | next-intl, single TH locale | Architectured for EN/ZH future expansion |
| Data | Mock TS files | Demo only; deterministic `getPrice` with material-seeded variation |
| Backend | None | User confirmed demo-only |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` | Matches factory-landing infra |

## Files Created (this session)
- `package.json` — swapped Chart.js → Recharts, added `@opennextjs/cloudflare` + `wrangler` + `lucide-react`
- `next.config.ts` — next-intl plugin pointing to `./src/i18n.ts`, `ignoreBuildErrors`, `optimizePackageImports`
- `tsconfig.json` — `@/*` → `./src/*`
- `wrangler.jsonc`, `open-next.config.ts`
- `.github/workflows/deploy.yml` — typecheck → build → deploy on push to `main`
- `src/i18n.ts`, `src/middleware.ts`, `src/messages/th.json` (~150 keys)
- `src/app/{layout.tsx, globals.css}` + `src/app/[locale]/{layout.tsx, page.tsx, 7 page dirs}`
- `src/data/{sources, materials, provinces, prices}.ts`
- `src/lib/{pricing, calculators, utils}.ts`
- `src/types/index.ts`
- `src/components/{ui/{Button,Doc,Badge,Field,Stat}.tsx, layout/{Header,Footer}.tsx, calculator/{CalculatorResult,Selectors}.tsx}`
- `.korn/integration-summary.md` (Korn adaptation guide)
- `.claude/rules/{engineering,session-continuity}.md`
- Updated `CLAUDE.md` (Workers instead of Pages, Recharts instead of Chart.js, no Supabase)

## Files Deleted
- `app/{page,layout,globals.css}.tsx` (create-next-app boilerplate)
- `tailwind.config.ts` (v3-style; replaced by Tailwind 4 inline `@theme` in `globals.css`)

## Known Issues / TODO
- **Not yet deployed** — need GitHub repo creation + Cloudflare secrets
- **Home page (`/[locale]`)** is dynamic (ƒ) instead of SSG (●) because `useTranslations` defers — call `setRequestLocale(locale)` in `page.tsx` to fix (cosmetic; not blocking deploy)
- Mobile responsive polish needed (currently desktop-first)
- No SEO `generateMetadata` per page yet — only root metadata in `[locale]/layout.tsx`
- Body grid background renders on every page — verify it's readable behind charts

## Verified This Session (2026-05-19)
- ✅ `npm install` — 704 packages
- ✅ `npx tsc --noEmit` — 0 errors
- ✅ `npx next build` — all 8 routes built (7 SSG ● + 1 dynamic ƒ home)
- ✅ Local dev smoke test on port 3100 — all 8 pages HTTP 200:
  `/`, `/wall-tile`, `/column-beam`, `/rebar`, `/compare`, `/stores`, `/trend`, `/sources`
- ✅ Refactored `compare/page.tsx` to use shared `@/components/ui/Stat` (Stat/Th/Td) — removed 78 lines of duplication

## Next Priority Tasks
1. Create new GitHub repo (e.g. `construction-cost-engine`) → `git remote add origin ... && git push`
2. Add GitHub secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (reuse from factory-landing)
3. First deploy via CI on push to `main`
4. Optional polish: `setRequestLocale` in home page, per-page `generateMetadata`, mobile breakpoints
5. Phase 2: EN/ZH locale expansion (only need to add `messages/en.json` + `zh.json`, infra already supports), real Supabase backend, PDF/Excel BOM export
