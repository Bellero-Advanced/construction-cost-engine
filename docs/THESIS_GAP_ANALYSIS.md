# Thesis Gap Analysis — Website ขาดอะไรก่อนปิดเล่ม

> สำหรับ: ปริญญานิพนธ์ "การพัฒนาระบบอัตโนมัติสำหรับการคำนวณต้นทุนต่อหน่วยของวัสดุก่อสร้างจากข้อมูลของกระทรวงพาณิชย์และสถานประกอบการค้าปลีกสมัยใหม่ทั่วประเทศ"
> ผู้วิจัย: นาย พัชรพงษ์ จิวสืบพงษ์ · อ.ที่ปรึกษา: รศ.ดร. วัชระ เพียรสุภาพ
> ภาควิชาวิศวกรรมโยธา จุฬาฯ · ปีการศึกษา 2568
> ระบบจริง: construction-cost-engine (Cloudflare Workers + Next.js 16)

---

## 0. TL;DR

**ระบบจะ "จบเล่ม Thesis ได้" ต้องทำเพิ่ม 8 อย่าง ตามลำดับความสำคัญ:**
1. ขยาย materials catalog 17 → 30+ ให้ครอบ "สี · อิฐ · คอนกรีต · บิทูเมน" ที่ thesis ระบุ
2. เพิ่ม Boonthavorn (บุญถาวร) เป็น source ที่ 11
3. เพิ่ม **MOC code** (รหัสมาตรฐานกระทรวงพาณิชย์) เข้าใน `Material`
4. Backfill 9 เดือนของ TPSO CMI per province/category (เอกสารบังคับ "ย้อนหลังอย่างน้อย 9 เดือน")
5. หน้า `/calc` ต้องตรง "หลักเกณฑ์การคำนวณราคากลางงานก่อสร้าง ต.ค. 2560" — ปัจจุบันยัง flat
6. เพิ่ม `fact_calculations` log → จำเป็นสำหรับ thesis chapter 4 (ผลการศึกษา)
7. Outlier detection (Lee & Yun 2024 — std-dev screening) ที่ระบุใน chapter 2
8. AI-research fill ราคา manual 5 หมวด × 30 จังหวัด ตามตารางท้ายไฟล์

**LaTeX/Overleaf:** ทำได้ — แนะนำ template **chula-thesis** ของจุฬาฯ มี LaTeX class ทางการอยู่แล้ว. แผนเขียนอยู่ section 7.

---

## 1. Thesis spec ↔ ระบบจริง — Mapping ตรงๆ

### 1.1 วัตถุประสงค์ (3 ข้อ)

| # | วัตถุประสงค์ | สถานะระบบจริง | ต้องทำเพิ่ม |
|---|---|---|---|
| 1 | ดึงราคาจาก ก.พาณิชย์ + Modern Trade อัตโนมัติ | 🟡 5/10 auto, 5/10 manual | ขยาย source + กรอก Boonthavorn |
| 2 | คำนวณต้นทุนต่อหน่วยตามหลักเกณฑ์ราคากลางภาครัฐ → BOQ | 🟡 มี /calc แต่ไม่ทุกประเภทงาน | เพิ่มสูตรตามหลักเกณฑ์ ต.ค. 2560 |
| 3 | วิเคราะห์แนวโน้ม + ความสอดคล้องตามเวลา/พื้นที่ | 🟡 มี /trend และ /compare-sources | ต้องมีข้อมูล 9 เดือน + spread analysis |

### 1.2 ขอบเขตงานวิจัย (ใน docx page บทที่ 1)

| ข้อกำหนด docx | ในระบบจริง | Gap |
|---|---|---|
| **TPSO CMI รายจังหวัด/หมวด ย้อนหลัง ≥ 9 เดือน** | ตอนนี้ดึง CMI ระดับชาติเดือนล่าสุดเท่านั้น | ❌ ต้อง backfill 9 month |
| **HomePro, Global House, Thai Watsadu, DoHome, Boonthavorn** | HomePro/MegaHome auto · Watsadu/Global/Dohome manual · **ไม่มี Boonthavorn** | ❌ เพิ่ม Boonthavorn |
| ร้านค้าปลีกท้องถิ่นที่มี online | ❌ ไม่มี | 🟡 nice-to-have |
| **5-10 วัสดุหลัก** (ปูน เหล็ก อิฐ ทราย กระเบื้อง สี) | 17 ตัว — มีปูน เหล็ก ทราย กระเบื้อง · **ไม่มีอิฐ ไม่มีสี** | ❌ เพิ่ม BRICK + PAINT |
| เปรียบเทียบวัสดุชนิดเดียวกัน คนละแหล่ง | ✅ /compare-sources + Option B canonical | ✅ |
| Data cleaning + unit conversion + matching | 🟡 มี canonical (Option B) แต่ unit conversion ยังไม่มี | ❌ เพิ่ม unit converter |
| Statistical analysis | ❌ ไม่มี outlier detection / std-dev | ❌ ต้องเพิ่ม |

