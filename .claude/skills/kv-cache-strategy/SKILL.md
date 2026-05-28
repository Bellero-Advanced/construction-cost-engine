---
name: kv-cache-strategy
description: KV key shapes, TTLs, and read/write order across scrapers and API routes.
---

# KV Cache Strategy

## Keys
| Pattern | TTL | Writer | Reader |
|---|---|---|---|
| `{source}:{material}:{province}` | 14–30d | scraper | `/api/prices/[source]/[material]` |
| `history:{source}:{material}:{province}` | none | `/api/admin/snapshot-history` | `/api/history/...` |
| `tpso:cmi:latest` | 60d | `refreshTpsoIndex()` | `/api/sources/tpso/cmi`, all TPSO price reads |
| `calc:{uuid}` | 90d | calculator save | calculator restore |

## Read order (price endpoint)
1. Cache hit on `{source}:{material}:{province}` → return `{live: true}`.
2. Cache miss → call provider scraper → on success write KV → return `{live: true}`.
3. Provider fail → fall through to deterministic mock from `src/data/prices.ts` → return `{live: false}`.
4. Mock missing → 503.

## Write contract
```ts
await env.PRICES_KV.put(
  key,
  JSON.stringify(payload),
  { expirationTtl: ttlSec },
);
```
- `payload` always includes `fetchedAt: new Date().toISOString()`.
- Never write without TTL except for `history:*` time-series.

## Snapshot history
`/api/admin/snapshot-history` reads current `{source}:{material}:{province}` for all combos and appends to `history:*`. Cron-driven (GH Actions). Keeps a rolling 365-day window via list-trim.
