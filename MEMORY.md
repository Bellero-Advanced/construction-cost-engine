# Construction Cost Engine — Session Memory

## Current State
- **Phase:** Phase 3 architecture stub shipped — live-price API + scraper interface + LIVE/MOCK badge ✓
- **Stack:** Next.js 16 + React 19 + TypeScript (strict) + Tailwind CSS 4 inline `@theme` + Recharts + next-intl (TH) + xlsx (SheetJS) + Cloudflare Workers
- **Live URL:** https://construction-cost-engine.steep-tooth-c420.workers.dev ✓
- **GitHub repo:** https://github.com/Bellero-Advanced/construction-cost-engine (private)
- **CI status:** All green ✓ (typecheck + build + deploy)
- **Backend:** None — all mock data. Phase 3 stub in place for KV cache + real scrapers.
- **Last updated:** 2026-05-19

## Phase 3 — Live Price Architecture (this session)

**Decision:** built Option C (architecture-only stub). TPSO/CGD are PDF-only on data.go.th (verified via API search), and HomePro/GlobalHouse/ThaiWatsadu/BnB are client-rendered SPAs (verified — no inline prices, no `__NEXT_DATA__`). Both real-source paths require multi-day infra (OCR ETL or headless browser on VPS), so this session shipped the *plumbing* and one provider stub.

**What was built:**
- `src/lib/livePrice.ts` — `getLivePrice(source, material, province)` resolver. Provider registry → in-memory cache (KV-ready) → mock fallback. Per-source TTLs (govt 7-30d, retail 24h). Returns `{price, live, fetchedAt, ttlSec}`.
- `src/lib/scrapers/homepro.ts` — `PriceProvider` template. `fetch()` returns `null` until a real implementation is wired. Header doc explains how to swap in a headless-scrape worker.
- `src/app/api/prices/[source]/[material]/route.ts` — `GET /api/prices/:source/:material?province=10` (edge runtime).
- `src/app/api/prices/status/route.ts` — `GET /api/prices/status` lists which sources are LIVE vs MOCK.
- `src/components/calculator/DataModeBadge.tsx` — green `LIVE · {source}` / amber `MOCK · {source}` pill. Wired into `CalculatorResult` source/location card.
- `docs/phase-3-live-prices.md` — architecture + how-to-plug-in-a-source guide.

**To go from stub → real data, one-file change:**
1. Implement `fetch()` in a scraper file
2. Register it in `PROVIDERS` map in `livePrice.ts`
3. Swap memCache for `env.PRICES_KV` (add KV binding to `wrangler.jsonc`)

**Verified:** `npx tsc --noEmit` = 0 errors, `next build` = all 8 SSG pages + 2 ƒ API routes registered.

## Phase 2 — PDF/Excel BOM Export (previous session)

**What was built:**
- `src/lib/export.ts` — `exportToExcel(data)` + `exportToPDF()`. Excel via `xlsx` (SheetJS) client-side. PDF via `window.print()` + `@media print` CSS (best Thai font support, no jspdf bloat).
- `src/components/calculator/CalculatorResult.tsx` — wired EXCEL/PDF buttons, print-only header.
- `src/app/globals.css` — `@media print` block: A4, hides chrome.
- All 3 calculator pages: replaced `alert()` with inline error UI.

**Verified end-to-end on live worker (Playwright MCP, 2026-05-19):**
- Wall-tile: 19,136-byte xlsx, Thai filename intact.
- Rebar (3 rebars): 6-row BOM, total 11,282.46 บาท.

## Pages (all live)
- [x] `/` — Home
- [x] `/wall-tile`, `/column-beam`, `/rebar` — Calculators (now with LIVE/MOCK badge)
- [x] `/compare`, `/stores`, `/trend`, `/sources` — Charts + source viewer

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Modern SSR + RSC support |
| Charts | Recharts | React-native, tree-shakes |
| Styling | Tailwind CSS 4 inline `@theme` | Tokens in `globals.css`, no `tailwind.config.ts` |
| i18n | next-intl, single TH locale | Architecture-ready for EN/ZH |
| Data | Mock TS files + Phase 3 live-resolver | Demo; deterministic `getPrice` with optional live override |
| Excel export | xlsx (SheetJS) client-side | Thai unicode native, no server needed |
| PDF export | `window.print()` + `@media print` CSS | Best Thai font support |
| Live cache | In-memory Map (KV-ready) | No CF resource setup yet; swap for `env.PRICES_KV` when scraper lands |
| Backend | None | User confirmed demo-only |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` | Mirrors factory-landing |

## Source Feasibility (verified 2026-05-19)
| Source | Path | Real-data feasibility |
|---|---|---|
| TPSO | `data.go.th/gdpublish-tpso-repo-4` | **PDF-only.** Needs OCR ETL via Cron Trigger → KV |
| CGD | `cgd-contract-25xx` datasets | **PDF/Excel quarterly.** Same ETL pattern |
| HomePro / GlobalHouse / ThaiWatsadu / BnB | retail sites | **SPA.** Needs headless scrape (Playwright on VPS / browserless.io ~$5-20/mo) |

## Known Issues / TODO
- No real scraper wired yet (Phase 3 stub only) — see `docs/phase-3-live-prices.md`
- Mobile responsive polish — currently desktop-first
- No SEO `generateMetadata` per page yet

## Next Priority Tasks (when resuming)
1. **Wire one real source.** Easiest path: CGD PDF ETL (lowest cost, govt data, no ToS risk). Cron Trigger fetches latest PDF → parses with `pdf-parse` (or call out to a tiny VPS tool) → writes to KV. ~2 days.
2. **Add KV binding.** `wrangler kv:namespace create PRICES_KV` → bind in `wrangler.jsonc` → swap memCache.
3. EN/ZH locale expansion
4. Per-page `generateMetadata` for SEO
5. Mobile responsive polish

## Project Identity
Construction Cost Engine — Demo/prototype calculator for material cost estimation, sourcing prices from 6 sources (TPSO + CGD government, HomePro + Global House + Thai Watsadu + BnB Home retail) across 10 Thai provinces, 20 materials, 12-month trend.

