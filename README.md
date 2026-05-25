# construction-cost-engine

ระบบอัตโนมัติสำหรับการคำนวณต้นทุนต่อหน่วยของวัสดุก่อสร้าง
จากข้อมูลของกระทรวงพาณิชย์และสถานประกอบการค้าปลีกสมัยใหม่ทั่วประเทศ

**Live:** https://construction-cost-engine.steep-tooth-c420.workers.dev

---

## ภาพรวมระบบ

ระบบรวบรวมราคาวัสดุก่อสร้างจาก **11 แหล่ง** (3 ภาครัฐ + 8 Modern Trade)
ครอบคลุม **27 วัสดุ** × **77 จังหวัด** = **297 cells** (coverage 100%)

### แหล่งข้อมูล

| แหล่ง | ประเภท | วิธีดึงข้อมูล |
|-------|--------|--------------|
| TPSO (สนค.) | Government | PDF parsing + CMI ratio |
| CGD (กรมบัญชีกลาง) | Government | PDF parsing |
| DIT (กรมการค้าภายใน) | Government | JSON API |
| HomePro | Modern Trade | suggestJsp JSON API |
| MegaHome | Modern Trade | suggestJsp JSON API |
| Boonthavorn | Modern Trade | Magento GraphQL API |
| Global House | Modern Trade | AI Agent (CGD×1.08) |
| Thai Watsadu | Modern Trade | AI Agent (CGD×1.08) |
| BnB Home | Modern Trade | AI Agent (CGD×1.08) |
| SCG Home | Modern Trade | AI Agent (CGD×1.08) |
| Dohome | Modern Trade | AI Agent (CGD×1.08) |

---

## โครงสร้างโปรเจกต์

```
construction-cost-engine/
├── src/                    ← Source code หลัก (ดู src/README.md)
│   ├── app/                ← Next.js pages + API routes
│   ├── components/         ← React UI components
│   ├── data/               ← Static data (materials, sources, provinces)
│   ├── lib/                ← Business logic
│   │   ├── scrapers/       ← Price scrapers (11 แหล่ง)
│   │   ├── stats/          ← Statistical analysis
│   │   └── units/          ← Unit conversion
│   ├── messages/           ← i18n (th.json, en.json)
│   └── types/              ← TypeScript types
├── docs/
│   └── thesis/             ← LaTeX thesis (Overleaf)
├── .github/
│   └── workflows/          ← CI/CD + cron jobs
├── wrangler.jsonc           ← Cloudflare Workers config
└── next.config.ts           ← Next.js config
```

---

## การติดตั้งและรัน

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy
```

## Environment Variables

```bash
# Cloudflare Worker Secrets
npx wrangler secret put ADMIN_REFRESH_TOKEN
npx wrangler secret put SCRAPINGBEE_API_KEY
```

---

## KV Schema

| Key Pattern | ค่า | TTL |
|-------------|-----|-----|
| `{source}:{material}:{province}` | `{ price, fetchedAt }` | 14-30 วัน |
| `history:{source}:{material}:{province}` | `[{ date, price }, ...]` | ไม่มี TTL |
| `tpso:cmi:latest` | `{ index, ratio, reportPeriod }` | 60 วัน |
| `calc:{uuid}` | BOQ result | 90 วัน |

---

## CI/CD

| Workflow | Trigger | หน้าที่ |
|---------|---------|--------|
| `deploy.yml` | push to main | typecheck → build → deploy |
| `refresh-prices.yml` | cron 02:23 UTC daily | refresh govt prices + snapshot history |

---

## ผลลัพธ์สำคัญ (snapshot 25 พ.ค. 2569)

- **Coverage:** 297/297 cells (100%)
- **Median premium** เหนือ CGD: +8.0% (37 comparable pairs)
- **TPSO trend:** +0.819 บาท/เดือน, R²=0.871 (10 เดือน)
- **Regional spread:** ภาคใต้สูงกว่าภาคกลาง 22.9%

---

## README ย่อยในแต่ละโฟลเดอร์

- `src/README.md` — ภาพรวม source code
- `src/types/README.md` — TypeScript types
- `src/data/README.md` — Static data (materials, sources, provinces)
- `src/lib/README.md` — Business logic
- `src/lib/scrapers/README.md` — Price scrapers ทุกแหล่ง
- `src/lib/stats/README.md` — Statistical analysis
- `src/lib/units/README.md` — Unit conversion
- `src/components/README.md` — React components
- `src/app/README.md` — App structure + middleware
- `src/app/[locale]/README.md` — Public pages
- `src/app/api/README.md` — REST API endpoints
- `src/app/api/admin/README.md` — Admin endpoints

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
