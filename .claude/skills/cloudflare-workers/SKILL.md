---
name: cloudflare-workers
description: How `@opennextjs/cloudflare` deploys this Next.js app, KV bindings, and the runtime gotchas.
---

# Cloudflare Workers (via OpenNext)

## How the build works
`npx opennextjs-cloudflare build` produces `.open-next/worker.js` — a single Node-compat Worker bundling all routes. **Routes with `export const runtime = "edge"` are excluded from the OpenNext bundle and break `getCloudflareContext()`.**

## `getCloudflareContext()`
```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
export async function GET() {
  const { env } = getCloudflareContext();
  const data = await env.PRICES_KV.get("…", "json");
  …
}
```
- Only works in routes that ride the OpenNext bundle (i.e., **without** `runtime = "edge"`).
- `env` is typed via `cloudflare-env.d.ts`.

## KV binding (`wrangler.jsonc`)
```jsonc
{
  "kv_namespaces": [
    { "binding": "PRICES_KV", "id": "<prod-id>", "preview_id": "<preview-id>" }
  ]
}
```

## Cron limitation
CF free tier rejects 5-field crons in `wrangler.jsonc`. Use GitHub Actions `refresh-prices.yml` + admin endpoint instead.

## Local dev
- `npm run dev` — Next dev server (no Worker simulation).
- `npm run preview` — `wrangler dev` against `.open-next/` (real KV via `wrangler.jsonc`).

## Secrets
```bash
npx wrangler secret put ADMIN_REFRESH_TOKEN
npx wrangler secret put SCRAPINGBEE_API_KEY
```
