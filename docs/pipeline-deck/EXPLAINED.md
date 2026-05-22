# Construction Cost Engine — คำอธิบายเข้าใจง่าย

> สำหรับคน "ไม่ได้สาย tech" — อ่านแล้วเข้าใจว่าระบบนี้ทำอะไร, ทำไม, ใช้เครื่องมืออะไร, ได้ผลอะไร
>
> ไฟล์นี้คู่กับ presentation `Construction-Cost-Engine-Pipeline.pptx` — แต่ละหัวข้อตรงกับ slide

---

## 📖 อ่านยังไง

- เริ่มจาก **เรื่องระบบทำอะไร** ก่อน (Slide 01-02)
- แล้วค่อยดู **ขั้นตอนการทำงาน** ทีละ stage (Slide 03-08)
- จบที่ **อุปสรรค + แผน** (Slide 09-10)
- ถ้าเจอศัพท์ tech ที่ไม่เข้าใจ → ดูที่ท้ายไฟล์ **"คำศัพท์ tech ที่ใช้ในระบบ"**

---

# 🎯 Slide 01 — ระบบนี้คืออะไร

## เปรียบเทียบให้เห็นภาพ
ลองนึกถึงเวลาจะซื้อ iPhone — คุณจะเข้า Shopee, Lazada, JIB, Power Buy, Apple Store แล้วเทียบราคาดูว่าเจ้าไหนถูก/แพง ใช่ไหมครับ?

**ระบบนี้ก็ทำแบบเดียวกัน — แต่กับ "วัสดุก่อสร้าง"**

- ปูนซีเมนต์ตราเสือ 50 กิโล → ราชการบอกราคาประเมิน "175 บาท", HomePro ขาย "220 บาท", MegaHome ขาย "210 บาท"
- เหล็กข้ออ้อย DB12 → ราชการประเมิน "620 บาท/เส้น", ร้านขายปลีก "650-720"
- กระเบื้องปูพื้น 12×12 → แต่ละเจ้าราคาห่างกันได้ถึง 30%

**ระบบจะดึงราคาเหล่านี้มาเก็บไว้ที่เดียว แล้วเปิดให้ใช้งานผ่านเว็บไซต์**

## ใครเป็นคนใช้?
- **ผู้รับเหมา** — ทำ BoQ (Bill of Quantities = ใบประเมินราคาวัสดุก่อนเริ่มงาน)
- **เจ้าของบ้าน** — เช็คว่าผู้รับเหมาคิดราคาวัสดุสมเหตุสมผลไหม
- **นักธุรกิจค้าวัสดุ** — ดูว่าราคาตลาดเป็นยังไง คู่แข่งขายเท่าไหร่
- **นักวิจัย / นักศึกษา** — ดูเทรนด์ราคาวัสดุเปลี่ยนไปยังไง

## ตัวเลขที่ควรรู้
- ดึงราคาจาก **10 แหล่งข้อมูล** (3 ราชการ + 7 ร้านค้าปลีก)
- ครอบคลุม **17 ชนิดวัสดุ** (ปูน · ทราย · หิน · เหล็กเส้น · กระเบื้อง · ฯลฯ)
- รองรับ **77 จังหวัด** (ราคาแต่ละจังหวัดอาจต่างกัน)

---

# 🗺 Slide 02 — Overview ภาพรวมระบบ

## ขั้นตอนการทำงาน 5 ขั้น

```
1. INPUT (รับ)         → 10 แหล่งข้อมูลส่งราคาเข้ามา
2. ACQUIRE (เก็บ)      → ใช้ 4 วิธีดึงข้อมูลที่ต่างกัน
3. NORMALIZE (จัดให้ตรง)→ ทำให้สินค้าจากเจ้าต่างๆ เปรียบเทียบกันได้
4. STORE (เก็บลงตู้)   → เก็บลง database ของ Cloudflare
5. SERVE (เสิร์ฟ)      → เปิดเป็นเว็บไซต์ + API ให้คนเรียกใช้
```

## ทำไมเลือก Cloudflare Workers?
**Cloudflare** เป็นบริษัทยักษ์ใหญ่อันดับ 1 ในการ host เว็บไซต์ทั่วโลก. **Workers** คือ server ของเขา.

