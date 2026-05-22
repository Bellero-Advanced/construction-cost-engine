# Construction Cost Engine — Data Pipeline Deck

> Self-contained HTML presentation. เปิดด้วย browser → `docs/pipeline-deck/index.html` (หรือ `python3 -m http.server` แล้วเปิด `localhost:8000`)

**Navigation:** ← →, Space, PageUp/Down, Home/End, ปุ่มล่างขวา.

---

## ทำไมเป็น HTML แทน PowerPoint

- เปิดได้ทุกเครื่องไม่ต้องลง app
- export PDF จาก browser ได้ (Cmd-P → Save as PDF)
- ใส่ไว้ใน repo → diff ได้, version-control ได้
- ใช้ font + palette เดียวกับ product จริง (Inter + IBM Plex Sans Thai + amber/ink theme)
- ไม่มี dependency — ไม่มี CDN, ไม่มี build step

---

## Slide-by-slide breakdown

### Slide 01 — Title / Agenda
**Purpose:** ตั้งกรอบ. ระบบนี้คืออะไร, ครอบคลุมอะไร, สไลด์จะพูดอะไรต่อบ้าง.
**Key facts on slide:** 10 sources · 17 materials · 77 provinces · Cloudflare Workers · Next.js 16.
**Speaker note:** Construction cost engine = ระบบรวมราคาวัสดุก่อสร้างจาก 3 หน่วยงานราชการ + 7 ค้าปลีก เปิดเป็น REST API + UI เปรียบเทียบ. ใช้สำหรับงาน BoQ และ price benchmarking.

---

### Slide 02 — Overview (System at a Glance)
**Purpose:** mental model 5 ขั้นตอน — INPUT → ACQUIRE → NORMALIZE → STORE → SERVE.
**Why these 5:** ตรงกับโครงสร้าง folder ใน repo (`scrapers/`, `data/`, `lib/livePrice.ts`, `app/api/`, `app/[locale]/`)
**3 cards underneath:**
1. *Why this exists* — ราคาวัสดุไทยกระจาย, ต้องรวมศูนย์
2. *Why Cloudflare Workers* — edge SSR + KV + Browser Rendering + Cron ในที่เดียว
3. *Why TTL = 30 days* — ราคาประเมินเปลี่ยนรายไตรมาส ดึงบ่อยกว่าเปลือง credit

**Speaker note:** สไลด์นี้คือแผนที่ — ที่เหลือเป็นการ zoom เข้าแต่ละ stage.

---

### Slide 03 — Input Layer
**Purpose:** อธิบายแหล่งข้อมูลทั้ง 10 + materials taxonomy 3 กลุ่ม.
**Two columns:**
- **Government (3):** TPSO, CGD, DIT — ราคา"อ้างอิงทางการ" ใช้ใน BoQ
- **Modern Trade (7):** HomePro, MegaHome (LIVE) + Thai Watsadu, Global House, BnB, SCG, Dohome (manual)

**Materials taxonomy:**
- `wall_tile` (5) — กระเบื้อง · ปูนกาว · ปูนยาแนว · คิ้ว
- `column_beam` (4) — ปูน · ทราย · หิน · น้ำ
- `rebar` (8) — RB6/RB9 · DB10/12/16/20/25 · ลวด · ไม้แบบ · ตะปู

**Speaker note:** อย่าโฟกัสจำนวน — โฟกัสว่าทำไม Government ≠ Modern Trade. คนละบทบาท. Govt = baseline ทางการ, Retail = ราคาตลาดจริง.

---

### Slide 04 — Acquisition (4 Strategies)
**Purpose:** ทำไม 1 ระบบต้องมี 4 วิธีเก็บราคา.
**4 cards:**
- **A · PDF (`unpdf`)** — TPSO, CGD ส่งราคาใน PDF
- **B · JSON API (`suggest.jsp`)** — HomePro family. ตรงเร็ว ไม่ต้อง render
- **C · ScrapingBee** — residential proxy + JS render → JSON-LD pick
- **D · Manual upload** — `/api/admin/upload-prices` สำหรับ source ที่ scrape ไม่ได้

