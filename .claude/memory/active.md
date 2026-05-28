# Active Work

## Current Focus
TPSO live pipeline + retail scraper hardening on Cloudflare Workers.

## Next Step
Verify ScrapingBee free-tier coverage for Global House / Thai Watsadu / BnB / SCG Home / Dohome; fall back to CF Browser Rendering only when ScrapingBee 4xx/5xx.

## Recently Done
- TPSO scraper smart sort (year+month from filename, not localeCompare)
- KV `PRICES_KV` bound (prod + preview), `ADMIN_REFRESH_TOKEN` set
- `runtime = "edge"` removed from all route handlers (opennextjs-cloudflare needs Node compat)
- `unpdf` moved to lazy `await import()` inside `parseCmiPdf`

## Blocked / Watching
- moc-price.moc.go.th egress blocked from Workers → manual upload fallback
- CGD scraper not yet wired (same PDF pattern as TPSO would work)
