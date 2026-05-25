# src/app/[locale]/

## หน้าที่
หน้าเว็บสาธารณะทั้งหมด — รองรับ locale `th` และ `en` ผ่าน next-intl

## โครงสร้างหน้า

| โฟลเดอร์ | URL | หน้าที่ |
|---------|-----|--------|
| `page.tsx` | `/` | หน้าหลัก — สรุปสถิติ, ลิงก์ไปทุกฟีเจอร์ |
| `compare-sources/` | `/compare-sources` | เปรียบเทียบราคาวัสดุจาก 11 แหล่ง |
| `trend/` | `/trend` | กราฟแนวโน้มราคาย้อนหลัง + linear regression |
| `wall-tile/` | `/wall-tile` | คำนวณ BOQ งานบุกระเบื้อง |
| `column-beam/` | `/column-beam` | คำนวณ BOQ งานเสาเอ็น/คาน |
| `rebar/` | `/rebar` | คำนวณ BOQ งานเหล็กเสริม |
| `paint/` | `/paint` | คำนวณ BOQ งานทาสี |
| `brick/` | `/brick` | คำนวณ BOQ งานก่ออิฐ |
| `health/` | `/health` | สถานะระบบ — KV coverage, freshness |
| `sources/` | `/sources` | รายละเอียด 11 แหล่งข้อมูล |
| `stores/` | `/stores` | แผนที่ร้านค้า (placeholder) |
| `compare/` | `/compare` | เปรียบเทียบแบบ side-by-side |
| `api-docs/` | `/api-docs` | เอกสาร REST API |

## Pattern ของแต่ละหน้า

```
[page]/
├── layout.tsx   ← SEO metadata (title, description, OG)
└── page.tsx     ← UI component (ส่วนใหญ่เป็น "use client")
```

**ทำไม layout.tsx แยกจาก page.tsx?**
Next.js App Router ต้องการ `generateMetadata()` ใน Server Component แต่ UI ต้องการ `useState`/`useEffect` — แยกไฟล์แก้ปัญหานี้

## หน้าสำคัญ

### `compare-sources/page.tsx`
- รับ `material` และ `province` จาก URL params
- เรียก `/api/compare/[material]` เพื่อดึงราคาจากทุกแหล่ง
- แสดงตารางเปรียบเทียบ + outlier badge (สีแดง)
- มี filter: เลือกแหล่ง, เลือกจังหวัด

### `trend/page.tsx`
- เรียก `/api/history/[source]/[material]` สำหรับ time-series
- ถ้า KV ไม่มีข้อมูล → fallback เป็น fixture data (แสดง badge "FIXTURE")
- ใช้ Recharts สำหรับ line chart
- คำนวณ linear regression แบบ real-time ใน browser

### `wall-tile/page.tsx` (และ BOQ pages อื่น ๆ)
- ผู้ใช้กรอก: พื้นที่งาน, เลือกแหล่งราคา, เลือกจังหวัด
- เรียก `/api/prices/[source]/[material]` สำหรับแต่ละวัสดุ
- คำนวณ BOQ ด้วย `calcWallTile()` จาก `src/lib/calculators.ts`
- แสดง Bill of Materials + ต้นทุนรวม + ต้นทุน/หน่วย
- รองรับ export เป็น CSV

### `health/page.tsx`
- เรียก `/api/sources/health` เพื่อดู KV coverage
- แสดง: fresh/missing/stale ต่อแหล่ง, เวลา last update
- ใช้สำหรับ monitoring ว่าข้อมูลสดหรือไม่
