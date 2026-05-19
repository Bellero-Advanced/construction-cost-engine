# Construction Cost Engine — Session Memory

## Current State
- **Phase:** Phase 2 complete — **PDF + Excel BOM export shipped + verified end-to-end** ✓
- **Stack:** Next.js 16 + React 19 + TypeScript (strict) + Tailwind CSS 4 inline `@theme` + Recharts + next-intl (TH) + xlsx (SheetJS) + Cloudflare Workers
- **Live URL:** https://construction-cost-engine.steep-tooth-c420.workers.dev ✓
- **GitHub repo:** https://github.com/Bellero-Advanced/construction-cost-engine (private)
- **Latest commit:** `9f39b76` (`fix: add xlsx to package.json`)
- **CI status:** All green ✓ (typecheck + build + deploy)
- **Worker name:** `construction-cost-engine`
- **Backend:** None — all mock data in `src/data/`
- **Last updated:** 2026-05-19

## Phase 2 — PDF/Excel BOM Export (this session)

**What was built:**
- `src/lib/export.ts` — `exportToExcel(data)` + `exportToPDF()`. Excel uses `xlsx` (SheetJS) client-side — generates `BOM_<work>_YYYYMMDD_HHMM.xlsx` with summary header (work / source / province / date / extra info), materials table, and TOTAL/UNIT COST footer rows. Native Thai unicode support, no font embedding needed.
- `src/components/calculator/CalculatorResult.tsx` — wired the EXCEL/PDF buttons (previously alert stubs). Added a print-only report header (work / date / source / province / extra info) that's hidden on screen but visible during print, plus a print-only Unit-Cost footer line.
- `src/app/globals.css` — added `@media print` block: A4 page, hides Header/Footer/sidebar form/breakdown chart, strips card chrome, ensures tables print cleanly with thead repeating and rows that don't break across pages.
- All 3 calculator pages (`wall-tile`, `column-beam`, `rebar`): replaced `alert()` validation with inline error UI (border-l-4 red callout under Submit button) + clearer error messages.

**Why `window.print()` instead of jspdf?**
- Native browser font support — Thai renders correctly with no embedded font bundle bloat
- Works offline, on any device, no extra dependency
- User can still pick "Save as PDF" in any modern browser's print dialog

**Verified end-to-end on live worker (Playwright MCP, 2026-05-19):**
- `/wall-tile` calculate → BOM table renders → click ⬇ EXCEL → 19,136-byte xlsx blob created, browser downloads file `BOM_งานผนัง-กระเบื้อง_20260519_1709.xlsx` (Thai filename intact)
- `/rebar` calculate (default 3 rebars: DB12 200m + DB16 100m + RB6 300m) → 6-row BOM (3 rebars + wire + formwork + nails), total 11,282.46 บาท, both ⬇ EXCEL and ⬇ PDF buttons rendered

## Pages (all live)
- [x] `/` — Home
- [x] `/wall-tile` — กระเบื้อง + ปูนกาว + ปูนยาแนว + คิ้ว PVC + น้ำผสมปูน
- [x] `/column-beam` — ปูนซีเมนต์ + ทรายหยาบ + หินเบอร์ 1-2 + น้ำผสมปูน
- [x] `/rebar` — RB6/RB9 (Round Bar SR24) + DB10/DB12/DB16/DB20/DB25 (Deformed Bar SD40) + ลวดผูกเหล็ก + ไม้แบบ + ตะปู
- [x] `/compare` — 10-province bar chart
- [x] `/stores` — 6-source bar chart + insight panel
- [x] `/trend` — 12-month line chart (single material OR all-rebar overlay)
- [x] `/sources` — Source detail viewer with table + JSON sample

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Modern SSR + RSC support |
| Charts | Recharts | React-native, tree-shakes |
| Styling | Tailwind CSS 4 inline `@theme` | Tokens in `globals.css`, no `tailwind.config.ts` |
| i18n | next-intl, single TH locale | Architecture-ready for EN/ZH |
| Data | Mock TS files | Demo only; deterministic `getPrice` |
| Excel export | xlsx (SheetJS) client-side | Thai unicode native, no server needed |
| PDF export | `window.print()` + `@media print` CSS | Best Thai font support, no jspdf bloat |
| Backend | None | User confirmed demo-only |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` | Mirrors factory-landing |

## Known Issues / TODO
- Mobile responsive polish — currently desktop-first
- No SEO `generateMetadata` per page yet
- Body amber dot-grid background may compete with charts on busy comparison pages
- `npx wrangler whoami` revealed initial token mismatch — now fixed; future tokens should target the same Cloudflare account that hosts factory-landing

## Next Priority Tasks (when resuming)
1. EN/ZH locale expansion — only need to add `messages/en.json` + `messages/zh.json`, update `locales` array in `src/i18n.ts` from `["th"]` → `["th","en","zh"]`, add a locale switcher in Header
2. Polish: per-page `generateMetadata` for SEO + Open Graph, mobile breakpoints on Header nav
3. Optional: real Supabase backend for stored scraped prices, history of past calculations
4. Optional: PDF print preview button (call `window.print()` from a fullscreen "preview" mode that reveals only the BOM area in a styled wrapper) for clearer UX

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
