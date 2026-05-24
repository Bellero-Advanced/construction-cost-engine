# Thesis LaTeX Project — Overleaf Skeleton

> วิทยานิพนธ์ปริญญาบัณฑิต: "การพัฒนาระบบอัตโนมัติสำหรับการคำนวณต้นทุนต่อหน่วย
> ของวัสดุก่อสร้างจากข้อมูลของกระทรวงพาณิชย์และสถานประกอบการค้าปลีกสมัยใหม่
> ทั่วประเทศ"
>
> ผู้วิจัย: นาย พัชรพงษ์ จิวสืบพงษ์ (6330357521)
> ที่ปรึกษา: รศ.ดร. วัชระ เพียรสุภาพ
> ภาควิชาวิศวกรรมโยธา คณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย — ปีการศึกษา 2568

---

## โครงสร้างไฟล์

```
docs/thesis/
├── main.tex                          ← entry point
├── references.bib                    ← BibLaTeX (11 citations)
├── frontmatter/
│   ├── cover.tex                     ← หน้าปก
│   ├── abstract-th.tex               ← บทคัดย่อภาษาไทย
│   ├── abstract-en.tex               ← Abstract (English)
│   └── acknowledgement.tex           ← กิตติกรรมประกาศ
├── chapters/
│   ├── 01-introduction.tex           ← บทที่ 1 บทนำ
│   ├── 02-literature-review.tex      ← บทที่ 2 การทบทวนวรรณกรรม
│   ├── 03-methodology.tex            ← บทที่ 3 วิธีการดำเนินงาน
│   ├── 04-results.tex                ← บทที่ 4 ผลการศึกษา
│   └── 05-conclusion.tex             ← บทที่ 5 สรุปและข้อเสนอแนะ
├── appendix/
│   ├── A-system-screenshots.tex      ← ภาคผนวก A: รูปหน้าจอ
│   ├── B-code-listings.tex           ← ภาคผนวก B: ตัวอย่างโค้ด
│   └── C-raw-data.tex                ← ภาคผนวก C: ข้อมูลดิบ
├── figures/                          ← .png/.pdf (ใส่ทีหลัง)
└── tables/                           ← additional .tex tables
```

---

## ขั้นตอนใช้งาน Overleaf

### 1. Upload เข้า Overleaf
1. สร้าง Project ใหม่ใน Overleaf → "Upload Project"
2. zip ทั้งโฟลเดอร์ `docs/thesis/` แล้ว upload หรือใช้ `git clone`
3. set main document: `main.tex`
4. set compiler: `XeLaTeX` (รองรับฟอนต์ไทย)

### 2. ใช้ class file ทางการของจุฬาฯ
ดาวน์โหลด `chulaengthesis.cls` จาก:
- ภาควิชาวิศวกรรมโยธา (ขออาจารย์ที่ปรึกษา หรือ web จุฬาฯ)
- หรือ template ทั่วไป: <https://github.com/CUEEThesis/CUEEThesis-Template>

แล้วเปลี่ยนบรรทัด 11 ใน `main.tex`:
```latex
% \documentclass[12pt,a4paper,oneside]{report}
\documentclass[bachelor]{chulaengthesis}
```

ถ้ายังไม่มี class file สามารถ compile กับ `report` class ได้ก่อน
(format จะใกล้เคียงพอใช้ตรวจ content)

### 3. Compile
- กด "Recompile" — LaTeX → PDF
- ถ้ารูปยังว่างให้ใส่ `.png` ใน `figures/` (ดู section ถัดไป)

---

## การเตรียม Figures

**Screenshots ที่ต้องถ่ายจาก production website:**

| File | URL ที่ใช้ถ่าย | คำอธิบายในแต่ละ chapter |
|---|---|---|
| `screen-home.png` | `/` | App.A §A.1 |
| `screen-compare.png` | `/compare-sources` (เลือก CEMENT_001) | App.A §A.2 + Ch4 §4.3 |
| `trend-tpso-9month.png` | `/trend` (CEMENT_001 + TPSO source) | Ch4 §4.4 fig:trend |
| `screen-calc-walltile.png` | `/wall-tile` (area=50) | App.A §A.4 |
| `screen-health.png` | `/health` | App.A §A.5 |
| `arch-overview.pdf` | docs/pipeline-deck/index.html slide 02 | Ch3 §3.1 |
| `flow-pipeline.pdf` | docs/pipeline-deck/index.html slide 04 | Ch3 §3.3 |

