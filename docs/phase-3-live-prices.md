# Phase 3 — Live Price Architecture

**Status:** Architecture stub. No live providers registered yet — every price still resolves to the deterministic mock from `src/lib/pricing.ts`.

## What's wired

- `src/lib/livePrice.ts` — `getLivePrice(source, material, province)` resolver. Tries provider → cache → mock fallback. Per-source TTLs.
- `src/lib/scrapers/homepro.ts` — provider template. Implements `PriceProvider`, returns `null` until a real fetch is wired.
- `src/app/api/prices/[source]/[material]/route.ts` — `GET /api/prices/:source/:material?province=10` → `{ price, live, fetchedAt, ttlSec }`.
- `src/app/api/prices/status/route.ts` — `GET /api/prices/status` → which sources are live vs mock.
- `src/components/calculator/DataModeBadge.tsx` — green `LIVE` / amber `MOCK` pill, rendered in every calculator result.

## How to plug in a real source

1. Implement `fetch()` in `src/lib/scrapers/<source>.ts`. Return a price `number` or `null`.
2. Register it in `src/lib/livePrice.ts`:

   ```ts
   import { homeproProvider } from "@/lib/scrapers/homepro";
   const PROVIDERS: Partial<Record<SourceKey, PriceProvider>> = {
     homepro: homeproProvider,
   };
   ```

3. (Optional, recommended for production) Swap the in-memory `memCache` in `livePrice.ts` for a Cloudflare KV binding:

   ```jsonc
   // wrangler.jsonc
   "kv_namespaces": [{ "binding": "PRICES_KV", "id": "<kv-id>" }]
   ```

   Then replace `kvGet`/`kvPut` with `env.PRICES_KV.get(key, "json")` / `env.PRICES_KV.put(key, JSON.stringify(value), { expirationTtl: ttlSec })`.

## Source feasibility (verified 2026-05-19)

| Source | Path | Status |
|---|---|---|
| **TPSO** | data.go.th `gdpublish-tpso-repo-4` | PDF-only — needs OCR/PDF ETL via Cron Trigger → KV |
| **CGD** | `cgd-contract-25xx` datasets | PDF/Excel quarterly — same pattern as TPSO |
| **HomePro** | `homepro.co.th/search` | SPA, no inline prices. Needs headless scrape (Playwright on VPS / browserless.io) |
| **Global House / Thai Watsadu / BnB** | retail sites | same SPA pattern as HomePro |

## Why no source was wired this session

A real fetch path needs either (a) a PDF-parsing ETL worker or (b) a paid headless-browser dependency. Both are multi-day commitments and introduce ToS risk for the retail sources. The architecture is shipped now so adding either later is a one-file change.

## Endpoints

```
GET /api/prices/status
GET /api/prices/homepro/CEMENT_001?province=10
```