**ข้อดี:**
- เร็วมาก เพราะมี server กระจายอยู่ทุกประเทศ (300+ เมือง). คนไทยเปิดเว็บ → server ที่กรุงเทพตอบ. คนอเมริกาเปิด → server New York ตอบ
- ไม่มี "cold start" (ปกติ server พักนานๆ จะเริ่มช้า — Cloudflare ไม่มีปัญหานี้)
- เสียเงินตามใช้จริง — ถ้าไม่มีคนเข้า = ไม่จ่ายเงิน

## ทำไม TTL 30 วัน?
**TTL = Time To Live** = ราคาที่เก็บไว้จะ "หมดอายุ" ใน 30 วัน แล้วต้องไปดึงใหม่

**เหตุผล:** ราคาประเมินทางการของไทยเปลี่ยน **ไตรมาสละครั้ง** (3 เดือน). ดึงทุกวันก็เปลือง — ดึงสัปดาห์ละครั้งก็เพียงพอ

---

# 📥 Slide 03 — Input: แหล่งข้อมูล 10 แหล่ง

## แหล่งราชการ 3 แห่ง (Government)
ราคาที่ราชการประเมินไว้ — ใช้อ้างอิงในการประมูลงานราชการ, ทำ BoQ ที่ต้องอ้างอิงเอกสารทางการ

| แหล่ง | ทำอะไร | ความถี่ |
|---|---|---|
| **TPSO** สำนักงานนโยบายและยุทธศาสตร์การค้า | ออก CMI Index (ดัชนีราคาวัสดุก่อสร้าง) | รายเดือน |
| **CGD** กรมบัญชีกลาง | ราคามาตรฐานสำหรับงานราชการ | รายไตรมาส |
| **DIT** กรมการค้าภายใน | ราคาตลาดรายวัน (แต่เว็บปิดไปแล้ว) | รายวัน |

## แหล่งร้านค้าปลีก 7 แห่ง (Modern Trade)
ร้านขายวัสดุก่อสร้างใหญ่ที่คนทั่วไปซื้อจริง — ราคาตลาดจริง

| แหล่ง | สถานะ |
|---|---|
| **HomePro** | ✅ ดึงอัตโนมัติได้ |
| **MegaHome** | ✅ ดึงอัตโนมัติได้ |
| **Thai Watsadu** (ไทยวัสดุ) | ❌ เจ้าของบล็อกบอท → ต้องอัปโหลดเอง |
| **Global House** | ❌ เว็บเปลี่ยน HTML ทุก request → ดึงยาก |
| **BnB Home** | ❌ บล็อกบอท |
| **SCG Home** | ❌ ดึงยาก |
| **Dohome** | ❌ ดึงยาก |

> "บอท" = โปรแกรมที่ไปกดดูเว็บแทนคน. หลายเว็บมีระบบจับว่าใครเป็นบอทแล้วบล็อก เพราะกลัวคู่แข่งดูดราคาไปหมด

## วัสดุ 17 ชนิด แบ่งเป็น 3 กลุ่ม

```
🧱 งานผนัง-กระเบื้อง (5 ชนิด)
   กระเบื้อง · ปูนกาว · ปูนยาแนว · คิ้ว PVC · น้ำผสมปูน

🏛 งานเสา-คาน (4 ชนิด)
   ปูนซีเมนต์ · ทราย · หิน · น้ำ

⛓ งานเหล็กเสริม (8 ชนิด)
   เหล็กเส้นกลม RB6/RB9
   เหล็กข้ออ้อย DB10/12/16/20/25
   ลวดผูกเหล็ก · ไม้แบบ · ตะปู
```

---

# 🔧 Slide 04 — Acquisition: 4 วิธีดึงราคา

ทำไมต้องมี 4 วิธี? เพราะแต่ละแหล่งส่งข้อมูลคนละแบบ — ไม่มีมาตรฐานเดียวที่ใช้ได้กับทุกที่

## วิธี A: อ่าน PDF
**ใช้กับ:** TPSO, CGD
**ปัญหา:** ราชการชอบส่งราคาเป็นเอกสาร PDF (เหมือนใบเสร็จที่ scan มา)
**วิธีแก้:** ใช้โปรแกรมชื่อ `unpdf` แปลง PDF เป็นข้อความ แล้ว search หาบรรทัดที่มีราคา

