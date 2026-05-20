# Construction Cost Engine — Session Memory

## Current State
- **Phase:** Phase 3 infra fully live (KV bound, admin secret set, real CKAN freshness wired) ✓
- **Stack:** Next.js 16 + React 19 + TS strict + Tailwind 4 inline `@theme` + Recharts + next-intl (TH only) + xlsx (SheetJS) + Cloudflare Workers
- **Live URL:** https://construction-cost-engine.steep-tooth-c420.workers.dev ✓
- **GitHub repo:** https://github.com/Bellero-Advanced/construction-cost-engine
- **Latest commit:** `e3a305e` (Phase 3 KV + CKAN freshness + admin secret)
- **CI:** All green ✓
- **Last updated:** 2026-05-20

## Infrastructure (all bound + secret on prod worker)
- **KV namespace `PRICES_KV`**
  - Production ID: `a738f53806bf4a119665effc487b7f16`
  - Preview ID:    `be1c2d44e903453ba33524a91e983c20`
  - Bound in `wrangler.jsonc`, consumed by `src/lib/livePrice.ts` via `@opennextjs/cloudflare`'s `getCloudflareContext().env.PRICES_KV` (falls back to memCache when binding absent)
- **Cron trigger:** `17 3 * * 0` (Sun 03:17 UTC) → POSTs to `/api/admin/refresh-prices`
- **Worker secret:** `ADMIN_REFRESH_TOKEN` (set via `wrangler secret put`, value not in repo)

## API Routes (ƒ)
- `GET  /api/prices/[source]/[material]?province=N` — provider → KV → mock fallback
- `GET  /api/prices/status` — which sources are LIVE vs MOCK
- `POST /api/admin/refresh-prices` (header `x-admin-token`) — cron entry point
- `GET  /api/sources/freshness` — real data.go.th CKAN call for TPSO + CGD upstream metadata, 1h edge cache. Verified live.

## Recent Changes (2026-05-20)

### Phase 3 — all 3 "remaining manual steps" done autonomously
- KV: `wrangler kv namespace create PRICES_KV` (+ `--preview`), IDs pasted into `wrangler.jsonc`
- `livePrice.ts`: `getKv()` reads `env.PRICES_KV` via `@opennextjs/cloudflare`, with memCache fallback
- `cloudflare-env.d.ts`: typed `CloudflareEnv { PRICES_KV?, ADMIN_REFRESH_TOKEN? }`
- `@cloudflare/workers-types` added to devDeps for the `KVNamespace` type
- `/api/sources/freshness`: real CKAN integration (TPSO `gdpublish-tpso-repo-4` + CGD `cmicgd042569`). Returns upstream last-modified + latest resource URL
- `ADMIN_REFRESH_TOKEN`: 24-byte hex token generated and uploaded via `wrangler secret put`

### UX — "Rust-like" snappy
- Global `* { transition: none !important; animation: none !important }` in `globals.css`
- Stripped `transition-*`, `duration-*`, `animate-*`, `hover:-translate-*` from all components
- Hover keeps the offset shadow (instant), no slide/fade anywhere

### Other (this session)
- EN/ZH locales removed (TH-only per user)
- Header mobile responsive (hamburger menu <lg, responsive logo/title)
- Per-page `generateMetadata` (canonical + OG + Twitter)
- Phase 2 PDF/Excel BOM export (verified end-to-end via Playwright MCP)

## What's left to make prices truly "live"
The plumbing is finished. The only remaining work is implementing actual price extraction:
1. **TPSO/CGD price extraction** — needs PDF OCR (data.go.th publishes PDFs only). When wired, register a `tpsoProvider` in `PROVIDERS` map in `livePrice.ts` and prices auto-populate KV.
2. **Retail scrape** — needs Playwright on VPS / browserless.io (~$5-20/mo) since all 4 retail sources are SPAs.

Until then `getLivePrice()` returns mock prices and `DataModeBadge` shows MOCK. Switching to LIVE is a one-file change once a provider exists.

## Tech Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | Modern SSR + RSC |
| Charts | Recharts | React-native, tree-shakes |
| Styling | Tailwind 4 inline `@theme` | Tokens in `globals.css` |
| i18n | next-intl, TH only | Per user — demo scope |
| UX | Zero transitions/animations | "Rust-like" instant response |
| Live cache | Cloudflare KV (`PRICES_KV`) | Bound, edge-replicated |
| Excel | xlsx (SheetJS) client-side | Thai unicode native |
| PDF | `window.print()` + `@media print` | Best Thai fonts |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` | Mirrors factory-landing |

## Project Identity
Construction Cost Engine — demo/prototype calculator for material cost estimation. 6 sources (TPSO + CGD govt, HomePro + Global House + Thai Watsadu + BnB Home retail), 10 provinces, 20 materials, 12-month trends. TH locale only. Snappy zero-animation UX.
