# src/app/api/admin/

## หน้าที่
Admin-only API endpoints — ทุก endpoint ต้องใช้ `x-admin-token` header สำหรับ authentication

## Security
```
x-admin-token: <ADMIN_REFRESH_TOKEN>  ← Cloudflare Worker secret
```
ถ้า token ไม่ตรง → 401 Unauthorized

## ไฟล์

### `ai-agent/route.ts` — AI Agent Price Submission
รับราคาจาก AI Agent (LLM-based) และเขียนลง KV ทั้ง 2 ที่พร้อมกัน:
1. **Live price key:** `{source}:{material}:{province}` — ใช้สำหรับ compare/BOQ
2. **History key:** `history:{source}:{material}:{province}` — ใช้สำหรับ trend chart

**ทำไมต้องแยกจาก `upload-prices`?**
`upload-prices` เขียนแค่ live price — `ai-agent` เขียนทั้ง live + history เพื่อให้ข้อมูลที่ AI research ปรากฏในทุกหน้าทันที

**Request body:**
```json
{ "source": "globalhouse", "province": 10, "prices": { "CEMENT_001": 189, "TILE_001": 238 }, "date": "2026-05-25" }
```

### `upload-prices/route.ts` — Bulk Price Upload
Upload ราคาหลายรายการพร้อมกัน (เขียนแค่ live price)
ใช้สำหรับ: CGD/DIT ที่ดึงจาก published catalog, spot fixes

### `refresh-prices/route.ts` — Trigger Scrape
เรียก scraper ใหม่สำหรับ govt sources (tpso, cgd, dit)
เรียกโดย GitHub Actions cron ทุกวัน 02:23 UTC

### `snapshot-history/route.ts` — Daily History Snapshot
บันทึกราคาปัจจุบันทุกแหล่งเข้า history time-series
เรียกโดย GitHub Actions cron หลัง refresh-prices

**Backfill mode:** รับ `{ date, source, prices }` ใน body เพื่อ backfill ข้อมูลย้อนหลัง

### `scrapingbee-debug/route.ts` — ScrapingBee Debugger
ทดสอบว่า ScrapingBee ดึงข้อมูลจากแหล่งที่ระบุได้ไหม
แสดง: HTML length, price signals, extracted prices, probes

### `scrape-debug/route.ts` — General Scraper Debugger
ทดสอบ scraper ทั่วไป

### `log-calculation/route.ts` — BOQ Log
บันทึก fact_calculations เมื่อผู้ใช้คำนวณ BOQ สำเร็จ
เก็บใน KV key `calc:{uuid}` สำหรับ analytics ในอนาคต