**เปรียบเทียบ:** เหมือนได้รับเมนูร้านอาหารเป็นกระดาษ → ต้องอ่านเอง แล้วจดราคา

## วิธี B: ดึง JSON API
**ใช้กับ:** HomePro, MegaHome
**โชค:** สองเจ้านี้เปิดช่องทาง "ค้นหา" ที่ส่งข้อมูลเป็น format โครงสร้างพร้อมใช้ทันที
**วิธีแก้:** ส่ง request ค้นหา → ได้ list สินค้า + ราคากลับมา → จบ

**เปรียบเทียบ:** เหมือนถาม Siri ว่า "ปูนซีเมนต์ตราเสือราคาเท่าไหร่" → ตอบทันที

## วิธี C: ใช้ ScrapingBee
**ใช้กับ:** เว็บที่บล็อกบอท (Thai Watsadu, BnB, ฯลฯ)
**ScrapingBee** = บริการที่ให้บอทเราใช้ IP address ของบ้านคนจริงในประเทศไทย → เว็บเป้าหมายคิดว่าเป็นคนปกติเข้า
**วิธีแก้:** ส่ง URL ไปที่ ScrapingBee → ScrapingBee เปิดเว็บ → ดึง HTML กลับมา → เราหาราคาในนั้น

**เปรียบเทียบ:** เหมือนจ้างคนอื่นไปเดินร้านวัสดุแทนเรา เพราะร้านนั้นห้ามเราเข้า

## วิธี D: อัปโหลดเอง (Manual)
**ใช้กับ:** แหล่งที่วิธี A/B/C ใช้ไม่ได้
**วิธีแก้:** Admin (ผู้ดูแล) อัปโหลดราคาเป็น Excel/CSV เข้าระบบเดือนละครั้ง
**เปรียบเทียบ:** เหมือนพิมพ์ราคาเข้า Excel เอง

## Fallback Chain (ลำดับการลอง)
ระบบจะลองทีละวิธี ถ้าวิธีแรกไม่ได้ ก็ไปวิธีถัดไป

```
1. ScrapingBee + ดึงข้อมูล structured
       ↓ (ถ้าไม่ได้)
2. ScrapingBee + ดึง HTML แบบดิบ
       ↓
3. ใช้ Browser จำลองของ Cloudflare เปิดเว็บเหมือนคนจริง
       ↓
4. ยอมแพ้ → รอ admin อัปโหลดเอง
```

---

# 🧩 Slide 05 — Canonicalization: ทำให้เปรียบเทียบกันได้

## ปัญหา (เข้าใจง่ายๆ)

คุณค้นคำว่า **"ปูน"** ใน HomePro
→ ได้ผลลัพธ์ 200 รายการ
→ ราคา 80 บาท ถึง 2,400 บาท
→ มีทั้งปูนซีเมนต์, ปูนยาแนว, ปูนกาว, ปูนพลาสเตอร์, ปูนปลาสเตอร์ลายไม้, ฯลฯ

ถ้าเอามาเฉลี่ยทั้งหมด = ไม่ได้คำตอบที่ถูก

**แล้วถ้าจะเทียบกับ MegaHome:**
- HomePro ใช้คำว่า "ปูนซีเมนต์ปอร์ตแลนด์ ตราเสือ 50 กก"
- MegaHome ใช้คำว่า "Tiger Cement Type I 50kg"

ระบบจะรู้ได้ยังไงว่า "เออ มันคือสินค้าตัวเดียวกัน" → **นี่คือปัญหา canonical matching**

## วิธีแก้ (Option B — pragmatic approach)

### 1. ใส่ "ตัวตน" ให้แต่ละวัสดุ
แต่ละชนิดวัสดุในระบบจะถูก tag ด้วย 3 ค่า:

```
CEMENT_001 (ปูนซีเมนต์ Type I 50 กก)
  brand: "ตราเสือ"    ← ยี่ห้อ
  size:  "50kg"        ← ขนาด/น้ำหนัก
  grade: "Type I"      ← เกรด/มาตรฐาน
```

### 2. กรอง 3 ระดับ
เวลาดูผลลัพธ์จากเว็บ:

