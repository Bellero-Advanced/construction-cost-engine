# src/types/

## หน้าที่
กำหนด TypeScript types ที่ใช้ร่วมกันทั่วทั้งโปรเจกต์

## ไฟล์

### `index.ts`
Type definitions หลักทั้งหมด:

| Type | ใช้ทำอะไร |
|------|-----------|
| `SourceKey` | Union type ของ 11 แหล่งข้อมูล: `"tpso" \| "cgd" \| "dit" \| "homepro" \| ...` |
| `WorkType` | ประเภทงาน BOQ: `"wall_tile" \| "column_beam" \| "rebar" \| "paint" \| "brick"` |
| `Material` | ข้อมูลวัสดุ: id, name, unit, canonical spec, searchTerms, sourceOverrides |
| `SourceOverride` | Override คำค้นหาสำหรับแหล่งเฉพาะ: `{ searchTerm?: string }` |
| `BomItem` | รายการใน Bill of Materials: materialId, qty, unit, unitPrice, total |
| `BoqResult` | ผลการคำนวณ BOQ: workName, source, province, items[], total, unitCost |
| `Province` | จังหวัด: id (1-77), name, region |
| `Region` | ภูมิภาค 6 ภาค: เหนือ/อีสาน/กลาง/ตะวันออก/ใต้/ตะวันตก |

## ความสัมพันธ์
- `Material` ใช้ใน `src/data/materials.ts` และ `src/lib/calculators.ts`
- `SourceKey` ใช้ใน `src/lib/livePrice.ts` และ scrapers ทุกตัว
- `BoqResult` ส่งกลับจาก calculator functions ไปแสดงใน UI
