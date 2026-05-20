# Construction Cost Engine — Project Overview

> เอกสารสรุปสถานะโปรเจคและสิ่งที่ทำลงไป (ณ 2026-05-20)
> Phase 3 LIVE — TPSO real data pipeline พร้อมใช้งานบน production

---

## 1. โปรเจคนี้คืออะไร

**Construction Cost Engine** — เครื่องคำนวณต้นทุนวัสดุก่อสร้างไทย (TH only)
รวมราคาวัสดุจากหลายแหล่ง (ภาครัฐ + ค้าปลีก) แสดงเปรียบเทียบ + วาดกราฟ + ส่งออก BOM

- **ภาษา:** ไทยอย่างเดียว (EN/ZH ถูกถอดออกตามคำสั่ง user)
- **กลุ่มผู้ใช้:** ผู้รับเหมา / เจ้าของบ้าน / นักประเมินราคา
- **Deploy:** Cloudflare Workers (production)
- **Repo:** `/Users/macbookaair/Documents/bellerox_workspace/construction-cost-engine`

---

## 2. Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript strict |
| UI | React 19, Tailwind CSS 4 (inline `@theme`) |
| i18n | next-intl (TH only) |
| Charts | Recharts |
| Export | xlsx (SheetJS) สำหรับ Excel, `window.print()` สำหรับ PDF |
| PDF Parser | `unpdf` (text extraction, ไม่ต้องใช้ OCR) |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` v1.18 |
| Cache | Cloudflare KV (`PRICES_KV` binding) |
| Data Source | data.go.th CKAN API + TPSO website scraping |

---

## 3. ฟีเจอร์ที่มีตอนนี้

### 3.1 เครื่องคำนวณ (Calculators)
- **Wall Tile Calculator** — คำนวณจำนวนกระเบื้อง+ปูน+กาวจากพื้นที่ผนัง
- **Column-Beam Calculator** — คำนวณคอนกรีต+เหล็กสำหรับเสา/คาน
- **Rebar Calculator** — คำนวณน้ำหนัก/ราคาเหล็กเส้นตามขนาด+ความยาว

ทุก calculator แสดง BOM (Bill of Materials) พร้อมราคารวมจากแหล่งที่เลือก

### 3.2 หน้ากราฟวิเคราะห์ (Charts)
- `/compare` — เปรียบเทียบราคาวัสดุข้ามแหล่ง
- `/stores` — เปรียบเทียบราคาข้ามร้านค้าปลีก
- `/trend` — แนวโน้มราคารายเดือน (mock baseline + live delta)
- `/sources` — สถานะ + freshness ของแต่ละแหล่งข้อมูล

### 3.3 ส่งออกข้อมูล
- **Excel (xlsx)** — BOM พร้อมสูตร, ราคาต่อหน่วย, ราคารวม
- **PDF** — print-optimized layout (`.doc` class + responsive padding)

### 3.4 Live Data Pipeline (TPSO) — ✅ ทำงานจริง
```
tpso.go.th → fetch HTML → match CMI Report PDF URL
           → score by year×100+month → pick newest
           → fetch PDF → unpdf.extractText
           → regex: "เท่ากับ XXX.X" + YoY% + MoM%
           → write KV (60-day TTL)
           → on read: base × (snap.index / 110) → live price