| ระดับ | เงื่อนไข | คุณภาพ |
|---|---|---|
| **tight** | ขนาดตรง + เจอ brand/grade | 🟢 ตรงสุด |
| **loose** | ขนาดตรงอย่างเดียว | 🟡 พอใช้ |
| **legacy** | ไม่เจออะไรเลย → เฉลี่ยทั้งหมด | 🔴 หยาบ |

ระบบจะเอา **tight** ก่อน ถ้าไม่มีค่อยไป **loose** ถ้าไม่มีอีกค่อยไป **legacy**

### 3. บอกผู้ใช้ตรงๆ
หน้า "เปรียบเทียบราคา" จะแสดง:
- **Chip สีเหลือง:** "กำลังกรองด้วย: ตราเสือ / 50kg / Type I"
- **คำเตือน:** ถ้าราคาต่ำสุด-สูงสุดต่างกันเกิน 30% จะเตือนว่า "นี่เป็นแค่ Indicative Range" (= ราคาคร่าวๆ อย่าใช้แบบ exact)
- **Label trust:** Government = "ราคาประเมินทางการ", Modern Trade = "ราคาตลาด"

---

# 💾 Slide 06 — Storage: เก็บราคาที่ไหน

## ใช้ Cloudflare KV
**KV** ย่อมาจาก "Key-Value" store = ตู้เก็บข้อมูลแบบง่ายมาก
- มี **key** (กุญแจ) → มี **value** (ค่า)
- เหมือน Dictionary ของ Python หรือ Map ของ JavaScript

**ทำไมไม่ใช้ database แบบ MySQL/PostgreSQL?**
- เราไม่ต้องการ query ซับซ้อน — แค่ "ราคาของวัสดุ X ที่จังหวัด Y" ← lookup ง่ายๆ
- KV เร็วกว่ามาก (ตอบใน 5-20ms ทั่วโลก)
- ราคาถูกกว่ามาก

## โครงสร้างข้อมูล 2 แบบ

### แบบ 1: Live cache (ราคาปัจจุบัน)
```
Key:   "homepro:CEMENT_001:10"   (homepro + รหัสปูน + จังหวัด 10/กทม.)
Value: { price: 220, fetchedAt: 1716... }
TTL:   30 วัน (รัฐ) / 14 วัน (HomePro)
```

### แบบ 2: History snapshot (ราคาย้อนหลัง)
```
Key:   "hist:tpso:CEMENT_001:10:2026-05-22"
Value: { price: 175, fetchedAt: ... }
TTL:   365 วัน (เก็บ 1 ปี)
```

แบบ 2 ทำให้ภายหลัง user เปิดดู "trend chart" ได้ — เห็นว่าราคาปูนช่วง 6 เดือนที่ผ่านมาขึ้น-ลงยังไง

## เก็บราคาบ่อยแค่ไหน?

| Trigger | เมื่อไหร่ | ทำอะไร |
|---|---|---|
| **GitHub Actions cron** | จันทร์ 10:17 น. ไทย | ดึงราคาใหม่ + เก็บ snapshot |
| **On-demand** | ตอน user เปิดหน้าเว็บ | ถ้า cache หมดอายุ → ดึงใหม่ |
| **Admin manual** | เมื่อ admin กดอัปโหลด | เก็บ CSV ของ CGD/DIT รายเดือน |

> **GitHub Actions** = ระบบของ GitHub ที่ตั้งเวลาให้ run โค้ดอัตโนมัติ (เหมือนตั้ง alarm)
> **Cron** = วิธีตั้งเวลาให้ทำซ้ำตามรอบ (รายชั่วโมง / รายวัน / รายสัปดาห์)

---

# 🌐 Slide 07 — API Layer: ช่องทางให้คนเรียกใช้

**API** = "Application Programming Interface" = ช่องทางที่ให้โปรแกรมอื่นเรียกใช้ระบบเรา
**REST** = แบบหนึ่งของ API ที่ใช้กันแพร่หลายที่สุดในเว็บ (เรียกผ่าน URL + HTTP method GET/POST/etc.)

