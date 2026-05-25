# src/components/

## หน้าที่
React components ที่ใช้ซ้ำทั่วทั้งแอป — แบ่งเป็น 3 กลุ่ม

## โครงสร้าง

```
components/
├── ui/           ← Primitive UI components (ไม่มี business logic)
├── calculator/   ← Components เฉพาะหน้า BOQ calculator
├── layout/       ← Header, Footer
└── admin/        ← Admin-only components
```

## `ui/` — Primitive Components

### `Badge.tsx`
แสดง label สั้น ๆ พร้อม color variant:
- `variant="green"` — LIVE data
- `variant="amber"` — FIXTURE/warning
- `variant="red"` — OUTLIER/error
- `variant="blue"` — info

### `Button.tsx`
ปุ่มมาตรฐาน รองรับ loading state และ disabled state

### `Stat.tsx`
แสดงตัวเลขสถิติ: label + value + optional unit
ใช้ใน health page และ compare page

### `Field.tsx`
Form field wrapper: label + input/select + error message

### `Doc.tsx`
Container สำหรับ documentation sections — ใช้ใน api-docs page

## `calculator/` — BOQ Calculator Components

### `Selectors.tsx`
Dropdown selectors สำหรับ BOQ pages:
- เลือกแหล่งราคา (11 แหล่ง)
- เลือกจังหวัด (77 จังหวัด)
- เลือกวัสดุ (ถ้ามีหลายตัวเลือก)

### `CalculatorResult.tsx`
แสดงผลการคำนวณ BOQ:
- ตาราง Bill of Materials (วัสดุ, ปริมาณ, ราคา/หน่วย, รวม)
- สรุปต้นทุนรวม + ต้นทุน/หน่วยงาน
- ปุ่ม Export CSV

### `DataModeBadge.tsx`
Badge แสดงว่าราคาที่ใช้มาจากไหน:
- "LIVE" (สีเขียว) — ดึงจาก KV cache จริง
- "FIXTURE" (สีเหลือง) — ใช้ข้อมูล static fallback

## `layout/` — Layout Components

### `Header.tsx`
Navigation bar: logo + links ไปทุกหน้า + locale switcher (TH/EN)

### `Footer.tsx`
Footer: ลิงก์ + เครดิต + live URL

## `admin/` — Admin Components

### `CsvUploader.tsx`
Upload CSV file สำหรับ bulk price upload ผ่าน admin panel
- Parse CSV ด้วย `src/lib/csv.ts`
- ส่งไปยัง `/api/admin/upload-prices`
- แสดง progress + error summary
