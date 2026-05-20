# Construction Cost Engine — Session Memory

## Current State
- **Phase:** Phase 3 LIVE — TPSO real-data pipeline shipped end-to-end ✓
- **Stack:** Next.js 16 + React 19 + TS strict + Tailwind 4 inline `@theme` + Recharts + next-intl (TH only) + xlsx (SheetJS) + unpdf + Cloudflare Workers + KV
- **Live URL:** https://construction-cost-engine.steep-tooth-c420.workers.dev ✓
- **GitHub repo:** https://github.com/Bellero-Advanced/construction-cost-engine
- **Latest commit:** `a62aa24` (TPSO scraper smart sort)
- **CI:** All green ✓
- **Last updated:** 2026-05-20

## TPSO Live Pipeline (verified end-to-end)
```
tpso.go.th/summary-trade-economy-th
  ↓  (HTML scrape — find latest "CMI Report" PDF URL by parsed year+month)
uploads.tpso.go.th/6.2 CMI Report_March_2027.pdf  (text PDF, no OCR)
  ↓  (unpdf — extract text)
"ดัชนีราคาวัสดุก่อสร้างเดือนมีนาคม 2568 เท่ากับ 112.8"
  ↓  (regex parse: index, YoY%, MoM%, period)
PRICES_KV  →  tpso:cmi:latest = {index:112.8, yoyPct:0.5, momPct:0.6, ...}
  ↓
GET /api/prices/tpso/CEMENT_001?province=10 →
  base × (112.8 / 110.0) = 175.0 × 1.0255 = 179.45 ฿
  + {live:true, fetchedAt:"2026-05-20T13:13:59Z"}
```

## API Routes
- `GET  /api/prices/[source]/[material]?province=N` — provider→KV→mock fallback. Returns `{price, live, fetchedAt, ttlSec}`. **TPSO returns live**, others fall back to deterministic mock.
- `GET  /api/prices/status` — TPSO `mode:"live"`, others `"mock"`.
- `POST /api/admin/refresh-prices` (header `x-admin-token`) — runs `refreshTpsoIndex(env.PRICES_KV)`. Also `GET ?run=1&token=...` works.
- `GET  /api/sources/tpso/cmi` — reads cached snapshot. Returns `{baseline, ratio, index, yoyPct, momPct, reportPeriod, reportUrl, fetchedAt}`.
- `GET  /api/sources/freshness` — surfaces upstream `data.go.th` CKAN metadata (TPSO + CGD packages).

## Bugs hit this session (all fixed)
1. **Cron trigger 5-field reject (CF free tier)** — dropped from `wrangler.jsonc`.
2. **`runtime = "edge"` ↔ opennextjs/cloudflare incompat** — that runtime never gets `cloudflareContextSymbol` global injected → `getCloudflareContext` throws `Cannot read properties of undefined (reading 'default')`. **Fix:** drop `export const runtime = "edge"` from all 5 route handlers; OpenNext-Cloudflare bundles them into a Node.js-compat Worker via `nodejs_compat`.
3. **Top-level `unpdf` import** crashed module graph load in Workers — moved to lazy `await import("unpdf")` inside `parseCmiPdf`.
4. **`localeCompare` URL sort** ranked `cmi_report_oct_2019_final.pdf` above `6.2 CMI Report_Oct_2026.pdf` (lowercase > digit). **Fix:** parse year+month from filename → numeric sort.

## Infrastructure
- **KV `PRICES_KV`** — bound (prod `a738f53806bf4a119665effc487b7f16`, prev `be1c2d44e903453ba33524a91e983c20`)
- **Worker secret `ADMIN_REFRESH_TOKEN`** — set via `wrangler secret put` (24-byte hex)
- Cron disabled (CF free tier limit) — manual refresh via POST/GET admin endpoint, or schedule externally with GitHub Actions on a cron.

## Tech Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | Modern SSR + RSC |
| Charts | Recharts | React-native, tree-shakes |
| Styling | Tailwind 4 inline `@theme` | Tokens in `globals.css` |
| i18n | next-intl, TH only | Per user — demo scope |
| UX | Zero transitions/animations | "Rust-like" instant response |
| Live cache | Cloudflare KV (`PRICES_KV`) | Bound, edge-replicated |
| PDF parse | `unpdf` (pdfjs core) | Workers-compatible, no OCR needed for text PDFs |
| Excel | xlsx (SheetJS) client-side | Thai unicode native |
| Print PDF | `window.print()` + `@media print` | Best Thai fonts |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` | Mirrors factory-landing |

## Source Status
| Source | Mode | Path |
|---|---|---|
| TPSO | **LIVE** | tpso.go.th HTML scrape → CMI PDF parse → KV cache (60-day TTL) |
| CGD | mock | text-extractable PDFs available; same pattern would work, not yet wired |
| HomePro / GlobalHouse / ThaiWatsadu / BnB | mock | SPAs — need headless browser or XHR reverse-engineer |

## Known Issues / TODO
- One TPSO filename has "March_2027" in URL but text is "มีนาคม 2568" (March 2025). PDF text is the source of truth; URL is just metadata.
- CGD scraper not yet wired — same pattern as TPSO would extract their monthly index PDF.
- Retail sources still mock — needs Playwright/browserless work (~$5-20/mo).
- DataModeBadge currently fires once per result render — could throttle.

## Project Identity
Construction Cost Engine — calculator for material cost estimation with **real live TPSO CMI integration** + mock fallbacks. 6 sources covered (TPSO live + 5 mock), 10 provinces, 20 materials, 12-month trends. TH locale only. Snappy zero-animation UX.