## API สาธารณะ (ใครก็เรียกได้)
- **`GET /api/prices/[source]/[material]`** — ราคาของวัสดุ X จากแหล่ง Y
- **`GET /api/compare/[material]`** — เปรียบเทียบราคาวัสดุ X จากทั้ง 10 แหล่งพร้อมกัน
- **`GET /api/sources/health`** — สถานะ "สุขภาพ" ของแต่ละแหล่ง (ดึงสำเร็จเท่าไหร่/ค้างเท่าไหร่)
- **`GET /api/prices/status`** — แหล่งไหนยังทำงาน, ScrapingBee เปิดอยู่ไหม
- **`GET /api/trend/[source]/[material]`** — กราฟราคาย้อนหลัง

## API ส่วน Admin (ต้องมี token)
- **`POST /api/admin/refresh-prices`** — สั่งดึงราคาใหม่
- **`POST /api/admin/upload-prices`** — อัปโหลดราคาเอง (สำหรับ CGD/DIT)
- **`POST /api/admin/snapshot-history`** — เซฟราคาเข้าประวัติ
- **`GET /api/admin/scrapingbee-debug`** — ดูว่าทำไม ScrapingBee ดึงไม่สำเร็จ

> **Token** = รหัสลับที่ admin ใช้พิสูจน์ตัวตน (เหมือนกุญแจร้าน — ใครไม่มีกุญแจเข้าไม่ได้)

## Cache headers (เคล็ดลับความเร็ว)
```
public, s-maxage=60, stale-while-revalidate=120
```
แปลว่า: "Cloudflare ช่วยจำคำตอบไว้ 60 วินาที. ถ้ามีคนถามอีกใน 60 วินาทีนั้น ตอบทันที — ไม่ต้องไปดูฐานข้อมูล"

ผลลัพธ์: **99% ของ request ตอบโดย Cloudflare edge** ไม่ต้องเข้าระบบหลังบ้าน → เร็วและถูก

---

# 📱 Slide 08 — Consumer: หน้าเว็บที่ user ใช้

8 หน้าหลัก:

| หน้า | ทำอะไร |
|---|---|
| **/sources** | ตารางรวมราคา + freshness badge + ปุ่ม download CSV + uploader สำหรับ admin |
| **/compare-sources** | ⭐ หน้าเด่น — เลือกวัสดุ + จังหวัด → เห็น bar chart เทียบ 10 แหล่ง + คำเตือน spread |
| **/trend** | กราฟราคาย้อนหลัง (ต้องรอ cron เก็บข้อมูล 7+ จุด) |
| **/health** | dashboard สุขภาพระบบ — เห็นว่าแหล่งไหน fresh/stale/missing |
| **/api-docs** | คู่มือ API สำหรับนักพัฒนา + ตัวอย่าง curl |
| **/calc** | เครื่องคิดเลข BoQ — ใส่ปริมาณงาน → คำนวณวัสดุที่ต้องใช้ + ราคารวม |
| **/admin/sources** | UI อัปโหลด CSV สำหรับ admin |
| **sitemap.xml / robots.txt** | สำหรับ Google ค้นหาเจอ (SEO) |

> **Freshness badge** = ป้ายสีบอกอายุข้อมูล (เขียว = สด, เหลือง = พอใช้, แดง = เก่า)
> **Spread** = ส่วนต่างระหว่างราคาต่ำสุดกับสูงสุด ที่แสดงเป็น %

---

# ⚠️ Slide 09 — Problems: อุปสรรคที่ยังเหลือ

ตรงไปตรงมา — ระบบยังไม่ perfect, มีปัญหาเหล่านี้:

| ปัญหา | สาเหตุ | ทางแก้ปัจจุบัน | สถานะ |
|---|---|---|---|
| CGD ดึงไม่ได้ | เว็บบล็อกบอท | admin upload รายเดือน | 🔴 workaround |
| DIT ดึงไม่ได้ | เว็บปิดไปแล้ว | admin upload รายวัน | 🔴 workaround |
| Thai Watsadu / BnB | Cloudflare บล็อก (เหมือนเรา) | manual หรือใช้ proxy แพง | 🔴 blocked |
| Global / Dohome / SCG | เว็บโหลด HTML ว่างๆ ก่อน แล้วเติมราคาที่หลังด้วย JavaScript | manual; รอ reverse-engineer | 🔴 blocked |
| ScrapingBee quota | ฟรี 1000 ครั้ง/เดือน | weekly cron + filter = ~200/เดือน | 🟢 OK |
| เปรียบเทียบสินค้าผิดตัวกัน | brand/size ต่าง | Option B canonical filter | 🟢 fixed |
| Trend chart ว่าง | cron เพิ่งเปลี่ยน | passive — รอ 4-7 สัปดาห์ | 🟡 waiting |

