# Phase 4 — Production Verified (2026-05-21)

## ✅ LIVE จริง — verified ที่ production endpoint

### Auto-scrapers (ไม่ต้อง upload)

| Source | Method | Status | Verified materials |
|---|---|---|---|
| **TPSO** (CMI index) | PDF + unpdf | ✅ LIVE | index 112.8, มีนาคม 2568 |
| **HomePro** | `/service/search/suggest.jsp` JSON API | ✅ LIVE | **9/9** materials (220/82/632/170/279/80/270/270/130) |
| **MegaHome** | `/service/search/suggest.jsp` JSON API | ✅ LIVE | 3/5 (สินค้าที่มีในสต็อก) |

### Manual ingest path (ใช้ได้ทุก source)

`POST /api/admin/upload-prices` → KV → `/api/prices/<src>/<mat>` ทำงานทันที

ตัวอย่างที่ verified:
```bash
curl -X POST $WORKER/api/admin/upload-prices \
  -H "x-admin-token: $TOKEN" \
  -H "content-type: application/json" \
  -d '{"source":"cgd","province":10,"prices":{
    "CEMENT_001":175, "SAND_001":480, "REBAR_DB12":620, ...
  }}'
# → written: 6 materials, ttlSec: 30 days

curl $WORKER/api/prices/cgd/CEMENT_001?province=10
# → {"price":175,"live":true,"available":true,"fetchedAt":"..."}
```

---

## 🟡 Sources ที่ต้องใช้ manual ingest (ใช้งานได้แต่ไม่ auto)

| Source | Reason | Workaround |
|---|---|---|
| **CGD** | data.go.th packages คืองบประมาณ ไม่ใช่ราคาวัสดุ; `cgd.go.th` 403 anti-bot | Upload monthly via `/api/admin/upload-prices` หรือเขียน script จาก source อื่น |
| **DIT** | `moc-price.moc.go.th` URL deprecated/unreachable | Upload daily via `/api/admin/upload-prices` |
| **Thai Watsadu** | Cloudflare bot challenge (target ใช้ CF protection) | Upload หรือใช้ residential proxy |
| **BnB Home** | Cloudflare bot challenge | Upload หรือใช้ residential proxy |
| **Global House** | API endpoint ส่ง `Failed to fetch data` | Upload หรือ reverse-engineer params |
| **SCG Home** | SPA, ไม่มี suggest.jsp endpoint | Upload หรือ XHR reverse-engineering |
| **Dohome** | SPA, ไม่มี suggest.jsp; `/_next/data` ไม่ public | Upload หรือ XHR reverse-engineering |

---

## ความสำเร็จของ session นี้

- **Discovery:** พบ HomePro + MegaHome JSON suggest API ผ่าน `/service/search/suggest.jsp`
  → เปลี่ยนจาก Browser Rendering (slow + expensive + bot-blocked) มาเป็น direct fetch
- **Cost reduction:** Browser Rendering quota ใช้น้อยลง ~95% (เหลือเฉพาะ debug)
- **Resilience:** ลบ content-type check (MegaHome ส่ง JSON เป็น text/html), loose token match + fallback
- **Manual ingest:** `/api/admin/upload-prices` เปิดทางให้ user/3rd-party scraper อัพ ราคาเข้า KV ได้ทุกแหล่ง
- **TPSO + HomePro + MegaHome + manual CGD** = ใช้งาน production จริงได้เลย

---

## Live verification log

```
=== HomePro (9 materials, all live) ===
  CEMENT_001      price=220   live=True
  SAND_001        price=82    live=True
  REBAR_DB12      price=632   live=True
  REBAR_RB6       price=170   live=True
  TILE_001        price=279   live=True
  NAIL_001        price=80    live=True
  WIRE_001        price=270   live=True
  ADHESIVE_001    price=270   live=True
  GROUT_001       price=130   live=True

=== MegaHome (3/5 live; missing items not in MegaHome's catalog) ===
  CEMENT_001      None
  SAND_001        129  live=True
  REBAR_DB12      None
  TILE_001        815  live=True
  NAIL_001        80   live=True

=== CGD via manual upload — round-trips correctly ===
  CEMENT_001      price=175  live=True  fetchedAt=2026-05-21T13:51:34
  SAND_001        price=480  live=True
  REBAR_DB12      price=620  live=True
```

