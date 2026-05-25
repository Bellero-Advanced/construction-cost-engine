# src/lib/

## หน้าที่
Business logic หลักของระบบ — ทุก API endpoint และ UI component เรียกใช้ฟังก์ชันจากที่นี่

## ไฟล์หลัก

### `livePrice.ts` — ศูนย์กลางการดึงราคา

**ฟังก์ชันหลัก:** `getLivePrice(source, material, province) → PriceResult`

**ลำดับการทำงาน:**
1. ตรวจ KV cache ก่อน — ถ้ายังไม่หมด TTL ส่งคืนทันที
2. ถ้า cache หมด → เรียก `provider.fetch()` ของแหล่งนั้น
3. บันทึกผลลัพธ์ลง KV cache
4. ถ้า provider ไม่มีหรือ fetch ล้มเหลว → ส่งคืน `{ available: false }`

**PROVIDERS map:** ลงทะเบียน scraper ทุกตัว
```typescript
const PROVIDERS = {
  tpso: tpsoProvider,
  cgd: cgdProvider,
  homepro: homeproProvider,
  boonthavorn: boonthavornProvider,  // Magento GraphQL
  megahome: megahomeProvider,         // suggestJsp
  ...
}
```

### `calculators.ts` — BOQ Engine

คำนวณ Bill of Quantities สำหรับ 5 ประเภทงาน:

| ฟังก์ชัน | งาน | สูตรหลัก |
|---------|-----|---------|
| `calcWallTile()` | บุกระเบื้อง | tile × 1.05 + adhesive × 0.25 + grout × 0.30 |
| `calcColumnBeam()` | เสาเอ็น/คาน | concrete + sand × 0.5 + rock × 0.8 |
| `calcRebar()` | เหล็กเสริม | rebar + wire × 0.015 + formwork + nail |
| `calcPaint()` | ทาสี | primer × 0.025 + paint × 0.031 × 2 |
| `calcBrick()` | ก่ออิฐ | brick × 60 + cement × 0.01 + sand × 0.003 |

ทุกฟังก์ชันรับ `(source, province, quantity, ...)` และส่งคืน `BoqResult`

### `rateLimit.ts` — Rate Limiting

ป้องกัน abuse บน `/api/prices/[source]/[material]`:
- 30 requests/minute ต่อ IP
- ใช้ Cloudflare KV เก็บ counter
- ส่งคืน 429 เมื่อเกิน limit

### `pageMeta.ts` — SEO Metadata

สร้าง `<title>` และ `<meta>` สำหรับแต่ละหน้า

### `export.ts` — Export BOQ

แปลง `BoqResult` เป็น CSV หรือ JSON สำหรับ download

### `csv.ts` — CSV Parser

Parse CSV ที่ upload ผ่าน admin panel สำหรับ bulk price upload

### `utils.ts` — Utility Functions

- `fmt(n)` — format ตัวเลขเป็น Thai locale (1,234.56)
- `fmtInt(n)` — format integer (1,234)
- `median(arr)` — คำนวณค่ามัธยฐาน