```

**ตัวอย่างผลจริง (2026-05-20):**
- CMI March 2025 = 112.8, ratio 1.0255
- `GET /api/prices/tpso/CEMENT_001?province=10`
  → `{ price: 179.45, live: true, fetchedAt: "2026-05-20T13:13:59Z", ttlSec: 604800 }`

### 3.5 UI/UX
- Single-row slim header (logo + nav inline, hamburger บนมือถือ)
- LIVE/MOCK badge บอกแหล่งข้อมูลแบบ real-time
- Zero animation policy — `* { transition: none !important; animation: none !important }` (snappy แบบ Rust)
- Mobile responsive ทุกหน้า (padding ladder 16/22/28px ตาม breakpoint)
- Footer มี ABOUT / DATA SOURCES / DISCLAIMER + BUILD label

---

## 4. API Endpoints

| Route | Purpose |
|---|---|
| `GET /api/prices/[source]/[material]?province=N` | คืนราคา live หรือ mock |
| `GET /api/prices/status` | list provider ที่ลงทะเบียน (live vs mock) |
| `POST /api/admin/refresh-prices` (header `x-admin-token`) | trigger refresh TPSO ด้วยมือ |
| `GET /api/sources/tpso/cmi` | อ่าน snapshot KV ล่าสุด |
| `GET /api/sources/freshness` | freshness จาก data.go.th CKAN (TPSO + CGD) |

---

## 5. โครงสร้างโค้ดที่สำคัญ

```
src/
├── lib/
│   ├── livePrice.ts          # provider registry + KV cache + fallback to mock
│   ├── pricing.ts             # deterministic mock baseline (ทุก source/material/province)
│   └── scrapers/
│       └── tpso.ts            # ✅ real TPSO PDF scraper
├── app/api/
│   ├── prices/[source]/[material]/route.ts
│   ├── prices/status/route.ts
│   ├── admin/refresh-prices/route.ts
│   └── sources/
│       ├── tpso/cmi/route.ts
│       └── freshness/route.ts
├── components/calculator/
│   └── DataModeBadge.tsx      # LIVE/MOCK pill
└── messages/th.json           # ทุกข้อความภาษาไทย
```

---

## 6. Infrastructure ที่ตั้งค่าไว้

- **`wrangler.jsonc`**
  - KV binding `PRICES_KV` (prod `a738f53806bf4a119665effc487b7f16`, preview `be1c2d44e903453ba33524a91e983c20`)
  - **ไม่มี** cron triggers (Cloudflare free tier ปฏิเสธ 5-field schedule)
- **Secrets (ผ่าน `wrangler secret put`, ไม่อยู่ใน repo)**
  - `ADMIN_REFRESH_TOKEN` — ใช้ใน header `x-admin-token` สำหรับ trigger refresh
- **`cloudflare-env.d.ts`** — typed binding + secret

---

## 7. การเพิ่มแหล่งราคาใหม่ (How to plug in a source)

1. สร้าง `src/lib/scrapers/<source>.ts` ที่ export `PriceProvider`
2. ลงทะเบียนใน `src/lib/livePrice.ts` → `PROVIDERS` map
3. ตั้ง TTL ใน `DEFAULT_TTL` (govt = weekly, retail = daily)
4. (option) เพิ่ม refresh route ใน `/api/admin/refresh-prices`

ดู `docs/phase-3-live-prices.md` สำหรับคู่มือเต็ม

---

## 8. ยังขาดอะไร (What's Missing)

### 8.1 แหล่งข้อมูลที่ยังไม่ได้ wire จริง

| Source | สถานะ | ทำได้ยังไง |
|---|---|---|
| **TPSO** | ✅ LIVE | — |
| **CGD** (กรมบัญชีกลาง) | ❌ MOCK | ทำตาม pattern TPSO ได้เลย — เป็น PDF บน data.go.th เหมือนกัน |
| **HomePro** | ❌ MOCK | SPA — ต้อง headless browser (Playwright/Puppeteer) หรือ reverse-engineer XHR |
| **GlobalHouse** | ❌ MOCK | SPA — เหมือน HomePro |
| **ThaiWatsadu** | ❌ MOCK | SPA — เหมือน HomePro |
| **BnB Home** | ❌ MOCK | SPA — เหมือน HomePro |

**ค่าใช้จ่ายโดยประมาณสำหรับ retail scrapers:** $5–20/เดือนสำหรับ headless browser service (Browserless, ScrapingBee) หรือ self-host บน VPS

### 8.2 Automation
- **Cron refresh** — ยังต้อง trigger เอง (Cloudflare free tier ไม่รองรับ cron บน Worker นี้)
  - ทางเลือก: GitHub Actions schedule → curl `/api/admin/refresh-prices`
  - หรือ external scheduler (cron-job.org, EasyCron)

### 8.3 Data quality
- TPSO CMI เป็น **headline index ตัวเดียว** ไม่ได้แยกราคาวัสดุรายตัว → ใช้เป็น multiplier บน mock baseline
- ถ้าต้องการราคาแยกรายวัสดุจริง ต้องไป OCR ตาราง CGD รายเดือน (PDF มีตาราง 80+ แถว)

### 8.4 UX/Feature gaps
- ยังไม่มี user account / saved BOM
- ยังไม่มี history ราคาย้อนหลังจริง (trend page ใช้ baseline + delta จำลอง)
- ยังไม่มี notification เมื่อราคาเปลี่ยนเกิน threshold
- ยังไม่มี API key สำหรับ external consumer

---

## 9. Bug ที่เจอ + แก้แล้วใน session นี้

1. **`runtime = "edge"` ทำให้ `getCloudflareContext` พัง** — `cloudflareContextSymbol` global ไม่ถูก inject ใน Vercel-edge runtime → ลบ `export const runtime = "edge"` ออกจากทุก route (commit `24eaab8`)
2. **`unpdf` top-level import ทำ module graph พัง** — เปลี่ยนเป็น `await import("unpdf")` แบบ lazy (commit `ebca895`)
3. **`localeCompare` sort URL ผิด** — `oct_2019` มาก่อน `Oct_2026` เพราะ 'c' > '6' → เขียน `scoreReportUrl()` parse year+month numeric sort (commit `a62aa24`)
4. **Cron schedule rejected** — CF free tier ไม่รับ → ลบ `triggers` block (commit `62a6b52`)
5. **Stale `.next/types/cache-life.d 2.ts`** — macOS Finder copy artifacts → `rm -rf .next` ก่อน build

---

## 10. คำสั่งที่ใช้บ่อย

```bash
# Dev
npm run dev

# Type check (run separately - build skips TS check)
rm -rf .next && npx tsc --noEmit

# Build + deploy
npx opennextjs-cloudflare build
npx opennextjs-cloudflare deploy

# Trigger live refresh
curl -X POST https://<worker-url>/api/admin/refresh-prices \
  -H "x-admin-token: $ADMIN_REFRESH_TOKEN"

# Check live status
curl https://<worker-url>/api/prices/status
curl https://<worker-url>/api/sources/tpso/cmi
```

---

## 11. Next Priorities (แนะนำ)

1. **CGD scraper** — pattern เหมือน TPSO, ใช้ `unpdf` ได้เลย (~1–2 hr)
2. **GitHub Actions cron** — `.github/workflows/refresh-prices.yml` ทุก 6 ชม.
3. **Retail scraper PoC** — เลือก HomePro 1 ร้าน, ใช้ Browserless free tier
4. **Trend page real history** — เก็บ snapshot รายเดือนใน KV/D1 แทน mock
5. **Admin UI** — หน้าจัดการ refresh + KV inspection (ตอนนี้ใช้ curl)