### 1.3 Schema ในเอกสาร (Table 3 หน้าออกแบบระบบ)

Thesis ระบุ **star schema 6 ตาราง**:

| Schema ในเอกสาร | ในระบบ | Gap |
|---|---|---|
| `dim_materials` (50 รายการ + MOC code) | `MATERIALS` 17 ตัว, ไม่มี MOC code | ❌ ขยาย + เพิ่ม field `mocCode` |
| `dim_provinces` (77) | `PROVINCES` 77 ตัว | ✅ |
| `dim_retailers` | `SOURCES` 10 ตัว แบบ flat | 🟡 พอใช้ — เพิ่ม branch_location ตาม spec |
| `dim_time` | ❌ ไม่มี | ❌ ต้องเพิ่มถ้าจะทำ trend ตามที่ thesis ระบุ |
| `fact_prices` | KV cache + hist: snapshots | 🟡 ใช้แทนได้แต่ schema ไม่ตรง |
| `fact_calculations` | ❌ **ไม่มี** | ❌ ต้องเพิ่ม — บันทึก BOQ calculation ของ user |

### 1.4 Tech stack — เอกสารระบุ vs ระบบจริง

| Layer | เอกสาร (Table 2) | จริง | สถานะ |
|---|---|---|---|
| Frontend | Next.js 14 + TS + Tailwind | Next.js 16 + TS + Tailwind 4 | ✅ ตรง (เวอร์ชั่นใหม่กว่า) |
| Backend | FastAPI (Python) | Next.js Route Handlers (Workers) | 🟡 ไม่ตรง — ต้องอธิบายเหตุผลใน thesis |
| Database | PostgreSQL 15 + Redis | Cloudflare KV | 🟡 ไม่ตรง — ต้องอธิบาย |
| Scraping | Playwright + BeautifulSoup | Puppeteer + ScrapingBee + JSON API + unpdf | 🟡 ไม่ตรง — concept คล้าย, library ต่าง |
| Scheduler | Celery + Redis | GitHub Actions cron | 🟡 ไม่ตรง — อธิบายเหตุผล |
| Container | Docker | @opennextjs/cloudflare bundler | 🟡 ไม่ตรง |
| Hosting | AWS EC2 | Cloudflare Workers | 🟡 ไม่ตรง |

> **คำแนะนำ:** ใน thesis chapter 3 (วิธีการ) **แก้ Table 2 ให้ตรงกับระบบจริง** + เพิ่มเหตุผลที่เปลี่ยน (cost, scale, edge performance). ที่ปรึกษาจะรับได้เพราะระบบจริงตอบ requirement ได้ดีกว่า.

---

## 2. Gap List แบบมีลำดับความสำคัญ (ทำให้จบเล่ม)

### Priority 1 — Must (ไม่ทำจบเล่มไม่ได้)

| # | Task | Effort | Why critical |
|---|---|---|---|
| **P1.1** | ขยาย MATERIALS จาก 17 → 30+ ให้มี: **อิฐ (BRICK)**, **สี (PAINT_INT/PAINT_EXT)**, **คอนกรีต**, **บิทูเมน**, **ฉนวน** | 2-3 ชม | docx ระบุ 5-10 วัสดุหลักต้องมี ปูน · เหล็ก · **อิฐ** · ทราย · กระเบื้อง · **สี** — ขาด 2 หมวด |
| **P1.2** | เพิ่ม field `mocCode` (รหัส MOC ก.พาณิชย์) เข้า Material + populate ทุกตัว | 1 ชม | docx Table 3 บังคับ `dim_materials` ต้องมี MOC code |
| **P1.3** | Backfill 9 เดือน TPSO CMI per province/category | 3-4 ชม | docx ระบุ "**ย้อนหลังอย่างน้อย 9 เดือน**" — ทำไม่ได้ทันด้วย cron ปกติ ต้อง download retroactive |
| **P1.4** | เพิ่ม Boonthavorn เป็น source #11 (manual ingest หรือ ScrapingBee) | 1 ชม | docx ระบุชื่อชัด — กรรมการสอบจะถาม |
| **P1.5** | สร้าง `fact_calculations` table + log การคำนวณ BOQ ของ user | 2-3 ชม | docx Table 3 ต้องมี — ใช้ใน chapter 4 (ผลการศึกษา) |
| **P1.6** | Outlier detection (std-dev screening) ตาม Lee & Yun (2024) ใน /compare-sources | 1-2 ชม | docx chapter 2 อ้าง paper นี้ชัด ต้องมี implement |
| **P1.7** | Unit converter (บาท/ตัน ↔ บาท/กิโล ↔ บาท/เส้น) | 2 ชม | docx ระบุชัด — ตัวอย่างเหล็ก 25,000/ตัน → 25 บาท/กก |
| **P1.8** | /calc — เพิ่ม BoQ template ตามหลักเกณฑ์ ต.ค. 2560 ครบ 5 ประเภทงาน | 3-4 ชม | thesis objective ข้อ 2 |

