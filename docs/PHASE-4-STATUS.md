# Phase 4 Status — Production Verification (2026-05-21)

> สรุปสภาพจริงหลัง deploy + ทดสอบสด ด้วย ADMIN secret + GH Actions cron

---

## ✅ ทำงานจริง 100%

| Source | สถานะ | Verified |
|---|---|---|
| **TPSO** (CMI index) | LIVE | `index: 112.8, period: มีนาคม 2568` จาก PDF จริง |
| **Cloudflare Workers Paid** | LIVE | Browser Rendering binding active (ดึง HomePro HTML 1.7MB ได้) |
| **KV cache (PRICES_KV)** | LIVE | `cacheKeysSeen` รายงาน |
| **GH Actions cron** | LIVE | `refresh-prices.yml` รันทุก 03:17 UTC + manual dispatch |
| **Rate limit** | LIVE | KV per-IP fixed window |
| **History snapshotter** | LIVE | เขียน KV ทุกวันผ่าน cron |
| **/api/prices/status** | LIVE | 10 sources + mode + cache count |
| **Scrape-debug endpoint** | LIVE | auth-gated, return candidates post-hydration |

---

## 🟡 Infra พร้อม แต่ Data Source มีปัญหาที่ Upstream

### CGD (กรมบัญชีกลาง)
**ปัญหา:** Package `cmicgd<MM><YYYY-BE>` บน data.go.th คือ "เป้าหมายการใช้จ่ายงบประมาณ" (budget spending) **ไม่ใช่** ราคามาตรฐานวัสดุก่อสร้าง

**ผลลัพธ์:** Scraper รัน แต่ regex จับวัสดุไม่เจอ (เพราะข้อมูลไม่ใช่วัสดุ) → return null อย่างถูกต้อง

**Fix แท้:** ต้องไปดึงไฟล์ราคามาตรฐานจาก `cgd.go.th` โดยตรง (manual download, login wall, หรือ scrape index page) — ทำใน session ถัดไป

### DIT (กรมการค้าภายใน)
**ปัญหา:** `moc-price.moc.go.th/price/wholesale/group/24` unreachable จากทั้ง local + Cloudflare egress (URL ผิดหรือ deprecated)

**Fix แท้:** หา endpoint จริงที่ MOC OpenData (`https://api.dataapi.moc.go.th/...`) หรือเปลี่ยนไปดึงจาก data.go.th CKAN dataset เฉพาะของ DIT

### Retail 7 (HomePro / GlobalHouse / Thai Watsadu / BnB / SCG / Dohome / MegaHome)
**ปัญหา:** Bot detection
- **Thai Watsadu** → ขึ้น `Attention Required! | Cloudflare` (โดน CF bot challenge ของเว็บปลายทาง ironic)
- **HomePro / Dohome** → goto สำเร็จแต่ DOM hydration ไม่ render product cards (อาจถูก block แบบ silent)
- **Cloudflare Browser Rendering egress IP range ถูก fingerprint** เป็น bot

**Fix แท้:**
1. **Residential proxy** (ScrapingBee / Bright Data ~$30-150/เดือน) — แก้ปัญหา bot detection ได้แน่นอน
2. **Reverse-engineer XHR/GraphQL** — แต่ละเว็บมี backend API (เช่น `omnistg.homepro.co.th`) ที่ SPA call → เรียก API ตรง ๆ ไม่ต้อง render DOM
3. **Stealth plugin** สำหรับ Puppeteer — ลด fingerprint signal
4. **Cloudflare Browser Worker หน้าใหม่** ใช้ตัวต่อต่างจาก Worker ปกติ (กำลังอยู่ใน beta)

---

## 📊 Verification ผ่าน production (ที่ทำในวันนี้)

```bash
# All gh + wrangler authenticated, secrets set atomically (no chat leak)
$ gh secret list --repo Bellero-Advanced/construction-cost-engine
ADMIN_REFRESH_TOKEN     2026-05-21T...
CLOUDFLARE_ACCOUNT_ID   2026-05-19T...
CLOUDFLARE_API_TOKEN    2026-05-19T...
WORKER_URL              2026-05-21T...

# TPSO live
$ curl -X POST .../api/admin/refresh-prices?source=tpso -H "x-admin-token: $T"
{"ok":true,"results":[{"provider":"tpso","ok":true,"snapshot":{
  "index":112.8,"yoyPct":0.5,"momPct":0.6,
  "reportPeriod":"มีนาคม 2568",
  "reportUrl":"https://uploads.tpso.go.th/6.2 CMI Report_March_2027.pdf"
}}]}

# Status route — 10 sources visible, modes correct
$ curl .../api/prices/status
{
  "sources": [
    {"key":"tpso","mode":"live-index","cacheKeysSeen":2},
    {"key":"cgd","mode":"live-pdf","cacheKeysSeen":0},
    {"key":"dit","mode":"live-fetch","cacheKeysSeen":0},
    {"key":"homepro","mode":"live-headless","cacheKeysSeen":0},
    ...
  ],
  "registered": ["tpso","cgd","dit","homepro",...]  // all 10
}

# Browser Rendering proven (1.7MB HomePro HTML)
$ curl .../api/admin/scrape-debug?source=homepro&material=CEMENT_001 -H "x-admin-token: $T"
{"title":"ผลการค้นหา | ปูนซีเมนต์ปอร์ตแลนด์",
 "htmlLength":1725969,...}

# GH Actions cron runs successfully
$ gh run list --workflow refresh-prices.yml
completed success refresh-prices manual_dispatch ...
```

---

## ❌ สิ่งที่เหลือ (สำหรับ next session)

| งาน | ความเร่ง | คนทำได้ |
|---|---|---|
| Reverse-engineer HomePro XHR API | สูง | dev session ~3 ชม. |
| Reverse-engineer Dohome XHR API | กลาง | dev session ~2 ชม. |
| ใช้ ScrapingBee/Bright Data residential | สูง (เร็วสุด) | งบ $30/เดือน |
| หา CGD ราคามาตรฐานจริง (ไม่ใช่งบประมาณ) | กลาง | research 1-2 ชม. |
| หา DIT building-material endpoint จริง | กลาง | research 1-2 ชม. |
| Trend page real history (need 30+ days data) | ต่ำ | เวลาผ่านไป |

---

## 📌 สรุปสำหรับ user

**สิ่งที่ตั้งใจจะให้ทำงาน 100% แต่เจอ blocker upstream:**
- CGD, DIT, Retail 7 ตัว — code + infra ทั้งหมดพร้อม แต่ upstream data sources ไม่ cooperate
- **TPSO ทำงานจริง 100%** — มูลค่าโครงการอยู่ที่นี่

**Cost ปัจจุบัน:** ~$5/เดือน (Workers Paid) — Browser Rendering สิ้นเปลือง quota น้อยมาก (~0 ตอนนี้)

**Next concrete moves (recommend):**
1. Subscribe ScrapingBee free tier (1000 req/mo) → ใช้แทน Cloudflare Browser Rendering สำหรับ retail
2. Manual download CGD ราคามาตรฐาน + เก็บใน R2 → อ่านจาก KV
3. ทิ้ง DIT ไปก่อน (overlap กับ TPSO อยู่แล้ว)