## Reality check (อย่าหลอกตัวเอง)
**5/10 แหล่งใช้ได้อัตโนมัติ, 5/10 ต้อง manual**

**แต่!** 3 แหล่งที่ใช้ได้อัตโนมัติ (TPSO + HomePro + MegaHome) ครอบคลุม **70% ของการ lookup ในงาน BoQ จริง** — เพราะสายงานเน้นไป TPSO (ราคาราชการอ้างอิง) + HomePro (ร้านดังที่ user คุ้นเคย)

---

# 🚀 Slide 10 — Roadmap: ต่อไปทำอะไร

## ระยะใกล้ (วันนี้ → 4 สัปดาห์)
1. **ปล่อย cron เก็บข้อมูล 4 สัปดาห์** → trend page มีข้อมูล
2. **เก็บ CGD/DIT รายไตรมาส** ผ่าน CSV uploader
3. **ขยาย canonical จาก 15/17 → 17/17** วัสดุ (เหลือ 2 ตัวที่ยังไม่ tag)
4. **เขียน `sourceOverrides`** ตัวอย่างให้ 2-3 วัสดุ (กรณีที่ HomePro/MegaHome ใช้คำต่างกัน)

## ระยะกลาง (4-12 สัปดาห์)
5. **Reverse-engineer Dohome/SCG XHR API** — ดูว่าเว็บโหลดราคามาจาก URL ลับๆ ของตัวเองไหม → ถ้าใช่ ดึงตรงจากนั้น
6. **อัปเกรด ScrapingBee** เป็น Hobby plan ($49/เดือน) ถ้า usage ทะลุ 1000/เดือน
7. **Province aggregator** — เฉลี่ยราคาเป็นภาค (เหนือ/อีสาน/ใต้)
8. **Alert system** — ถ้า spread > 50% → ส่ง notification เข้า Slack

## คำถามที่ต้องตัดสินใจ
- **น้ำหนัก trust:** ราคา Government ควรนับเป็น 2 เท่าของ Retail ไหม?
- **ขยายจังหวัด:** ตอนนี้ default แค่ กทม. (รหัส 10) — ขยายกี่จังหวัด?
- **เปิดสาธารณะ:** ปล่อย API ให้คนภายนอกใช้ฟรี หรือเก็บ rate limit?

---

# 📚 คำศัพท์ tech ที่ใช้ในระบบ (Glossary)

> เรียงตามหมวด — ใช้ค้นหากลับเมื่ออ่าน slide เจอศัพท์ไม่เข้าใจ

## 🏗 Framework / Library
**Next.js**
- Framework สำหรับสร้างเว็บไซต์ด้วย React
- เป็น "โครงสร้างพื้นฐาน" ที่บอกว่าโค้ดควรอยู่ตรงไหน, ทำ routing ยังไง
- ใช้ทำได้ทั้งหน้าเว็บปกติ + API + เว็บ SSR (Server-Side Rendering)
- เป็นที่นิยมที่สุดในโลก React (Vercel เป็นเจ้าของ)

**React**
- Library ของ Facebook สำหรับสร้าง UI ในเว็บ
- ทำให้เว็บโต้ตอบกับ user ได้แบบเรียลไทม์โดยไม่ต้อง reload หน้า

**Tailwind CSS**
- เครื่องมือเขียน CSS แบบรวดเร็วด้วย "utility class"
- แทนที่จะเขียน `.button { color: red }` แล้วเรียก `<button class="button">` → เขียน `<button class="text-red-500">` ตรงๆ
- ผลลัพธ์: เขียน UI ได้เร็ว, file CSS เล็ก

**Recharts**
- Library วาดกราฟใน React
- ใช้ทำ bar chart, line chart, pie chart ในระบบนี้

**next-intl**
- ตัวจัดการภาษาใน Next.js
- รองรับ TH (และเปิดทาง EN/ZH ในอนาคต)

