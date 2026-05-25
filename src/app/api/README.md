# src/app/api/

## หน้าที่
REST API endpoints ทั้งหมดของระบบ — รันบน Cloudflare Workers edge runtime

## โครงสร้าง

```
api/
├── prices/
│   ├── [source]/[material]/route.ts   ← ดึงราคาเดี่ยว
│   └── status/route.ts                ← สถานะ providers ทั้งหมด
├── compare/
│   └── [material]/route.ts            ← เปรียบเทียบราคาข้ามแหล่ง
├── history/
│   └── [source]/[material]/route.ts   ← ประวัติราคา (time-series)
├── regional/
│   └── [material]/route.ts            ← ราคาตามภูมิภาค 6 ภาค
├── sources/
│   ├── health/route.ts                ← สถานะ KV coverage
│   ├── freshness/route.ts             ← ความสดของข้อมูลภาครัฐ
│   └── tpso/cmi/route.ts              ← TPSO CMI index ล่าสุด
└── admin/
    ├── ai-agent/route.ts              ← รับราคาจาก AI Agent
    ├── upload-prices/route.ts         ← bulk upload ราคา
    ├── refresh-prices/route.ts        ← trigger scrape ใหม่
    ├── snapshot-history/route.ts      ← บันทึก history snapshot
    ├── scrape-debug/route.ts          ← debug scraper
    └── scrapingbee-debug/route.ts     ← debug ScrapingBee

```

## Public Endpoints

### `GET /api/prices/[source]/[material]?province=10`
ดึงราคาวัสดุจากแหล่งเดียว

**Parameters:**
- `source` — SourceKey เช่น `cgd`, `homepro`, `boonthavorn`
- `material` — Material ID เช่น `CEMENT_001`, `REBAR_DB12`
- `province` — Province ID (default: 10 = กรุงเทพฯ)

**Response:**
```json
{ "price": 175, "live": true, "available": true, "source": "cgd", "fetchedAt": "2026-05-25T...", "ttlSec": 2592000 }
```

**Flow:** KV cache hit → return immediately | cache miss → call provider.fetch() → cache → return

---

### `GET /api/compare/[material]?province=10`
เปรียบเทียบราคาจากทุกแหล่งพร้อมกัน (fan-out 11 sources)

**Response:**
```json
{
  "material": "CEMENT_001",
  "sources": [{ "source": "cgd", "price": 175 }, ...],
  "summary": { "min": 175, "max": 215, "median": 193, "spreadPct": 22.9 }
}
```

---

### `GET /api/history/[source]/[material]?province=10`
ดึง time-series ราคาย้อนหลัง (สำหรับ trend chart)

**Response:**
```json
{ "series": [{ "date": "2025-08-01", "price": 171 }, ...] }
```

---

### `GET /api/regional/[material]?source=cgd`
ราคาตามภูมิภาค 6 ภาค

**Response:**
```json
{ "regions": [{ "region": "ใต้", "mean": 215, "median": 215 }, ...] }
```

---

### `GET /api/sources/health`
สถานะ KV coverage ของทุกแหล่ง

**Response:**
```json
{ "summary": { "fresh": 297, "totalCells": 297, "coverage": 100 }, "sources": [...] }
```

## Admin Endpoints (ต้องใช้ `x-admin-token` header)

### `POST /api/admin/ai-agent`
รับราคาจาก AI Agent และเขียนลงทั้ง live price + history KV

```json
{ "source": "globalhouse", "province": 10, "prices": { "CEMENT_001": 189 } }
```

### `POST /api/admin/upload-prices`
Bulk upload ราคา (เขียนแค่ live price, ไม่เขียน history)

### `POST /api/admin/refresh-prices?source=cgd`
Trigger scrape ใหม่สำหรับแหล่งที่ระบุ (govt sources: tpso, cgd, dit)

### `POST /api/admin/snapshot-history`
บันทึกราคาปัจจุบันทุกแหล่งเข้า history time-series (เรียกโดย cron daily)
