# src/lib/stats/

## หน้าที่
ฟังก์ชันวิเคราะห์เชิงสถิติสำหรับข้อมูลราคาวัสดุก่อสร้าง

## ไฟล์

### `outlier.ts` — Outlier Detection (Z-score)

```typescript
detectOutliers(values: number[], threshold = 2.0): OutlierResult[]
```

**วิธีการ:** Z-score test ตาม Lee & Yun (2024)
- คำนวณ mean และ standard deviation ของชุดราคา
- ราคาที่มี `|z| > threshold` ถือเป็น outlier
- ค่า default threshold = 2.0 (ตาม paper)

**ใช้ที่ไหน:**
- `/api/compare/[material]` — flag ราคาผิดปกติก่อนแสดงผล
- หน้า compare-sources — แสดง badge สีแดงสำหรับ outlier

**ตัวอย่าง:**
```
ราคา: [175, 180, 195, 215, 890]  ← 890 คือ outlier (z > 2.0)
ผล:   [ok,  ok,  ok,  ok,  OUTLIER]
```

### `linearTrend.ts` — Linear Regression (Y = a + bX)

```typescript
linearTrend(values: number[]): { a, b, r2, forecast } | null
```

**วิธีการ:** Least-squares regression
- คำนวณ slope (b) และ intercept (a)
- คำนวณ R² (coefficient of determination)
- ส่งคืน `forecast(x)` function สำหรับพยากรณ์

**ผลลัพธ์จริง (TPSO CEMENT_001):**
- Y = 169.35 + 0.819X
- R² = 0.871
- ราคาเพิ่มขึ้น 0.819 บาท/เดือน

**ใช้ที่ไหน:**
- หน้า `/trend` — แสดงเส้นแนวโน้มบน chart
- `/api/history/[source]/[material]` — คำนวณ trend stats