---

## Next moves (เหลือสำหรับ session ถัดไป)

1. **ตั้งค่า ScrapingBee API key** — สมัคร free tier ที่ scrapingbee.com (1000 req/mo) แล้วตั้งเป็น Wrangler secret:
   ```bash
   npx wrangler secret put SCRAPINGBEE_API_KEY
   ```
   เมื่อ key ถูก bind, retail providers (thaiwatsadu/bnb/globalhouse/dohome/scghome) จะ route ผ่าน ScrapingBee proxy อัตโนมัติ (residential IP + JS render) แทนการยิงตรงจาก CF egress ที่โดน bot block
2. **Reverse-engineer Dohome / SCG Home XHR APIs** (optional หลังจากมี ScrapingBee แล้ว) — เพื่อลด ScrapingBee credit consumption
3. **Build CSV uploader UI** ใน admin/sources page → ผู้ใช้อัพ CSV ราคา CGD/DIT รายเดือนได้
4. **Trend page real history** — รอให้ cron snapshot สะสมข้อมูลย้อนหลัง 7+ วัน

---

## ScrapingBee integration (พร้อมใช้แล้ว — รอ API key)

**Helper:** `src/lib/scrapers/_scrapingbee.ts`
- `fetchViaScrapingBee({ url, renderJs, countryCode: "th", waitMs })` → returns rendered HTML or null
- `extractPricesFromHtml(html)` → parse JSON-LD / itemprop / data-price / `.price` patterns (no DOM lib needed)
- `isScrapingBeeEnabled()` → reflected in `/api/prices/status` payload (`scrapingBee.enabled`)

**Wired in:** `src/lib/scrapers/_retail.ts` — เปลี่ยน flow เป็น
1. ScrapingBee proxy (ถ้ามี key) → parse HTML
2. fallback Cloudflare Browser Rendering (เดิม)
3. null

ผู้ใช้ไม่ต้องแก้ code อะไร แค่ `wrangler secret put SCRAPINGBEE_API_KEY` แล้ว redeploy.

---

## Phase 5 — Product surface (2026-05-21)

ใหม่ใน session นี้:

### Endpoints
- `GET /api/compare/:material?province=N` — fan-out ทุก 10 sources, คืน
  `{sources:[{source,price,live,available,fetchedAt}], summary:{min,max,avg,median,spreadPct}}`
- `POST /api/admin/upload-prices` (มีแล้ว) — wired เข้า UI
- Sitemap (`/sitemap.xml`) + robots (`/robots.txt`) — disallow `/api/admin/`

### Pages
- `/[locale]/compare-sources` — bar chart + table เทียบราคาวัสดุเดียวกันข้าม
  10 sources พร้อม Spread % และ Export CSV
- `/[locale]/api-docs` — public REST reference, sources/materials enums, curl examples
- `/[locale]/sources` — เพิ่ม **Export CSV** ของตารางราคา + **CsvUploader** (admin bulk ingest)

### Helpers
- `src/lib/csv.ts` — `toCsv()` + `downloadCsv()` (UTF-8 BOM ให้ Excel ภาษาไทยอ่าน)
- Header nav: เพิ่ม `compare_sources` + `api_docs`

### Freshness UX
- `/sources` price table: คอลัมน์ใหม่ **FRESHNESS** ต่อแถว
  - FRESH (อายุ < 50% ttl, สีเขียว)
  - OK (< ttl, สีเหลือง)
  - STALE (≥ ttl, สีแดง)
  - NO DATA (ว่าง)
- คำนวณจาก `fetchedAt` + `ttlSec` ที่ `/api/prices/...` คืนกลับมา
- CSV export ของ /sources จะมีคอลัมน์ `live`, `fetched_at`, `ttl_sec` ติดมาด้วย