## ☁️ Cloud / Infrastructure
**Cloudflare Workers**
- บริการ "server-less" ของ Cloudflare — แปลว่าเราไม่ต้องดูแล server
- โค้ดเรารันบน edge (server ใกล้ผู้ใช้ทั่วโลก 300+ เมือง)
- จ่ายตามใช้จริง (request-based pricing)

**Cloudflare KV**
- ฐานข้อมูลแบบ "Key-Value" ของ Cloudflare
- เร็ว, กระจายทั่วโลก, เหมาะกับ cache
- โครงสร้างง่าย — มี key → ดึง value ออกมา

**Cloudflare Browser Rendering**
- บริการของ Cloudflare ที่ให้เรา "เปิด browser แบบ headless" ในระบบ
- ใช้ดึงข้อมูลจากเว็บที่ render ด้วย JavaScript (SPA)
- ต้องสมัคร Workers Paid plan ถึงใช้ได้

**Cron / Cron Job**
- ระบบตั้งเวลา (scheduled job) ที่ทำงานซ้ำตามรอบ
- เขียนเป็น "17 3 * * 1" = ทุกวันจันทร์ 03:17 UTC
- ในระบบนี้ใช้ผ่าน **GitHub Actions** (ไม่ใช่ Cloudflare เพื่อความ portable)

## 🌐 Web / Protocol
**API (Application Programming Interface)**
- ช่องทางที่โปรแกรม A คุยกับโปรแกรม B
- เช่น web → server, server → server

**REST API**
- แบบหนึ่งของ API ที่ใช้ HTTP verbs (GET/POST/PUT/DELETE)
- URL = address, method = action
- เช่น `GET /api/prices/homepro/CEMENT_001`

**JSON (JavaScript Object Notation)**
- format การแลกเปลี่ยนข้อมูลที่อ่านง่าย, เหมือน dictionary
- `{ "price": 220, "live": true }`
- เกือบทุก API ในโลกใช้ JSON

**JSON-LD**
- JSON แบบมี "ความหมาย" (Linked Data)
- Google + เว็บส่วนใหญ่ใช้ embed ใน HTML เพื่อบอก search engine ว่า "นี่คือสินค้า, ราคา X"
- เราขโมยข้อมูลจาก JSON-LD ได้แทนการ scrape HTML

**HTML (HyperText Markup Language)**
- ภาษาเขียนหน้าเว็บ — บอก browser ว่าหน้าตาเว็บเป็นยังไง

**HTTP (HyperText Transfer Protocol)**
- โปรโตคอลที่ browser คุยกับ server
- ทุกครั้งที่เปิดเว็บ → browser ส่ง HTTP request → server ส่ง HTTP response กลับ

**SSR (Server-Side Rendering)**
- เว็บที่ถูก render จาก server ก่อนส่งไปให้ browser
- ตรงข้ามกับ **SPA** (Single Page Application) ที่ render ด้านฝั่ง browser
- ข้อดี SSR: SEO ดี, โหลดครั้งแรกเร็ว
- ระบบเราใช้ SSR ผ่าน Next.js + Cloudflare Workers

**SPA (Single Page Application)**
- เว็บที่ load HTML ว่างๆ ก่อน แล้วใช้ JavaScript เติมเนื้อหาทีหลัง
- ทำเว็บเร็ว, smooth, แต่ scrape ยาก (เพราะ initial HTML ว่าง)
- เว็บที่ block เราหลายเจ้าเป็น SPA

## 🛠 Data / Parsing
**unpdf**
- Library JavaScript ที่อ่าน PDF แล้วดึงข้อความออกมา
- ใช้กับ TPSO/CGD ที่ส่งราคาเป็น PDF

**xlsx**
- Library อ่าน/เขียน Excel files
- ใช้ตอน admin upload CSV

**Regex (Regular Expression)**
- pattern matching ของข้อความ
- เช่น `(\d+(?:\.\d+)?)` = "หาตัวเลข เช่น 220 หรือ 220.50"
- ใช้ดึงราคาออกจาก HTML / PDF text

**Scraping / Web Scraping**
- การดึงข้อมูลจากเว็บไซต์อัตโนมัติด้วย bot
- legal-grey area — เว็บใหญ่ๆ พยายามบล็อก

