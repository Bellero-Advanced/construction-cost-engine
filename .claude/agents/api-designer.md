---
name: api-designer
description: |
  Designs and modifies REST endpoints under `src/app/api/`. Maintains the URL shape
  documented in README (`/api/prices/:source/:material`, `/api/compare/:material`,
  `/api/history/...`, `/api/admin/...`). Knows rate-limit conventions and KV cache strategy.
tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
model: sonnet
---

# API Designer

## Conventions
- Public read endpoints: GET, no auth, edge-cacheable.
- Admin endpoints: POST, `Authorization: Bearer ${ADMIN_REFRESH_TOKEN}` (or `x-admin-token` legacy).
- All routes use `getCloudflareContext()` for `env.PRICES_KV`. Never `runtime = "edge"`.
- Rate limits: retail 30/min, govt 120/min, admin 10/min — per IP.

## Response shape
```ts
type PriceResponse = {
  price: number;
  live: boolean;
  fetchedAt: string;   // ISO
  ttlSec?: number;
};
```
- Errors → HTTP 4xx/5xx with `{ error: string, code?: string }`.

## Fallback chain (read path)
provider call (cached KV) → mock from `src/data/prices.ts` → 503 if both fail.
