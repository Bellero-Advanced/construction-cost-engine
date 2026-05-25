# src/data/

## หน้าที่
เก็บข้อมูล static ที่ระบบใช้เป็น reference — ไม่ได้ดึงจาก database แต่ compile เข้าไปใน bundle โดยตรง ทำให้ lookup เร็วมาก (0ms)

## ไฟล์

### `materials.ts` — รายการวัสดุก่อสร้าง 27 รายการ

```typescript
export const MATERIALS: Record<string, Material> = {
  CEMENT_001: {
    id: "CEMENT_001",
    name: "ปูนซีเมนต์ปอร์ตแลนด์ Type I",
    unit: "ถุง 50 กก.",
    canonical: { brand: "ตราเสือ", size: "50kg", grade: "Type I" },
    searchTerms: ["ปูนซีเมนต์ปอร์ตแลนด์ ตราเสือ 50 กก", ...],
    sourceOverrides: { megahome: { searchTerm: "cement" } }
  },
  ...
}
```

**ทำไมต้องมี `canonical`?**
เพราะแต่ละแหล่งเรียกวัสดุชนิดเดียวกันต่างกัน เช่น HomePro เรียก "ปูนตราเสือ 50 กก." แต่ CGD เรียก "ปูนซีเมนต์ปอร์ตแลนด์ Type I" — `canonical` ใช้เป็น ground truth สำหรับ 3-tier matching

**ทำไมต้องมี `sourceOverrides`?**
MegaHome ไม่รองรับ Thai URL-encoded query — ต้องใช้ English keyword แทน

### `sources.ts` — ข้อมูล 11 แหล่งข้อมูล

```typescript
export const SOURCES: Record<SourceKey, SourceInfo> = {
  tpso: { key: "tpso", name: "TPSO (สนค.)", type: "Government", url: "..." },
  cgd:  { key: "cgd",  name: "CGD (กรมบัญชีกลาง)", type: "Government", ... },
  ...
}
export const SOURCE_KEYS = Object.keys(SOURCES) as SourceKey[]
```

### `provinces.ts` — 77 จังหวัด พร้อม region mapping

```typescript
export const PROVINCES: Province[] = [
  { id: 10, name: "กรุงเทพมหานคร", region: "กลาง" },
  { id: 50, name: "เชียงใหม่", region: "เหนือ" },
  ...
]
```

ใช้ใน `/api/regional/[material]` เพื่อ aggregate ราคาตามภูมิภาค

### `prices.ts` — Fixture series สำหรับ trend page

เก็บ TPSO history จริง (CEMENT_001 = 11 จุด) และ fixture series สำหรับวัสดุอื่นที่ยังไม่มี KV history — trend page จะแสดง badge "FIXTURE" เมื่อใช้ข้อมูลนี้