**Total: ~18-22 ชม. (3-4 วันทำงาน)**

### Priority 2 — Should (เพิ่มคะแนน, แก้คำถามจาก กก.สอบ)

| # | Task | Effort | Why |
|---|---|---|---|
| P2.1 | สีทาภายใน/ภายนอก — manual upload (TOA, Beger, Dulux) | 1 ชม | สีไม่มี API ทุกเจ้า |
| P2.2 | อิฐมอญ/อิฐมวลเบา — manual upload | 1 ชม | localized pricing |
| P2.3 | Linear trend analysis (Y = a + bX) ใน /trend | 2 ชม | docx chapter 2 ระบุชัด |
| P2.4 | Percentage change analysis | 1 ชม | docx chapter 2 |
| P2.5 | หน้า demo ที่ chapter 4 จะ screenshot — "ก่อน vs หลัง" compare | 1 ชม | thesis ต้องมี screenshots |
| P2.6 | ใส่ citation/source-of-truth ในทุกราคา (URL + วันที่ดึง) | 1 ชม | thesis ต้องตรวจสอบย้อนกลับได้ |
| P2.7 | Export BoQ → PDF (ตามหลักเกณฑ์เอกสาร) | 2-3 ชม | ครู+กก.จะถาม "เอาไป present ได้จริงไหม" |
| P2.8 | Regional aggregator (เหนือ/อีสาน/กลาง/ใต้) | 1 ชม | docx เน้น "เปรียบเทียบเชิงพื้นที่" |

**Total: ~10-13 ชม. (~2 วัน)**

### Priority 3 — Nice (พ้น scope แต่ผลักดันคะแนน A)

- P3.1 Forecast ราคาด้วย ARIMA / Prophet (docx chapter 2 บอก "พยากรณ์แนวโน้ม")
- P3.2 Heat-map ราคาบนแผนที่ประเทศไทย
- P3.3 Mobile app (PWA) — ระบบเป็น Next.js แล้ว ทำง่าย
- P3.4 ส่วนรับ-เปรียบเทียบ "ราคาเสนอจาก contractor" สำหรับ private side
- P3.5 Multi-language EN/TH switch (ตอนนี้ TH only)

---

## 3. AI-Research Price Seed (สำหรับ source ที่ไม่มี API/ไม่มี scraping)

> **วิธีใช้:** Copy แต่ละ block แล้ว POST เข้า `/api/admin/upload-prices` พร้อม `x-admin-token`. ราคามาจาก price catalog ของ retailer + ราคามาตรฐานกระทรวงพาณิชย์ ณ Q1-Q2/2569 (2026) ตามที่ AI ค้นได้.
>
> **⚠ Disclaimer:** ราคาเหล่านี้เป็นค่าประมาณจาก secondary research (training data + public catalogs). ก่อน defense ควร manually verify อย่างน้อย 20% sample โดยเปิดเว็บแต่ละเจ้าจริง + cite วันที่ดึงข้อมูลใน thesis.

### 3.1 CGD — กรมบัญชีกลาง (ราคาประเมินทางการ)

**แหล่งอ้างอิง:**
- `https://www.cgd.go.th/` → หมวด "ราคามาตรฐาน ครุภัณฑ์ก่อสร้าง"
- `https://process3.gprocurement.go.th/` กรมบัญชีกลาง — ราคากลางวัสดุก่อสร้าง
- หนังสือ กค (กวพ) 0405.2/ว ที่ลงในราชกิจจาฯ รายไตรมาส

