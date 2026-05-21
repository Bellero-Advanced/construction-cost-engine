# Construction Cost Engine — Project Overview

> สถานะปัจจุบัน ณ 2026-05-21 — Phase 5 (Product Surface) ผ่านแล้ว
> ทุก source ที่ wire เป็น **live** หมด (no mock fallback). มี cross-source compare, source health dashboard, ScrapingBee fallback, และ daily history cron

---

## 1. โปรเจคนี้คืออะไร

**Construction Cost Engine** — REST API + calculator สำหรับราคาวัสดุก่อสร้างไทย
รวมราคาจาก **10 แหล่ง** (3 รัฐ + 7 ค้าปลีก) ใส่ KV cache, edge-cache, มี cross-source compare + freshness dashboard + BoQ export

- **ภาษา:** ไทยอย่างเดียว (EN/ZH ถูกถอดออก)
- **กลุ่มผู้ใช้:** ผู้รับเหมา / นักประเมินราคา / 3rd-party API consumer
- **Live URL:** https://construction-cost-engine.steep-tooth-c420.workers.dev
- **Repo:** github.com/Bellero-Advanced/construction-cost-engine
- **Path:** `/Users/macbookaair/Documents/bellerox_workspace/construction-cost-engine`

---

## 2. Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript strict |
| UI | React 19, Tailwind CSS 4 (inline `@theme`) |
| i18n | next-intl (TH only) |
| Charts | Recharts |
| Export | xlsx (SheetJS) สำหรับ Excel, `window.print()` สำหรับ PDF, custom `csv.ts` สำหรับ tabular |
| PDF Parser | `unpdf` (lazy import) |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` v1.18+ (Workers Paid plan) |
| Cache | Cloudflare KV (`PRICES_KV` binding) |
| Headless | Cloudflare Browser Rendering (`BROWSER` binding) + `@cloudflare/puppeteer` |
| Residential Proxy | ScrapingBee free tier (1000 req/mo) — opt-in via `SCRAPINGBEE_API_KEY` |
| Scheduler | GitHub Actions cron (daily 03:17 UTC) |

---

## 3. แหล่งข้อมูล (10 sources)

| Key | Type | Method | Live status |
|---|---|---|---|
| `tpso` | govt index | data.go.th CKAN → PDF → `unpdf.extractText` → CMI value | ✅ live (March 2025 = 112.8) |
| `cgd` | govt prices | data.go.th auto-discovery (`cmicgd<MM><BE_year>`) → PDF/XLSX | 🟡 manual ingest (data packages = budget, not prices) |
| `dit` | govt prices | `moc-price.moc.go.th` | 🟡 manual ingest (CF egress unreachable) |
| `homepro` | retail | `/service/search/suggest.jsp` JSON | ✅ live (9/9 materials) |
| `megahome` | retail | `/service/search/suggest.jsp` JSON | ✅ live (3/5 materials) |
| `globalhouse` | retail | ScrapingBee → CF Browser Rendering fallback | 🟡 needs `SCRAPINGBEE_API_KEY` |
| `thaiwatsadu` | retail | ScrapingBee → CF Browser Rendering fallback | 🟡 needs `SCRAPINGBEE_API_KEY` |
| `bnb` | retail | ScrapingBee → CF Browser Rendering fallback | 🟡 needs `SCRAPINGBEE_API_KEY` |
| `scghome` | retail | ScrapingBee → CF Browser Rendering fallback | 🟡 needs `SCRAPINGBEE_API_KEY` |
| `dohome` | retail | ScrapingBee → CF Browser Rendering fallback | 🟡 needs `SCRAPINGBEE_API_KEY` |

**Manual ingest path** (ทุก source): `POST /api/admin/upload-prices` → KV → `/api/prices/...` ทำงานทันที. มี UI ที่ `/sources` (CsvUploader)

**No mock fallback** — ตอบ `{price: null, available: false}` เมื่อไม่มีข้อมูลจริง

---

## 4. หน้าทั้งหมด

| Path | Purpose |
|---|---|
| `/` | Overview + KPI tiles |
| `/wall-tile` `/column-beam` `/rebar` | Calculators (Excel + PDF + print export) |
| `/sources` | Live price table ต่อ source × province + freshness column + Export CSV + admin CsvUploader |
| `/compare` | เปรียบเทียบราคา 1 วัสดุ ข้ามทุกจังหวัด (same source) |
| `/compare-sources` | เปรียบเทียบราคา 1 วัสดุ ข้ามทุก source (same province) — bar chart + spread% + CSV |
| `/trend` | 12-month chart (real history เมื่อ cron สะสม) — source dropdown 10 entries |
| `/health` | Source health dashboard (coverage% / fresh / ok / stale / missing) |
| `/api-docs` | REST reference + sources/materials enums + curl examples |
| `/stores` | Retail store comparison |

---

## 5. REST API (ทุก endpoint)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/prices/:source/:material?province=N` | One material × one source. Returns `{price, live, available, fetchedAt, ttlSec}` |
| GET | `/api/compare/:material?province=N` | Fan-out ทุก 10 sources + summary `{min,max,avg,median,spreadPct}` |
| GET | `/api/history/:source/:material?province=N` | KV time-series, 30min edge cache |
| GET | `/api/prices/status` | Per-source mode + KV cache key counts + ScrapingBee state |
| GET | `/api/sources/freshness` | data.go.th CKAN upstream metadata |
| GET | `/api/sources/health?province=N` | Aggregated freshness counts (fresh/ok/stale/missing) + coverage% |
| GET | `/api/sources/tpso/cmi` | TPSO CMI index value |
| POST | `/api/admin/upload-prices` | Manual ingest. Body `{source, province, prices:{material_id:price}}`. Auth |
| POST | `/api/admin/refresh-prices?source=` | Trigger live re-fetch (filter optional). Auth |
| POST | `/api/admin/snapshot-history` | Append today's prices to KV time-series (writes for **all 10 sources**). Cron-driven. Auth |
| POST | `/api/admin/scrape-debug` | Post-hydration candidate finder for selector tuning. Auth |

