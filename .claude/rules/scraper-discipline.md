# Scraper Discipline

## Tier order is binding (decisions.md 2026-05-20)
1. Provider JSON API.
2. ScrapingBee free tier.
3. CF Browser Rendering.
4. AI estimate from CGD × multiplier.

Don't skip levels. If level N fails, fall to N+1, never silently to mock.

## Worker compatibility
- No `runtime = "edge"` on KV/Browser-Rendering routes.
- Lazy-import heavy modules (`unpdf`, `xlsx`, `puppeteer`) inside the function.
- Wall clock < 25s per scrape (Workers limit). Fail fast with `AbortSignal.timeout`.

## Honest failure
A scraper returns `null` (or `{ ok: false, error }`) on every failure path — never throws out of the API route. The route falls through to mock with `live: false`.

## Cache contract
- TTL: 14d volatile, 30d stable retail, 60d govt index.
- Always include `fetchedAt`.
- Key: lowercase `{source}:{material}:{province}` exactly.
