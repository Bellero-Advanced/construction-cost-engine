# Construction Cost Engine

Live Thai construction-material pricing API + calculator. Aggregates 10 sources (3 govt indices + 7 retail e-commerce), exposes a typed REST surface, and powers per-province cost calculators (wall-tile, column-beam, rebar) plus a trend chart.

**Production:** https://construction-cost-engine.steep-tooth-c420.workers.dev
**Repo:** github.com/Bellero-Advanced/construction-cost-engine

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind 4 · next-intl (TH) · Cloudflare Workers (`@opennextjs/cloudflare`) · Cloudflare KV + Browser Rendering · GitHub Actions cron.

## Sources

| Key | Type | Method | Status |
|---|---|---|---|
| `tpso` | govt index | PDF (unpdf) → CMI value | live |
| `cgd` | govt prices | data.go.th CKAN auto-discovery / manual upload fallback | manual |
| `dit` | govt prices | moc-price.moc.go.th (egress-blocked) → manual upload | manual |
| `homepro` | retail | `/service/search/suggest.jsp` JSON | live (9/9 mat) |
| `megahome` | retail | `/service/search/suggest.jsp` JSON | live (3/5 mat) |
| `globalhouse` `thaiwatsadu` `bnb` `scghome` `dohome` | retail | ScrapingBee free tier (residential proxy) → CF Browser Rendering fallback | needs `SCRAPINGBEE_API_KEY` |

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/prices/:source/:material?province=N` | One material × one source |
| GET | `/api/compare/:material?province=N` | Fan-out across all 10 sources + summary {min,max,avg,median,spreadPct} |
| GET | `/api/history/:source/:material?province=N` | KV time-series, 30min edge cache |
| GET | `/api/prices/status` | Per-source mode + cache key counts + ScrapingBee state |
| GET | `/api/sources/freshness` | data.go.th CKAN upstream metadata |
| GET | `/api/sources/health?province=N` | Aggregated freshness across all sources × materials |
| GET | `/api/sources/tpso/cmi` | TPSO CMI index value |
| POST | `/api/admin/upload-prices` | Manual ingest. Body `{source,province,prices:{material_id:price}}`. Auth. |
| POST | `/api/admin/refresh-prices?source=` | Trigger live re-fetch. Auth. |
| POST | `/api/admin/snapshot-history` | Append today's prices to KV time-series. Cron-driven. Auth. |
| POST | `/api/admin/scrape-debug` | Returns post-hydration candidate elements. Auth. |

Public docs page: `/api-docs`. Rate limit retail 30/min, govt 120/min, per IP.

## Pages

- `/` — overview
- `/wall-tile`, `/column-beam`, `/rebar` — calculators (Excel + PDF export)
- `/sources` — live price table per source × province + freshness column + CSV export + admin CSV uploader
- `/compare` — same source across all provinces
- `/compare-sources` — same material across all sources (bar chart + spread%)
- `/trend` — 12-month chart (real history once cron accumulates)
- `/health` — source health dashboard
- `/api-docs` — REST reference
- `/stores` — retail store comparison

## Local

```bash
npm install
npm run dev          # next dev
npx tsc --noEmit     # typecheck
```

## Deploy

```bash
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy
```

CI: `.github/workflows/deploy.yml` on push to main; daily price refresh at 03:17 UTC via `.github/workflows/refresh-prices.yml`.

## Bindings & secrets

`wrangler.jsonc`:
- `PRICES_KV` — KV namespace (price cache + history)
- `BROWSER` — Browser Rendering binding (Workers Paid plan)

Secrets (`wrangler secret put NAME`):
- `ADMIN_REFRESH_TOKEN` — auth for /api/admin/* + cron
- `SCRAPINGBEE_API_KEY` — optional residential proxy for bot-blocked retail sites (free tier 1000 req/mo)

## Status

See [`docs/PHASE-4-STATUS.md`](docs/PHASE-4-STATUS.md) for live verification log + known upstream blockers + remaining work.