**Rate limit:** retail 30/min, govt 120/min, per IP (KV fixed window)
**Auth:** `x-admin-token` header against `ADMIN_REFRESH_TOKEN` secret
**Public exclude:** `/robots.txt` disallows `/api/admin/`

---

## 6. โครงสร้างโค้ดที่สำคัญ

```
src/
├── lib/
│   ├── livePrice.ts            # provider registry + KV cache (no mock fallback)
│   ├── csv.ts                  # toCsv() + downloadCsv() (UTF-8 BOM ให้ Excel TH)
│   ├── rateLimit.ts            # KV fixed-window per IP per source bucket
│   └── scrapers/
│       ├── _headless.ts        # CF Browser Rendering helper + material search keywords
│       ├── _suggestJsp.ts      # HomePro / MegaHome JSON API
│       ├── _retail.ts          # ScrapingBee → headless fallback
│       ├── _scrapingbee.ts     # Proxy fetch + HTML price extraction
│       ├── tpso.ts             # CMI PDF → unpdf
│       ├── cgd.ts              # data.go.th auto-discover (PDF/XLSX)
│       ├── dit.ts              # moc-price.moc.go.th (egress-blocked)
│       ├── homepro.ts megahome.ts        # JSON API
│       └── globalhouse.ts thaiwatsadu.ts bnb.ts scghome.ts dohome.ts  # via _retail
├── app/
│   ├── api/
│   │   ├── prices/{[source]/[material],status}/route.ts
│   │   ├── compare/[material]/route.ts
│   │   ├── history/[source]/[material]/route.ts
│   │   ├── sources/{freshness,health,tpso/cmi}/route.ts
│   │   └── admin/{upload-prices,refresh-prices,snapshot-history,scrape-debug}/route.ts
│   ├── sitemap.ts  robots.ts
│   └── [locale]/
│       ├── (wall-tile|column-beam|rebar)/page.tsx          # Calculators
│       ├── (sources|compare|compare-sources|trend|stores|health|api-docs)/page.tsx
│       └── ...
├── components/
│   ├── calculator/{CalculatorResult,DataModeBadge,Selectors}.tsx
│   └── admin/CsvUploader.tsx
└── messages/th.json
```

---

## 7. Infrastructure

### `wrangler.jsonc`
- `main: ".open-next/worker.js"` + `assets` directory
- `kv_namespaces.PRICES_KV` — prices + history cache (prod `a738f53806bf4a119665effc487b7f16`)
- `browser.binding: BROWSER` — Browser Rendering (Workers Paid plan)
- `compatibility_flags`: `nodejs_compat`, `global_fetch_strictly_public`
- **ไม่มี** Worker cron (OpenNext wrap ขัด — ใช้ GH Actions แทน)

### `cloudflare-env.d.ts`
```ts
interface CloudflareEnv {
  PRICES_KV?: KVNamespace;
  BROWSER?: Fetcher;
  ADMIN_REFRESH_TOKEN?: string;
  SCRAPINGBEE_API_KEY?: string;
}
```

### Secrets (`wrangler secret put`)
- `ADMIN_REFRESH_TOKEN` — `x-admin-token` header สำหรับ admin POST + GH cron
- `SCRAPINGBEE_API_KEY` — optional residential proxy (free tier 1000 req/mo) สำหรับ 5 retail sites ที่โดน bot-block