**Fallback chain (retail):**
ScrapingBee + JSON-LD → ScrapingBee + regex → CF Browser Rendering → null
**Speaker note:** ไม่มีวิธีเดียวที่ใช้ได้ทุกแหล่ง. Pragmatic > pure.

---

### Slide 05 — Canonicalization (Option B)
**Purpose:** อธิบายปัญหา "หาว่าสินค้าจาก HomePro ตัวไหน = สินค้าจาก MegaHome ตัวไหน" และวิธีแก้.
**Three sections:**

1. **Canonical spec per material** (`Material.canonical = {brand, size, grade}`)
   - example: `CEMENT_001 = ตราเสือ / 50kg / Type I`
   - + `searchTerms[]` สำหรับ query ค้นหา

2. **Three-tier filter** (used in `_suggestJsp.ts` + `_scrapingbee.ts`)
   - **tight** — must-match size + nice-match brand/grade hit
   - **loose** — must-match size only
   - **legacy** — no hit → median ทั้งหมด (backward compat)

3. **UI honesty** (in `/compare-sources`)
   - Canonical chip แสดง brand/size/grade
   - Trust label: Government = Official BoQ, Modern Trade = Market
   - Spread > 30% → "Indicative range" warning

**Speaker note:** ปัญหา apples-to-apples คือเหตุผลที่งบประมาณราชการกับราคา HomePro มัน "ใกล้กัน" ได้ถึงแม้สินค้าไม่ใช่ตัวเดียวกัน — Option B ทำให้ผู้ใช้รู้ว่ากำลังเปรียบเทียบอะไรอยู่.

---

### Slide 06 — Storage
**Purpose:** schema KV + cadence
**Two key shapes:**
- **Live cache:** `{source}:{materialId}:{province}` → `{price, fetchedAt}`, TTL 30d (govt) / 14d (HomePro)
- **History snapshot:** `hist:{source}:{material}:{prov}:{yyyy-mm-dd}` → `{price, fetchedAt}`, TTL 365d

**Refresh cadence table:**
- GH Actions cron (Mon 03:17 UTC) — refresh-prices + snapshot-history → ~50 ScrapingBee credits/wk
- On-demand fetch — KV miss only, rate-limited
- Admin upload — manual, auth-gated

**Speaker note:** TTL ตั้งใจให้ยาว เพราะราคาประเมินทางการเปลี่ยน รายไตรมาส. Cron weekly คือ over-fetch ปลอดภัย — ไม่ใช่ทุกวัน.

---

### Slide 07 — API Layer
**Purpose:** REST surface ทั้งหมด แบ่ง public กับ admin
**Public REST (5 endpoints):**
- `GET /api/prices/[source]/[material]?province=N`
- `GET /api/compare/[material]?province=N` — fan-out 10 sources + summary
- `GET /api/sources/health?province=N`
- `GET /api/prices/status`
- `GET /api/trend/[source]/[material]`

**Admin (4 endpoints, x-admin-token):**
- `POST /api/admin/refresh-prices?source=X`
- `POST /api/admin/upload-prices`
- `POST /api/admin/snapshot-history`
- `GET /api/admin/scrapingbee-debug`

**Cache headers:** `public, s-maxage=60, stale-while-revalidate=120` — Cloudflare edge ตอบ 99% โดยไม่แตะ Worker
**Speaker note:** ทุกอย่างเป็น public-readable. `/api-docs` มีคู่มือพร้อม curl examples.

---

### Slide 08 — Consumer Layer (UI Pages)
**Purpose:** หน้าทั้งหมดที่ end-user แตะ
**8 pages in 4-col grid:**
- `/sources` — ตารางราคา + freshness badge + CSV export + uploader
- `/compare-sources` — bar chart + canonical chip + spread warning
- `/trend` — time-series line chart (waiting for cron data)
- `/health` — coverage tiles
- `/api-docs` — REST reference
- `/calc` — BoQ calculator
- `/admin/sources` — CsvUploader UI
- `sitemap.xml` + `robots.txt`

