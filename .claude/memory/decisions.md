# Frozen Decisions

> Append-only. If a decision must change, write a new entry — do not edit history.

## 2026-05-19 · No backend
This is a static + edge-compute demo. Data lives in `src/data/` (mock) + Cloudflare KV (live). No relational DB, no auth.

## 2026-05-19 · Recharts only
Do not introduce Chart.js or D3. Recharts handles every chart we ship.

## 2026-05-19 · Tailwind 4 inline `@theme`
All design tokens in `src/app/globals.css`. No `tailwind.config.ts`.

## 2026-05-20 · Drop `runtime = "edge"` from route handlers
`@opennextjs/cloudflare` bundles routes into a Node-compat Worker (`nodejs_compat`). Routes with `runtime = "edge"` never receive `cloudflareContextSymbol`, so `getCloudflareContext()` throws. Reason: actual prod incident — TPSO refresh route 500'd.

## 2026-05-20 · Lazy-import `unpdf`
Top-level `import` of `unpdf` crashes the Worker module graph at load. Always `await import("unpdf")` inside the function that needs it.

## 2026-05-20 · No CF cron (free tier)
Wrangler 5-field cron triggers rejected on free tier. Schedule refreshes from **GitHub Actions** cron (`refresh-prices.yml`) hitting the admin endpoint instead.

## 2026-05-20 · Retail scraper tier order
1. Provider has a JSON API → use it (HomePro, MegaHome, Boonthavorn).
2. ScrapingBee free tier (residential proxy).
3. CF Browser Rendering fallback (paid).
4. Last resort: AI agent CGD×1.08 estimate.
