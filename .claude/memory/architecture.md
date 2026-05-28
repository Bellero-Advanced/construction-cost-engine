# Architecture

## Stack
Next.js 16 (App Router, no `runtime = "edge"`) · React 19 · TypeScript strict · Tailwind 4 (inline `@theme`) · Recharts · next-intl (TH; arch'd for EN/ZH) · Cloudflare Workers via `@opennextjs/cloudflare` · Cloudflare KV (`PRICES_KV`) · GitHub Actions cron · ScrapingBee / CF Browser Rendering for retail.

## Source layout
- `src/app/[locale]/` — public pages (home, wall-tile, column-beam, rebar, compare, stores, trend, sources)
- `src/app/api/` — REST endpoints (prices, compare, history, status, sources, admin)
- `src/components/{ui,layout,calculator}/`
- `src/lib/scrapers/` — 11 sources (TPSO, CGD, DIT, HomePro, MegaHome, Boonthavorn, GH, TW, BnB, SCG, Dohome)
- `src/lib/{pricing,calculators,units,stats}.ts` — pure business logic
- `src/data/` — materials, sources, provinces, mock prices
- `src/messages/` — i18n JSON (`th.json` primary)

## Data flow
```
external source ─→ scraper (src/lib/scrapers/*) ─→ KV cache ─→ API route ─→ page
                                              ↘ history:* time-series (no TTL)
```

## KV schema
| Key | Value | TTL |
|---|---|---|
| `{source}:{material}:{province}` | `{price, fetchedAt}` | 14–30d |
| `history:{source}:{material}:{province}` | `[{date,price}…]` | none |
| `tpso:cmi:latest` | `{index, ratio, reportPeriod, fetchedAt}` | 60d |
| `calc:{uuid}` | BOQ result | 90d |

## Deploy
GitHub Actions `deploy.yml` on push to `main` → typecheck → `opennextjs-cloudflare build` → `deploy`. Required secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ADMIN_REFRESH_TOKEN`, `SCRAPINGBEE_API_KEY`.