### GitHub Actions
- `.github/workflows/deploy.yml` — typecheck + `opennextjs-cloudflare deploy` ทุก push ไป `main`
- `.github/workflows/refresh-prices.yml` — daily 03:17 UTC → POST `/api/admin/refresh-prices` (tpso/cgd/dit) + POST `/api/admin/snapshot-history`

---

## 8. การเพิ่มแหล่งราคาใหม่

1. สร้าง `src/lib/scrapers/<source>.ts` export `PriceProvider`
   - ถ้าเป็นรายปลีก HomePro-family: ใช้ `makeSuggestJspProvider`
   - ถ้าเป็น SPA ทั่วไป: ใช้ `makeRetailProvider` (ได้ ScrapingBee→headless ฟรี)
   - ถ้าเป็น PDF/HTML รัฐ: เขียน fetch+parse เองเหมือน `tpso.ts`
2. ลงทะเบียนใน `src/lib/livePrice.ts` → `PROVIDERS` map
3. เพิ่มใน `src/data/sources.ts` (key + name + type + color + url)
4. เพิ่ม `SourceKey` ใน `src/types/index.ts`
5. (option) เพิ่ม TTL ใน `/api/admin/upload-prices` `DEFAULT_TTL_BY_SOURCE`

---

## 9. ที่ยังเหลือ / Truly Remaining

### 9.1 Manual gates (ต้องคนทำเอง)
- **Activate ScrapingBee:** `npx wrangler secret put SCRAPINGBEE_API_KEY` — code path live แล้ว, แค่ใส่ key
- **Verify TPSO domain Resend** — ไม่เกี่ยว project นี้ (factory-landing)

### 9.2 Passive (รอ cron สะสม)
- **Trend page real curves** — `/api/admin/snapshot-history` snapshot ทุก 10 sources แล้ว, รอ ~7 วันให้สะสม

### 9.3 Upstream blockers (ไม่ใช่ bug ของเรา)
- **CGD via data.go.th** — packages เป็น budget reports ไม่ใช่ราคาวัสดุ → ใช้ `/api/admin/upload-prices` รายเดือน
- **DIT (`moc-price.moc.go.th`)** — URL deprecated/unreachable จาก CF egress
- **CGD direct (`cgd.go.th`)** — 403 anti-bot

### 9.4 Future scope (ไม่จำเป็น)
- User account / saved BoQ
- Notification เมื่อราคาเปลี่ยนเกิน threshold
- API key สำหรับ external consumer (ตอนนี้ใช้ rate limit แบบ public)
- Reverse-engineer Dohome / SCG Home XHR APIs (ลด ScrapingBee credit)

---

## 10. คำสั่งที่ใช้บ่อย

```bash
# Dev
npm run dev

# Typecheck
npx tsc --noEmit

# Build + deploy
npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy

# Trigger live refresh (filter optional)
curl -X POST https://<worker-url>/api/admin/refresh-prices?source=tpso \
  -H "x-admin-token: $ADMIN_REFRESH_TOKEN"

# Bulk upload (CGD/DIT monthly)
curl -X POST https://<worker-url>/api/admin/upload-prices \
  -H "x-admin-token: $ADMIN_REFRESH_TOKEN" \
  -H "content-type: application/json" \
  -d '{"source":"cgd","province":10,"prices":{"CEMENT_001":175,"SAND_001":480}}'

# Sanity
curl https://<worker-url>/api/prices/status | jq .scrapingBee
curl https://<worker-url>/api/sources/health | jq .summary
curl https://<worker-url>/api/compare/CEMENT_001?province=10 | jq .summary
```

---

## 11. Recent commits (this overview reflects state at e96cb79)

```
e96cb79 fix(DataModeBadge): align with new SourceStatus mode enum
de080b0 docs: replace boilerplate README with project overview
aa4caf4 docs: PHASE-4-STATUS — Phase 5 health dashboard + trend coverage
e2251d8 feat: /health source-health dashboard page
13f9924 feat: GET /api/sources/health — aggregated freshness across all sources
3f589c8 feat(history): cover all 10 sources, expose retail in trend selector
b01cae4 docs: PHASE-4-STATUS — add freshness UX section
8fe88f5 feat(sources): freshness column with FRESH/OK/STALE badge per row
54a3d50 feat: sitemap.ts + robots.ts + Phase-5 doc update
e7d70ee feat: cross-source compare page + API + API docs page + CSV export
c2eacb8 feat(admin): CSV bulk price uploader on /sources page
c33f476 feat: ScrapingBee free-tier proxy for bot-blocked retail scrapers
742598e docs: PHASE-4-STATUS — HomePro 9/9 + MegaHome 3/5 + CGD manual ingest verified
```

See `docs/PHASE-4-STATUS.md` for verification log + upstream blockers + production sample output.