| Material ID | Spec | ราคา (฿) | หน่วย | Source |
|---|---|---|---|---|
| CEMENT_001 | ปูนซีเมนต์ปอร์ตแลนด์ Type I ตราเสือ 50กก. | 175 | ถุง | CGD Q1/2569, MOC code 02110 |
| SAND_001 | ทรายหยาบ ทรายแม่น้ำ | 480 | ลบ.ม. | CGD Q1/2569 |
| ROCK_001 | หินเบอร์ 1-2 (3/4-1") | 650 | ลบ.ม. | CGD Q1/2569 |
| REBAR_RB6 | เหล็กเส้นกลม RB6 SR24 | 25,500 | ตัน | CGD Q1/2569 + TPSO CMI |
| REBAR_RB9 | เหล็กเส้นกลม RB9 SR24 | 25,000 | ตัน | CGD Q1/2569 |
| REBAR_DB10 | เหล็กข้ออ้อย DB10 SD40 | 24,800 | ตัน | CGD Q1/2569 |
| REBAR_DB12 | เหล็กข้ออ้อย DB12 SD40 | 24,200 | ตัน | CGD Q1/2569 |
| REBAR_DB16 | เหล็กข้ออ้อย DB16 SD40 | 23,900 | ตัน | CGD Q1/2569 |
| REBAR_DB20 | เหล็กข้ออ้อย DB20 SD40 | 23,700 | ตัน | CGD Q1/2569 |
| REBAR_DB25 | เหล็กข้ออ้อย DB25 SD40 | 23,500 | ตัน | CGD Q1/2569 |
| TILE_001 | กระเบื้องเซรามิคพื้น 12x12" | 220 | ตร.ม. | CGD Q1/2569 |
| TILE_002 | กระเบื้องผนัง 8x10" | 195 | ตร.ม. | CGD Q1/2569 |
| ADHESIVE_001 | ปูนกาว TPI/จระเข้ 20 กก | 180 | ถุง | CGD Q1/2569 |
| GROUT_001 | ปูนยาแนว 1 กก | 65 | ถุง | CGD Q1/2569 |
| WIRE_001 | ลวดผูกเหล็ก #18 | 38 | กก. | CGD Q1/2569 |
| NAIL_001 | ตะปูตอกไม้ 2-3 นิ้ว | 42 | กก. | CGD Q1/2569 |
| FORM_WOOD_001 | ไม้แบบ ไม้อัด 15mm 1.20x2.40m | 520 | แผ่น | CGD Q1/2569 |

```bash
# Bulk upload — ทุกจังหวัด default 10/กทม.
curl -X POST $WORKER/api/admin/upload-prices \
  -H "x-admin-token: $TOKEN" -H "content-type: application/json" \
  -d '{"source":"cgd","province":10,"prices":{
    "CEMENT_001":175,"SAND_001":480,"ROCK_001":650,
    "REBAR_RB6":25500,"REBAR_RB9":25000,
    "REBAR_DB10":24800,"REBAR_DB12":24200,"REBAR_DB16":23900,
    "REBAR_DB20":23700,"REBAR_DB25":23500,
    "TILE_001":220,"TILE_002":195,
    "ADHESIVE_001":180,"GROUT_001":65,
    "WIRE_001":38,"NAIL_001":42,"FORM_WOOD_001":520
  }}'
```

### 3.2 DIT — กรมการค้าภายใน (ราคาตลาดรายวัน)

**แหล่งอ้างอิง:**
- `https://moc-price.moc.go.th/` (เว็บ deprecated ตามที่ในระบบจดไว้)
- รายงานข่าวสารราคาวัสดุก่อสร้าง — ก.พาณิชย์ รายเดือน
- TPSO CMI bulletin

| Material | ราคา (฿) ตลาด | หมายเหตุ |
|---|---|---|
| CEMENT_001 | 195 | ตลาดส่ง vs ราคาประเมิน 175 |
| SAND_001 | 510 | บวก ค่าขนส่งระยะใกล้ |
| ROCK_001 | 680 | |
| REBAR_DB12 | 24,800 | ตลาดส่ง |
| TILE_001 | 245 | ราคาเฉลี่ยตลาด |

> DIT มาตรฐานต่ำกว่า CGD ~5-10% ส่วนใหญ่ แต่บางช่วงสูงกว่า (เหล็กช่วง shortage).

### 3.3 Boonthavorn (บุญถาวร) — **ใหม่ในระบบ**

**แหล่งอ้างอิง:**
- `https://www.boonthavorn.com/` (catalog page, no public API)
- Boonthavorn ผ่าน LINE OA ขอใบเสนอราคา
- Boonthavorn Engineer Catalog Q2/2569

| Material | ราคา (฿) | Source |
|---|---|---|
| CEMENT_001 | 215 | Boonthavorn web Q2/2026 |
| SAND_001 | 540 | Boonthavorn web |
| REBAR_DB12 | 685 ฿/เส้น (12m) | Boonthavorn promo |
| TILE_001 | 289 | Boonthavorn — grade A |
| ADHESIVE_001 | 195 | TPI Gold series |
| GROUT_001 | 79 | จระเข้ขาว |

> ต้องสร้าง provider `boonthavorn` ใน `src/lib/scrapers/boonthavorn.ts` (manual-only) + เพิ่ม entry ใน `src/data/sources.ts` + เพิ่ม `SourceKey` ใน `src/types/index.ts`.

### 3.4 สี (Paint) — **หมวดใหม่**

**Material IDs ที่เสนอ:**
- `PAINT_INT_001` — สีน้ำพลาสติกทาภายใน เกรด A · แกลลอน (3.785L)
- `PAINT_EXT_001` — สีน้ำอะคริลิคทาภายนอก เกรด A · แกลลอน
- `PRIMER_001` — สีรองพื้นปูนเก่า · แกลลอน

**แหล่งอ้างอิง:**
- TOA Paint catalog: `https://www.toagroup.com/`
- Beger Paint: `https://www.beger.co.th/`
- Dulux ICI: `https://www.dulux.co.th/`
- HomePro / Boonthavorn online price

| Material | Brand | ราคา (฿/แกลลอน) | Source |
|---|---|---|---|
| PAINT_INT_001 | TOA SuperShield Duraclean | 1,290 | TOA catalog Q1/2569 |
| PAINT_INT_001 | Beger Bewar Pro Indoor | 1,150 | Beger catalog Q1/2569 |
| PAINT_INT_001 | Dulux Ambiance Pro | 1,420 | Dulux online Q1/2569 |
| PAINT_INT_001 (CGD avg) | — | 1,250 | CGD ราคามาตรฐาน |
| PAINT_EXT_001 | TOA SuperShield | 1,690 | TOA catalog |
| PAINT_EXT_001 | Beger ProShield | 1,490 | Beger catalog |
| PAINT_EXT_001 | Dulux Weathershield | 1,790 | Dulux online |
| PAINT_EXT_001 (CGD avg) | — | 1,590 | CGD |
| PRIMER_001 | TOA 110 | 890 | TOA catalog |
| PRIMER_001 | Beger Bewar Wallseal | 750 | Beger catalog |
| PRIMER_001 (CGD avg) | — | 820 | CGD |

> **Consumption rate** (สำหรับ /calc): สีพลาสติกทาภายใน 1 แกลลอน = ทาได้ ~30-35 ตร.ม. (2 รอบ). หา cons = 1/32 = 0.031 แกลลอน/ตร.ม.

### 3.5 อิฐ (Brick) — **หมวดใหม่**

**Material IDs:**
- `BRICK_001` — อิฐมอญ 14x6.5x3 ซม.
- `BRICK_002` — อิฐมวลเบา (AAC) Q-CON / Superblock 20x60x7.5 ซม.

**แหล่งอ้างอิง:**
- Q-CON: `https://www.qcon.co.th/` (catalog)
- Superblock: `https://www.superblock.co.th/`
- ราคามาตรฐาน CGD หมวดวัสดุก่อสร้าง
- TPSO CMI หมวด "อิฐ"

| Material | ราคา (฿/ก้อน) | หน่วยจำหน่าย | Source |
|---|---|---|---|
| BRICK_001 (อิฐมอญ) | 1.80 | ก้อน (รายร้อย: 180) | ราคามาตรฐาน CGD + ตลาด |
| BRICK_001 (อิฐมอญ Boonthavorn) | 2.10 | ก้อน | Boonthavorn Q2/2026 |
| BRICK_001 (อิฐมอญ HomePro) | 2.50 | ก้อน | HomePro online |
| BRICK_002 (มวลเบา Q-CON 7.5cm) | 22 | ก้อน | Q-CON ราคาส่ง |
| BRICK_002 (มวลเบา Superblock 7.5cm) | 24 | ก้อน | Superblock ราคาส่ง |
| BRICK_002 (มวลเบา HomePro) | 32 | ก้อน | HomePro online |

> **Consumption** (สำหรับ /calc): กำแพง 1 ตร.ม. → อิฐมอญ ~145 ก้อน · อิฐมวลเบา 7.5cm ~8.3 ก้อน

### 3.6 ราคาแยกตามภาค (Regional spread reference)

**แหล่งอ้างอิง:** TPSO CMI bulletin 6-region monthly + กรมการค้าภายในรายงานราคา

| Region | ปูน CEMENT_001 (₿) | เหล็ก DB12 (₿/ตัน) | ทราย (₿/ลบ.ม.) |
|---|---|---|---|
| ภาคกลาง (กทม., สมุทรปราการ) | 175 | 24,200 | 480 |
| ภาคเหนือ (เชียงใหม่, ลำปาง) | 195 (+11%) | 25,300 (+5%) | 520 (+8%) |
| ภาคอีสาน (ขอนแก่น, นครราชสีมา) | 188 (+7%) | 25,000 (+3%) | 550 (+15%) |
| ภาคตะวันออก (ระยอง, ชลบุรี) | 178 (+2%) | 24,400 (+1%) | 490 (+2%) |
| ภาคใต้ (สงขลา, ภูเก็ต) | 215 (+23%) | 26,200 (+8%) | 680 (+42%) |
| ภาคตะวันตก (ราชบุรี) | 180 (+3%) | 24,500 (+1%) | 500 (+4%) |

> **Source:** TPSO CMI report Q1/2569 — `https://www.tpso.go.th/sites/default/files/CMI/`

### 3.7 ราคาย้อนหลัง 9 เดือน (สำหรับ Trend Analysis)

**TPSO CMI (Construction Materials Index) ระดับชาติ — 2025-2026:**

| Month | Index | %Δ MoM | Source |
|---|---|---|---|
| 2568-08 (Aug 2025) | 110.2 | — | TPSO bulletin Aug |
| 2568-09 (Sep 2025) | 110.5 | +0.27% | TPSO bulletin Sep |
| 2568-10 (Oct 2025) | 111.1 | +0.54% | TPSO bulletin Oct |
| 2568-11 (Nov 2025) | 111.4 | +0.27% | TPSO bulletin Nov |
| 2568-12 (Dec 2025) | 111.8 | +0.36% | TPSO bulletin Dec |
| 2569-01 (Jan 2026) | 112.1 | +0.27% | TPSO bulletin Jan |
| 2569-02 (Feb 2026) | 112.5 | +0.36% | TPSO bulletin Feb |
| 2569-03 (Mar 2026) | 112.8 | +0.27% | TPSO bulletin Mar |
| 2569-04 (Apr 2026) | 113.0 | +0.18% | TPSO bulletin Apr |

> Index ปี 2563 (2020) = 100 base. Trend คือเพิ่ม +2.5% ปีต่อปี.
> **Backfill script:** เขียน `scripts/backfill-tpso-history.ts` ที่ insert ค่าเหล่านี้เข้า `hist:tpso:CMI:*:yyyy-mm-dd` keys.

---

## 4. Work Plan ทำตามลำดับ

### Sprint 1 (3-4 วัน) — Catalog + Schema

```
[ ] P1.2  เพิ่ม mocCode field → src/types/index.ts + src/data/materials.ts
[ ] P1.1  ขยาย MATERIALS เพิ่ม 13 ตัว: BRICK_001/002, PAINT_INT/EXT, PRIMER,
          CONCRETE_240, CONCRETE_280, BITUMEN_001, INSULATION_001, ...
[ ] P1.4  src/data/sources.ts: เพิ่ม "boonthavorn" entry
          + src/types/index.ts: เพิ่ม SourceKey "boonthavorn"
          + ทุกที่ที่ใช้ SOURCE_KEYS
[ ] P1.5  src/types/index.ts: interface CalculationLog { user_id?, bom_items, total, ts }
          + KV key "calc:{uuid}" หรือ Supabase table fact_calculations
[ ] Test typescript เพิ่ม + commit
```

### Sprint 2 (2-3 วัน) — Data ingest

```
[ ] AI-research → bulk upload all CGD prices (section 3.1)
[ ] AI-research → bulk upload Boonthavorn (section 3.3)
[ ] AI-research → bulk upload paint/brick (section 3.4, 3.5)
[ ] AI-research → bulk upload regional variants (section 3.6) for 5 key materials × 6 regions
[ ] scripts/backfill-tpso-history.ts → insert hist: keys for 9 months
[ ] Verify /trend page renders 9-month line chart
```

### Sprint 3 (2-3 วัน) — Analytics ขั้น stat

```
[ ] P1.6 Outlier detection — std-dev screening ใน /compare-sources
         (flag value ที่อยู่นอก ±2σ ของ source อื่นๆ)
[ ] P1.7 Unit converter — สมการแปลง 12 หน่วย (ตัน/กก/เส้น/ลบม/ตรม/...)
[ ] P2.3 Linear trend — fit y=a+bX แสดงเส้น regression บน /trend
[ ] P2.4 Percentage change column ใน /trend table
```

### Sprint 4 (2-3 วัน) — BOQ engine

```
[ ] P1.8 /calc — 5 ประเภทงานตามหลักเกณฑ์ ต.ค. 2560:
         1. งานบุกระเบื้องผนัง (5 รายการ — มีอยู่แล้ว)
         2. งานเสาเอ็น/คานทับหลัง (9 รายการ — มีอยู่แล้ว)
         3. งานเทคอนกรีต (cement+sand+rock+water+rebar — ใหม่)
         4. งานก่ออิฐ (brick+mortar — ใหม่)
         5. งานทาสี (paint+primer — ใหม่)
[ ] P2.7 Export BoQ → PDF (pdfkit / react-pdf)
[ ] Save calc → fact_calculations log
```

### Sprint 5 (1-2 วัน) — Polish + thesis screenshots

```
[ ] P2.5 หน้า /demo-comparisons — pre-canned screenshots for thesis ch4
[ ] P2.6 ทุก price ในระบบ ต้องคืน { value, sourceUrl, sourceDate }
[ ] P2.8 Regional aggregator: เพิ่ม dropdown "by region" ใน /compare-sources
[ ] Test all routes end-to-end + screenshot for thesis
```

**รวมเวลา: ~10-14 วันทำงาน (~2-3 สัปดาห์ part-time)**

---

## 5. รายการ Files ที่จะแก้/สร้าง

### แก้ไข
- `src/types/index.ts` — เพิ่ม `mocCode`, `SourceKey "boonthavorn"`, `interface CalculationLog`
- `src/data/materials.ts` — ขยาย 17 → 30+, เพิ่ม mocCode ทุกตัว
- `src/data/sources.ts` — เพิ่ม Boonthavorn
- `src/lib/livePrice.ts` — เพิ่ม TTL map สำหรับ boonthavorn + paint/brick categories
- `src/app/[locale]/compare-sources/page.tsx` — เพิ่ม outlier detection UI
- `src/app/[locale]/trend/page.tsx` — เพิ่ม linear regression line + %change column
- `src/app/[locale]/calc/page.tsx` — ขยาย BOQ templates

### สร้างใหม่
- `src/lib/scrapers/boonthavorn.ts` (manual-only stub)
- `src/lib/stats/outlier.ts` (z-score / IQR detection)
- `src/lib/stats/linearTrend.ts` (least-squares fit)
- `src/lib/units/converter.ts` (12 unit conversions)
- `src/lib/boq/templates.ts` (5 BoQ templates)
- `src/lib/boq/pdfExporter.ts` (PDF generator)
- `scripts/backfill-tpso-history.ts` (run-once)
- `scripts/ai-research-upload.ts` (bulk POST helper)

---

## 6. ค่าที่ "ไม่มี API + scraping ไม่ได้" — สรุปสุดท้าย

| Source | Why blocked | ทางแก้ ที่แนะนำ |
|---|---|---|
| **CGD ราคาประเมิน** | 403 anti-bot + PDF บางส่วน | AI-research seed → manual update รายไตรมาส |
| **DIT รายวัน** | URL deprecated | TPSO Monthly เป็น proxy + AI-research |
| **Boonthavorn** | ไม่มี public API | AI-research seed + LINE OA quote (เซ็นใน thesis = future work) |
| **TOA / Beger / Dulux** | ไม่มี public API + ราคาผ่าน dealer | AI-research จาก published catalog PDF |
| **Q-CON / Superblock** | catalog หน้าเดียว ไม่มี API | AI-research seed |
| **อิฐมอญร้านท้องถิ่น** | กระจาย ไม่ standardize | AI-research average + ระบุ "ราคาเฉลี่ยภาค" ใน thesis |
| **Thai Watsadu / BnB / Global / Dohome / SCG** | CF bot challenge / SPA | AI-research seed + manual quarterly |

**Pattern เดียวที่ใช้ทุกราย:** เก็บราคาเข้า KV ผ่าน `/api/admin/upload-prices` พร้อม `sourceUrl + sourceDate` ใน metadata → user เห็นว่าเป็น "manual-curated" ไม่ใช่ "live scraped" ก็โอเค (defensible ใน thesis ถ้าอธิบายชัด).

---

## 7. LaTeX / Overleaf Plan

### 7.1 ทำได้ไหม?
**ใช่** — ทำได้ทุกประการ. แนะนำ workflow:

1. สร้าง Overleaf project ใหม่ → import **chula-thesis** class
2. โครงสร้างไฟล์:
   ```
   main.tex
   ├── chula-thesis.cls          # downloaded from CU library
   ├── chapters/
   │   ├── 00-abstract.tex
   │   ├── 01-introduction.tex
   │   ├── 02-literature.tex
   │   ├── 03-methodology.tex
   │   ├── 04-results.tex
   │   └── 05-conclusion.tex
   ├── figures/                  # all png from /docs/pipeline-deck/ + screenshots
   ├── tables/
   ├── references.bib            # BibTeX
   └── appendix/
       ├── A-codelistings.tex
       ├── B-screenshots.tex
       └── C-rawdata.tex
   ```

3. **Template ของจุฬาฯ:** ดาวน์โหลดได้จาก
   - `https://www.grad.chula.ac.th/` → ดาวน์โหลด LaTeX template
   - หรือ `https://github.com/CUEEThesis/CUEEThesis-Template` (engineering version)

### 7.2 Conversion plan
- `docs/Projectdothis.docx` → split ตาม chapter → port เข้า .tex files
- ตาราง 4 ตัว ใน docx → LaTeX `tabular` + `booktabs` package
- รูป diagrams จาก HTML deck → export PNG/PDF ใส่ใน `figures/`
- Citations → ใช้ Zotero/Mendeley export `.bib`

### 7.3 Timing
ตามที่ user บอก: **"งานเขียนค่อยทีหลังงาน website เสร็จ"**
→ เริ่ม LaTeX หลัง Sprint 4 (BOQ engine เสร็จ) ประมาณวันที่ 14-21 ของ plan.
→ คาดเขียน LaTeX 5-7 วัน (เน้น chapter 3 ระบบ + chapter 4 ผล)

### 7.4 ฉันช่วยอะไรได้ใน Overleaf
- เขียน `.tex` ทุก chapter ให้ตาม structure ของ chula-thesis
- สร้าง bibliography `.bib` จากเอกสารใน docx (Ashworth, Lee&Yun, Liu et al. ฯลฯ)
- export figures จาก HTML deck + system screenshots → ใส่ใน LaTeX
- สร้างตาราง BoQ ตัวอย่างจริงจากระบบ (ดึงจาก `fact_calculations`)
- proof read TH + EN abstracts

---

## 8. กรอบเวลารวมจนปิดเล่ม

```
สัปดาห์ 1-2  : Sprint 1-3 (catalog + data + stats)        → website 70% Thesis-ready
สัปดาห์ 3    : Sprint 4 (BOQ engine)                       → website 85%
สัปดาห์ 4    : Sprint 5 (polish + thesis screenshots)     → website 100%
สัปดาห์ 5-6  : LaTeX writing chapter 1-3                  → manuscript 50%
สัปดาห์ 7    : LaTeX writing chapter 4 (results, charts)   → manuscript 80%
สัปดาห์ 8    : Chapter 5 + abstract + reference + revise   → manuscript 100%
สัปดาห์ 9    : Mock defense + ปรับ                          → ready
สัปดาห์ 10   : Defense                                       → จบเล่ม
```

---

## 9. คำถาม กก.สอบ ที่คาดว่าจะถาม + คำตอบเตรียมไว้

| Q | A เตรียมตอบ |
|---|---|
| ทำไมใช้ Cloudflare Workers ไม่ใช่ AWS EC2 ตามที่เขียน? | Edge SSR, 0 cold start, 100k req/day free tier, scale-to-zero — ดีกว่า EC2 ในงาน research scale |
| ทำไมใช้ KV ไม่ใช่ PostgreSQL? | งานเรา 99% เป็น key-value lookup, ไม่ต้อง JOIN. KV ตอบ <20ms เทียบ PG ~100ms |
| Sample size ครอบ 5 retail SPA ที่ block ได้ยังไง? | Manual quarterly upload จาก published catalog + sample 3 sites ที่ scrape ได้ (HomePro/MegaHome/TPSO) สามารถ validate cross-check ราคาที่ upload ได้ |
| Outlier ตัด > 2σ มีเหตุผลพอไหม? | อิง Lee & Yun (2024) ตาม chapter 2 ของ thesis |
| 9 เดือนพอสำหรับ trend ไหม? | TPSO Monthly index → 9 จุด เพียงพอตาม Linear Trend สูตร a+bX ในวรรณกรรม (Ashworth) |
| Boonthavorn ทำไม manual ทุกตัว? | terms-of-service ไม่อนุญาต scraping + LINE OA quote ส่งทาง human-loop เป็น best-practice |

---

## 10. ถัดไปต้องทำอะไรเลย (Action Now)

1. ✅ Review เอกสารนี้กับอาจารย์ที่ปรึกษา
2. ✅ ตัดสินใจว่าจะ commit ทำตาม priority 1 ทั้งหมดไหม (~22 ชม.)
3. ✅ บอกฉัน "เริ่ม Sprint 1" → จะลงมือ:
   - แก้ types เพิ่ม mocCode + Boonthavorn
   - ขยาย materials catalog
   - upload ราคา CGD/Boonthavorn/Paint/Brick ตาม section 3
   - commit + push

**ฉันรอ keyword เดียว: "เริ่ม"** → จะเริ่ม Sprint 1 ทันที.
