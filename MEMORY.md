# Construction Cost Engine — Session Memory

## Current State
- **Phase:** Phase 3 stub + per-page SEO + mobile responsive header/footer ✓
- **Stack:** Next.js 16 + React 19 + TypeScript (strict) + Tailwind CSS 4 inline `@theme` + Recharts + next-intl (TH only) + xlsx (SheetJS) + Cloudflare Workers
- **Live URL:** https://construction-cost-engine.steep-tooth-c420.workers.dev ✓
- **GitHub repo:** https://github.com/Bellero-Advanced/construction-cost-engine (private)
- **Latest commit:** `f9deaef` (TH-only + mobile responsive)
- **CI:** All green ✓
- **Last updated:** 2026-05-20

## Recent Sessions

### 2026-05-20 — TH-only revert + mobile responsive
- Per user goal: removed EN/ZH locales (`messages/en.json`, `zh.json`, `LocaleSwitcher.tsx`)
- `src/i18n.ts` → `locales = ["th"]`
- Header: hamburger menu on <lg, responsive logo (`h-11 w-11 sm:h-14 sm:w-14`), responsive title sizing, mobile container padding
- Footer + main: `px-4 sm:px-6 lg:px-7` consistent responsive padding
- Per-page `generateMetadata` retained (single locale, hreflang collapses to TH)
- Build: 8 SSG routes + 2 ƒ API routes, `tsc --noEmit` clean

### 2026-05-20 — Per-page SEO metadata
- `src/lib/pageMeta.ts` — shared `buildPageMetadata` helper (canonical + OG + Twitter)
- `[locale]/layout.tsx` → `generateMetadata` with translated title/desc
- 7 thin `layout.tsx` files for inner pages with localized titles

### 2026-05-19 — Phase 3 live-price stub
- `src/lib/livePrice.ts` — resolver: provider → cache → mock fallback
- `src/lib/scrapers/homepro.ts` — `PriceProvider` template (returns `null`)
- `/api/prices/[source]/[material]` + `/api/prices/status` routes (edge)
- `DataModeBadge` — LIVE/MOCK pill in calculator result
- `docs/phase-3-live-prices.md` — how-to-plug-in-a-source guide
- Source feasibility: TPSO/CGD PDF-only on data.go.th; retail = SPA. Both need multi-day infra.

### 2026-05-19 — Phase 2 PDF/Excel BOM export
- `src/lib/export.ts` — `xlsx` (SheetJS) + `window.print()`
- Print-only header in `CalculatorResult`, `@media print` CSS in `globals.css`
- Inline error UI on all 3 calculator pages (replaced `alert()`)
- Verified end-to-end on live worker (Playwright MCP).

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Modern SSR + RSC |
| Charts | Recharts | React-native, tree-shakes |
| Styling | Tailwind CSS 4 inline `@theme` | Tokens in `globals.css` |
| i18n | next-intl, TH only | Per user — demo scope |
| Data | Mock + Phase 3 live-resolver | Optional live override per source |
| Excel | xlsx (SheetJS) client-side | Thai unicode native |
| PDF | `window.print()` + `@media print` | Best Thai fonts |
| Live cache | In-memory Map (KV-ready) | Swap for `env.PRICES_KV` when scraper lands |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` | Mirrors factory-landing |

## Source Feasibility (verified 2026-05-19)
| Source | Path | Feasibility |
|---|---|---|
| TPSO | `data.go.th/gdpublish-tpso-repo-4` | **PDF-only.** Needs OCR ETL via Cron Trigger → KV |
| CGD | `cgd-contract-25xx` | **PDF/Excel quarterly.** Same ETL pattern |
| HomePro / GlobalHouse / ThaiWatsadu / BnB | retail sites | **SPA.** Needs headless scrape (~$5-20/mo) |

## Known Issues / TODO
- No real scraper wired (Phase 3 stub only)
- Calculator sidebar is `lg:sticky` so on tablet (md only) it scrolls inline — acceptable

## Next Priority Tasks
1. **Wire one real source.** Easiest: CGD PDF ETL via Cron Trigger → KV. ~2 days, requires CF dashboard work.
2. **Add KV binding.** `wrangler kv:namespace create PRICES_KV` → bind in `wrangler.jsonc` → swap memCache.

## Project Identity
Construction Cost Engine — Demo/prototype calculator for material cost estimation, sourcing prices from 6 sources (TPSO + CGD government, HomePro + Global House + Thai Watsadu + BnB Home retail) across 10 Thai provinces, 20 materials, 12-month trend. TH locale only.
