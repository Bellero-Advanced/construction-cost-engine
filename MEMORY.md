# Construction Cost Engine — Session Memory

## Current State
- **Phase:** Phase 3 stub + EN/ZH locale expansion + per-page SEO metadata ✓
- **Stack:** Next.js 16 + React 19 + TypeScript (strict) + Tailwind CSS 4 inline `@theme` + Recharts + next-intl (TH/EN/ZH) + xlsx (SheetJS) + Cloudflare Workers
- **Live URL:** https://construction-cost-engine.steep-tooth-c420.workers.dev ✓
- **GitHub repo:** https://github.com/Bellero-Advanced/construction-cost-engine (private)
- **Latest commit:** `e461f08` (per-page SEO metadata)
- **CI status:** All green ✓
- **Last updated:** 2026-05-20

## Recent Sessions

### 2026-05-20 — EN/ZH locales + per-page SEO
- `src/messages/en.json` + `zh.json` — full translation parity with `th.json`
- `src/i18n.ts` — `locales = ["th","en","zh"]`
- `src/components/layout/LocaleSwitcher.tsx` — TH/EN/中 pill switcher in header, preserves path, omits prefix for default (TH)
- `src/lib/pageMeta.ts` — `buildPageMetadata({locale, navKey, path})` helper (canonical + hreflang + OG + Twitter)
- 7 thin `layout.tsx` files (wall-tile, column-beam, rebar, compare, stores, trend, sources) export `generateMetadata`
- `[locale]/layout.tsx` — root metadata pulls translated title/description, hreflang for all 3 locales
- **Build:** 24 SSG routes (8 pages × 3 locales) + 2 ƒ API routes. `tsc --noEmit` clean.

### 2026-05-19 — Phase 3 live-price stub
- `src/lib/livePrice.ts` — resolver: provider → cache → mock fallback
- `src/lib/scrapers/homepro.ts` — `PriceProvider` template (returns `null`)
- `/api/prices/[source]/[material]` + `/api/prices/status` routes (edge)
- `DataModeBadge` — LIVE/MOCK pill in calculator result
- `docs/phase-3-live-prices.md` — how-to-plug-in-a-source guide
- Source feasibility (verified): TPSO/CGD PDF-only on data.go.th; retail = SPA. Both need multi-day infra.

### 2026-05-19 — Phase 2 PDF/Excel BOM export (previous)
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
| i18n | next-intl, TH/EN/ZH | as-needed prefix, default = TH |
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
- Mobile responsive polish — currently desktop-first
- Footer / source detail pages may have a few remaining TH-only hardcoded strings to audit

## Next Priority Tasks
1. **Wire one real source.** Easiest: CGD PDF ETL via Cron Trigger → KV. ~2 days.
2. **Add KV binding.** `wrangler kv:namespace create PRICES_KV` → bind in `wrangler.jsonc` → swap memCache.
3. **Mobile responsive polish.** Header nav wraps awkwardly on narrow screens; calculator sidebar should collapse.
4. Audit remaining hardcoded TH strings (sources page table headers, etc.)

## Project Identity
Construction Cost Engine — Demo/prototype calculator for material cost estimation, sourcing prices from 6 sources (TPSO + CGD government, HomePro + Global House + Thai Watsadu + BnB Home retail) across 10 Thai provinces, 20 materials, 12-month trend.