**Speaker note:** /compare-sources คือหน้า hero — ตอบ "ราคาที่ผมต้องใช้ใน BoQ ควรเป็นเท่าไหร่"

---

### Slide 09 — Problems & Mitigations
**Purpose:** ตรงไปตรงมา — อะไรยังไม่เวิร์ค
**7 rows:**

| # | Problem | Status |
|---|---|---|
| 1 | CGD blocks scrape | WORKAROUND (manual) |
| 2 | DIT URL deprecated | WORKAROUND (manual) |
| 3 | Thai Watsadu/BnB CF block | BLOCKED (paid proxy needed) |
| 4 | Globalhouse/Dohome/SCG SPA-XHR | BLOCKED (XHR RE needed) |
| 5 | ScrapingBee free tier 1000/mo | OK (~200/mo actual) |
| 6 | Apples-to-apples matching | FIXED (Option B) |
| 7 | Trend chart empty | WAITING (cron needs 4-7 weeks) |

**Reality check (callout):** ~5/10 sources auto, 5/10 manual. แต่ 3/10 auto (TPSO + HomePro + MegaHome) ครอบคลุม **70% ของ lookup จริง** ในงาน BoQ.

**Speaker note:** ห้ามขายเกินจริง. ระบบ usable วันนี้สำหรับ baseline pricing แต่ govt + bot-blocked retail ยังต้อง manual.

---

### Slide 10 — Roadmap
**Purpose:** สิ่งที่จะทำต่อ + open questions ให้ stakeholder ช่วยตัดสิน
**Short-term (วันนี้ → 4 สัปดาห์):**
1. รัน weekly cron 4 สัปดาห์ → trend page มีข้อมูล
2. เก็บ CGD/DIT รายไตรมาสผ่าน CSV uploader
3. ขยาย canonical จาก 15/17 → 17/17 materials
4. เขียน `sourceOverrides` ตัวอย่างใน 2-3 materials

**Medium-term (4-12 สัปดาห์):**
5. Reverse-engineer Dohome/SCG XHR → unblock 2 sources
6. Upgrade ScrapingBee → Hobby ($49/mo) ถ้า usage > 1000
7. Province aggregator (median per region)
8. Alert: spread > 50% → Slack webhook

**Open questions (3 cards):**
- Trust weighting? (Govt = 2x?)
- Province coverage? (ตอนนี้ default 10/กทม.)
- Public docs + rate limit policy?

**Footer:** Live URL · Repo · last commit (`7f619f9`)

---

## Editing the deck

แต่ละ slide เป็น `<section class="slide">` ใน `index.html`. แก้ตรงนั้นได้เลย — ไม่มี build step.

ใช้ palette CSS variables ใน `<style>` ตอนต้นไฟล์:
- `--amber-bright #fbbf24` = ตัวเลข, accent
- `--teal #14b8a6` = government / official
- `--red #ef4444` = blocked / problem
- `--ink #f5f1e8` = text หลัก, `--ink-2/3` = secondary/hint

Component classes ที่ reuse ได้:
- `.card` (+ `.amber/.teal/.red` accent)
- `.pill` (+ `.teal/.red/.line`)
- `.flow` + `.box` + `.arrow` สำหรับ pipeline diagrams
- `.grid-2/3/4`

## Export to PDF

1. เปิด `index.html` ใน Chrome
2. กด `Home` ให้ไป slide 1
3. Cmd-P → Destination = "Save as PDF" → Layout: Landscape → More settings → Margins: None → Background graphics: ✅
4. แต่ละ slide จะกินครึ่งหน้า — ถ้าต้องการ 1 slide / page ให้ใช้ workflow ภายนอก (เช่น `decktape`):
   ```
   npx decktape generic --key=ArrowRight docs/pipeline-deck/index.html deck.pdf
   ```

## Files

- `docs/pipeline-deck/index.html` — deck (1 file, no deps)
- `docs/pipeline-deck/README.md` — this doc