**วิธีถ่าย:**
1. เปิด browser ไปที่ URL
2. F12 → device toolbar → set 1280×720 (ขนาดมาตรฐาน thesis)
3. screenshot full-content
4. save เป็น `.png` ใน `figures/`

**ไดอะแกรมจาก HTML deck:**
1. เปิด `docs/pipeline-deck/index.html`
2. ไป slide ที่ต้องการ (เช่น slide 02 Overview)
3. Cmd-P → Save as PDF (single page) → ใส่ใน `figures/`

แล้ว uncomment บรรทัด `\includegraphics{...}` ในแต่ละ figure block

---

## Citation Style

ใช้ APA style ผ่าน `biblatex` package + `biber` backend.

**ใน Overleaf:** ตั้ง compiler = `XeLaTeX`, ตั้ง bibliography tool = `Biber`.

**ตัวอย่างการอ้าง:**
- `\autocite{ashworth2015}` → (Ashworth & Perera, 2015)
- `\textcite{lee2024}` → Lee and Yun (2024)
- `\parencite{liu2024}` → (Liu et al., 2024)

11 citations ใน `references.bib` ตรงกับที่อ้างใน thesis docx เดิม:
1. Sirieawphikul (2024) — public construction projects
2. Crone & Voith (1992) — cost estimation
3. Ashworth et al. (2013) — Willis's QS
4. Ashworth & Perera (2015) — Cost Studies of Buildings
5. Leung et al. (2005) — project participant satisfaction
6. Benchanakatkun (2014) — TH cost standardization
7. Lee & Yun (2024) — outlier detection ⭐ critical for ch3
8. Rao et al. (2015) — web scraping commodity ⭐
9. Chunyaem et al. (2019) — AI material classification ⭐
10. Liu et al. (2024) — price forecasting review ⭐
11. Elmohr et al. (2022) — data source reliability

⭐ = อ้างใน chapter 2 literature review

---

## Workflow แนะนำ

### สัปดาห์ 1: ปรับเนื้อหา chapters
- อ่านแต่ละ `.tex` chapter เปรียบเทียบกับ docx เดิม
- เพิ่มเติม/แก้ไขเนื้อหาที่ Patcharapong เขียนไว้ที่ยังขาด
- ดึง paragraph จาก docx เพิ่มถ้าจำเป็น

### สัปดาห์ 2: Figures + Tables
- ถ่าย screenshot ทั้งหมด 7 รูป
- export pipeline diagrams เป็น PDF
- check ทุก `\fbox{Placeholder...}` แล้วแทนที่ด้วย `\includegraphics`

### สัปดาห์ 3: Polish + ส่งอาจารย์
- รัน `\bibliography` cycle ครบ
- check spell check (Thai + English)
- ใส่ page numbers, fix LaTeX warnings
- ส่งให้ที่ปรึกษา review

### สัปดาห์ 4: Defense prep
- Mock defense กับเพื่อน/รุ่นพี่
- เตรียม slide deck (ใช้ `docs/pipeline-deck/index.html` ปรับ)
- Print final PDF

---

## Cross-reference กับระบบจริง

| Chapter section | Code reference (in repo) |
|---|---|
| Ch3 §3.1 ภาพรวมระบบ | `docs/pipeline-deck/EXPLAINED.md` |
| Ch3 §3.3.1 Web Scraping | `src/lib/scrapers/_scrapingbee.ts`, `_headless.ts` |
| Ch3 §3.3.2 Canonicalization | `src/lib/scrapers/_suggestJsp.ts` |
| Ch3 §3.3.3 Unit converter | `src/lib/units/converter.ts` |
| Ch3 §3.3.4 Outlier detection | `src/lib/stats/outlier.ts` |
| Ch3 §3.4 BoQ engine | `src/lib/calculators.ts` |
| Ch3 §3.4.1 Linear trend | `src/lib/stats/linearTrend.ts` |
| Ch3 §3.4.2 Regional aggregator | `src/app/api/regional/[material]/route.ts` |
| Ch4 §4.5 Calculation log | `src/app/api/admin/log-calculation/route.ts` |

ทำให้ที่ปรึกษาสามารถตรวจสอบ implementation จริงได้ทุกขั้นตอน.

---

## Live system สำหรับ defense

- **URL:** <https://construction-cost-engine.steep-tooth-c420.workers.dev>
- **Repo:** <https://github.com/Bellero-Advanced/construction-cost-engine>
- **Last commit (Sprint 5):** `670d7e7` + manual seed