**ScrapingBee**
- บริการ scraping ระดับมืออาชีพ
- ใช้ residential IP (IP ของบ้านคนจริง) เพื่อไม่ให้เว็บเป้าหมายจับว่าเป็นบอท
- รองรับ JS rendering (เปิดเว็บแบบ browser จริง รอ SPA โหลดเสร็จ)

**Puppeteer**
- Library ของ Google ที่ควบคุม Chrome browser ผ่านโค้ด
- ทำได้ทุกอย่างที่คนทำได้ — เปิดเว็บ, คลิก, scroll, screenshot
- Cloudflare มี Puppeteer version ของตัวเองสำหรับ Workers

## 📦 Database / Backend
**Supabase**
- บริการ "backend-as-a-service" ที่ใช้ PostgreSQL เป็นฐานข้อมูล
- รวม auth + database + storage + realtime ไว้ที่เดียว
- (Factory Landing ใช้ — แต่ Construction Cost Engine ไม่ใช้)

**PostgreSQL**
- ฐานข้อมูลแบบ relational ที่ open-source ที่นิยมที่สุด
- supports SQL queries, transactions, complex queries

**TTL (Time To Live)**
- อายุข้อมูลที่เก็บใน cache
- ครบ TTL = หมดอายุ ระบบจะไปดึงข้อมูลใหม่

## 🔐 Security / Auth
**Token / API Token**
- รหัสลับยาวๆ (เช่น `cce19eb2...`)
- ใช้พิสูจน์ตัวตนแทน password
- ถ้าหลุด = เปลี่ยนใหม่ได้โดยไม่ต้องเปลี่ยน password account

**RLS (Row Level Security)**
- ระบบความปลอดภัยของ database
- กำหนดว่า user แต่ละคนเข้าถึง row ไหนได้บ้าง
- ใช้ใน Supabase

## 🚢 DevOps / CI/CD
**GitHub Actions**
- ระบบ automation ของ GitHub
- เขียน workflow เป็น YAML file → ทำงานเมื่อมี event (เช่น push code, รายสัปดาห์, ฯลฯ)
- ระบบเราใช้สำหรับ cron + auto-deploy

**CI/CD (Continuous Integration / Continuous Deployment)**
- กระบวนการ "auto build + auto deploy"
- push code → server build + run tests + deploy ขึ้น production อัตโนมัติ

**Wrangler**
- CLI tool ของ Cloudflare สำหรับ deploy / manage Workers
- เช่น `wrangler secret put SCRAPINGBEE_API_KEY` ใส่รหัสลับเข้า production

## 🎨 UI Components
**shadcn/ui**
- ชุด UI components สำเร็จรูปสำหรับ React + Tailwind
- copy-paste ได้, ไม่ใช่ npm library — owner ของโค้ดเต็มที่

**Framer Motion**
- Library animation สำหรับ React
- ทำ smooth transition, spring physics

---

# 🎯 สรุป (สำหรับ executive ที่อ่านสั้นๆ)

**Construction Cost Engine คือ:**
ระบบรวมราคาวัสดุก่อสร้างไทยจาก 10 แหล่ง (ราชการ + ค้าปลีก) → เปิดเป็น API + เว็บไซต์เปรียบเทียบราคา

**Tech stack หลัก:**
- Cloudflare Workers (server) + KV (database) + Browser Rendering (scraper)
- Next.js 16 (framework) + Tailwind CSS (style) + Recharts (chart)
- ScrapingBee (proxy สำหรับเว็บที่บล็อกบอท)
- GitHub Actions (cron auto-refresh + auto-deploy)

**สถานะวันนี้:**
- ✅ 3/10 แหล่ง auto: TPSO + HomePro + MegaHome → คุม 70% lookup จริง
- 🟡 5/10 แหล่ง ต้อง manual upload (CGD, DIT + 5 retail SPA)
- ✅ Option B canonical matching ทำงานแล้ว → user เห็น apples-to-apples
- 🟡 Trend chart รอ data 4-7 สัปดาห์

**Roadmap ใกล้:**
- Reverse-engineer SPA APIs เพื่อ unblock retail 5 ราย
- Province aggregator (เฉลี่ยรายภาค)
- Trust weighting (Government 2x?)
