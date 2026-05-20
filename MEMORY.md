# Construction Cost Engine — Session Memory

## Current State
- **Phase:** Phase 3 infra complete + snappy UX ✓
- **Stack:** Next.js 16 + React 19 + TypeScript (strict) + Tailwind CSS 4 inline `@theme` + Recharts + next-intl (TH only) + xlsx (SheetJS) + Cloudflare Workers
- **Live URL:** https://construction-cost-engine.steep-tooth-c420.workers.dev ✓
- **GitHub repo:** https://github.com/Bellero-Advanced/construction-cost-engine (private)
- **Latest commit:** `ae7b2d7` (snappy Rust-like UI + KV/cron stubs)
- **CI:** All green ✓
- **Last updated:** 2026-05-20

## Recent Changes (2026-05-20)

### Snappy "Rust-like" UI
- `globals.css`: global `* { transition: none !important; animation: none !important }`
- Stripped all `transition-*`, `duration-*`, `animate-*`, `hover:-translate-*` from every component
- Hover effects now snap-on shadow only (no slide/fade), input focus drops translate, keeps shadow
- `.page-in` is a no-op — page renders instantly
- Result: feels like a static HTML page compiled from a systems language

### TH-only revert
- Removed `messages/en.json`, `messages/zh.json`, `LocaleSwitcher.tsx`
- `src/i18n.ts` → `locales = ["th"]`

### Mobile responsive
- Header: hamburger menu on `<lg`, responsive logo/title sizing
- Footer + main: `px-4 sm:px-6 lg:px-7` responsive padding

### Phase 3 infra (KV + cron stubs)
- `wrangler.jsonc`: cron trigger `17 3 * * 0` (Sun 03:17 UTC) + commented `kv_namespaces` entry
- `src/app/api/admin/refresh-prices/route.ts`: POST with `x-admin-token` guard, fan-out skeleton
- `src/lib/livePrice.ts`: resolver with provider registry → in-memory cache → mock fallback
- `src/lib/scrapers/homepro.ts`: `PriceProvider` template (returns `null`)
- `src/app/api/prices/[source]/[material]/route.ts` + `/api/prices/status/route.ts`
- `src/components/calculator/DataModeBadge.tsx`: LIVE/MOCK pill (no animation)
- `docs/phase-3-live-prices.md`: how-to-plug-in-a-source guide

### Per-page SEO metadata
- `src/lib/pageMeta.ts`: shared `buildPageMetadata` helper (canonical + OG + Twitter)
- 7 thin `layout.tsx` for inner pages + root `[locale]/layout.tsx` with `generateMetadata`

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Next.js 16 (App Router) | Modern SSR + RSC |
| Charts | Recharts | React-native, tree-shakes |
| Styling | Tailwind CSS 4 inline `@theme` | Tokens in `globals.css` |
| i18n | next-intl, TH only | Per user — demo scope |
| UX | Zero transitions/animations | "Rust-like" instant response |
| Data | Mock + Phase 3 live-resolver | Optional live override per source |
| Excel | xlsx (SheetJS) client-side | Thai unicode native |
| PDF | `window.print()` + `@media print` | Best Thai fonts |
| Live cache | In-memory Map (KV-ready) | Swap for `env.PRICES_KV` when scraper lands |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` | Mirrors factory-landing |

## Build Info
- 8 SSG routes (TH only) + 3 ƒ API routes (`/api/prices/[source]/[material]`, `/api/prices/status`, `/api/admin/refresh-prices`)
- `tsc --noEmit` = 0 errors

## Next Priority Tasks (when resuming)
1. **Wire one real source.** Easiest: CGD PDF ETL via Cron Trigger → KV. ~2 days.
2. **Uncomment KV binding.** `wrangler kv namespace create PRICES_KV` → paste IDs into `wrangler.jsonc` → swap memCache in `livePrice.ts`.
3. Set `ADMIN_REFRESH_TOKEN` env var in GitHub secrets + wrangler for the cron-triggered refresh.

## Project Identity
Construction Cost Engine — Demo/prototype calculator for material cost estimation. 6 sources (TPSO + CGD govt, HomePro + Global House + Thai Watsadu + BnB Home retail), 10 provinces, 20 materials, 12-month trends. TH locale only. Snappy zero-animation UX.
