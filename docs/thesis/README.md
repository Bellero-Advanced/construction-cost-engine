# Thesis LaTeX Project — Overleaf (XeLaTeX)

> วิทยานิพนธ์ปริญญาบัณฑิต: "การพัฒนาระบบอัตโนมัติสำหรับการคำนวณต้นทุนต่อหน่วย
> ของวัสดุก่อสร้างจากข้อมูลของกระทรวงพาณิชย์และสถานประกอบการค้าปลีกสมัยใหม่
> ทั่วประเทศ"
>
> ผู้วิจัย: นาย พัชรพงษ์ จิวสืบพงษ์ (6330357521)
> อ.ที่ปรึกษา: รศ.ดร. วัชระ เพียรสุภาพ
> ภาควิชาวิศวกรรมโยธา จุฬาฯ — ปีการศึกษา 2568

---

## ⚠ ตั้งค่า Compiler ก่อน

ใน Overleaf:
1. **Menu → Compiler → XeLaTeX** (ไม่ใช่ pdfLaTeX!)
2. **Menu → Main document → main.tex**

ถ้าใช้ pdfLaTeX → ภาษาไทยหายหมด

---

## ฟอนต์ — เลือกได้ 2 แบบ

### Option A: TH Sarabun New (สวยกว่า แต่ต้อง upload)

TH Sarabun New เป็นฟอนต์ทางการของไทย (SIPA / ราชการ ปล่อยฟรี) — Overleaf ไม่ติดตั้งให้แต่
upload เข้า project ได้

**ขั้นตอน:**

1. **ดาวน์โหลด TH Sarabun New** จาก:
   - <https://www.f0nt.com/release/th-sarabun-new/> (4 ไฟล์ .ttf)
   - หรือ <https://github.com/SIPA-CTH/THFonts>
   - หรือถ้าเครื่องมีอยู่แล้ว ดูที่ `/System/Library/Fonts/Supplemental/` (macOS)

2. **ใน Overleaf project**: คลิก "New Folder" สร้าง `fonts/`
   แล้ว Upload 4 ไฟล์เข้าไป:
   ```
   fonts/THSarabunNew.ttf
   fonts/THSarabunNew Bold.ttf
   fonts/THSarabunNew Italic.ttf
   fonts/THSarabunNew BoldItalic.ttf
   ```

3. **แก้ `main.tex`** บรรทัด 19-29:
   - **Comment** บรรทัด `\setmainfont[Ligatures=TeX,Scale=1.0]{Norasi}` (Option B)
   - **Uncomment** block ของ Option A (7 บรรทัดที่ขึ้นด้วย `\setmainfont[Path=...`)

4. **Recompile** — TH Sarabun New จะ render สวยงาม
   - `Scale=1.4` คือ scale factor (Sarabun เล็กกว่าฟอนต์อังกฤษ ต้องคูณ 1.3-1.5 ให้สมดุล)

### Option B: Norasi (default — ใช้ได้ทันทีไม่ต้อง upload)

Norasi มากับ TeX Live ทุก distribution รวม Overleaf — เป็น default ของ skeleton นี้
ลักษณะใกล้ Browallia/Cordia มาก แต่อาจดูตัวอักษรเล็กกว่า Sarabun

ถ้าจะใช้ Norasi เลย → ไม่ต้องทำอะไร compile ได้เลย

### Comparison

| Font | สวยงาม | ต้อง upload | จำนวน TTF | Scale แนะนำ |
|---|---|---|---|---|
| **TH Sarabun New** | ⭐⭐⭐⭐⭐ ราชการมาตรฐาน | ✅ 4 ไฟล์ | 4 | 1.4 |
| **Norasi** | ⭐⭐⭐ ใช้ได้ | ❌ มาให้แล้ว | 0 | 1.0 |
| **Garuda** | ⭐⭐⭐ ใช้ได้ | ❌ มาให้แล้ว | 0 | 1.0 |
| **TH Sarabun Chula** | ⭐⭐⭐⭐ จุฬาฯ ทางการ | ✅ ขอจากภาควิชา | 4 | 1.4 |

> **คำแนะนำ:** ใช้ TH Sarabun New ถ้ามีเวลา upload — ฟอนต์ราชการที่ดูเป็นทางการที่สุด.

---

## โครงสร้างไฟล์

```
docs/thesis/
├── main.tex                        ← XeLaTeX entry, polyglossia + fontspec
├── references.bib                  ← BibLaTeX (15 entries, with `date` field)
├── frontmatter/
│   ├── cover.tex                   ← หน้าปก
│   ├── abstract-th.tex             ← บทคัดย่อภาษาไทย (~400 คำ)
│   ├── abstract-en.tex             ← Abstract English (~300 words)
│   └── acknowledgement.tex         ← กิตติกรรมประกาศ
├── chapters/
│   ├── 01-introduction.tex         ← บทที่ 1 บทนำ (~12 หน้า)
│   ├── 02-literature-review.tex    ← บทที่ 2 ทบทวนวรรณกรรม (~15 หน้า)
│   ├── 03-methodology.tex          ← บทที่ 3 วิธีการ (~18 หน้า)
│   ├── 04-results.tex              ← บทที่ 4 ผลการศึกษา (~12 หน้า)
│   └── 05-conclusion.tex           ← บทที่ 5 สรุป (~8 หน้า)
├── appendix/
│   ├── A-system-screenshots.tex
│   ├── B-code-listings.tex
│   └── C-raw-data.tex
├── figures/                        ← ใส่ .png/.pdf ทีหลัง
├── fonts/                          ← (ถ้าใช้ Option A) ใส่ THSarabunNew*.ttf
└── README.md
```

**คาดจำนวนหน้ารวม:** 60-80 หน้า

---

## Bug Fixes ที่แก้ไปแล้ว

จาก compile log (`output (1).log`) ที่พบเมื่อ Overleaf compile รอบแรก:

| Bug | สาเหตุ | แก้แล้วโดย |
|---|---|---|
| `TH Sarabun New ... TFM not found` (18 ครั้ง) | Overleaf ไม่ติดตั้ง font | เปลี่ยนเป็น Norasi default + เปิด Option A ให้ upload เองได้ |
| `polyglossia: monospace font undefined` (24 ครั้ง) | ไม่ได้ set `\setmonofont` | เพิ่ม `\setmonofont{Latin Modern Mono}` |
| `LaTeX Error: There's no line here to end` | `\\[2.5cm]` ใน `\center` | เปลี่ยนเป็น `\vspace{Xcm}` paragraph separators |
| `biblatex Warning: Language 'thai' not supported` | biblatex ไม่รู้จัก thai | เพิ่ม `language=english` ใน biblatex options |
| `labelyearlabelmonthlabelday` ในทุก citation | biblatex APA ต้องการ `date` ไม่ใช่ `year` | rewrite `references.bib` ใช้ `date={2024}` |
| ภาษาไทยหาย 95% | compile ด้วย pdfLaTeX | XeLaTeX + polyglossia + fontspec |

---

## Citation Style

ใช้ **numeric** (\[1\], \[2\]) — robust กับ biblatex มากที่สุด

```latex
\usepackage[backend=biber,style=numeric,sorting=nyt,language=english]{biblatex}
```

**ตัวอย่างการอ้าง:**
- `\cite{ashworth2015}` → \[1\]
- `\textcite{lee2024}` → Lee and Yun \[2\]

---

## Workflow แนะนำ

### สัปดาห์ 1: Setup + ตรวจสอบ
- ✓ Upload zip เข้า Overleaf
- ✓ ตั้ง Compiler = XeLaTeX
- ✓ ดาวน์โหลด TH Sarabun New + upload เข้า `fonts/` (optional แต่แนะนำ)
- ✓ Compile ครั้งแรก → ตรวจไม่มี LaTeX error
- ✓ ตรวจ Thai render + แก้คำผิด

### สัปดาห์ 2: Figures + Tables
- ถ่าย screenshot 7 รูปจาก production website
- export pipeline diagrams เป็น PDF จาก `docs/pipeline-deck/`
- แทน `\fbox{Placeholder...}` ด้วย `\includegraphics`

### สัปดาห์ 3: Proofread + ส่งอาจารย์
- spell check (Thai + English)
- ตรวจ \cite ที่ break/missing
- ส่งให้ที่ปรึกษา review

### สัปดาห์ 4: Defense prep
- Mock defense
- Print final PDF (A4, oneside)

---

## การเตรียม Figures

| ไฟล์ | URL ที่ใช้ถ่าย | ใช้ใน |
|---|---|---|
| `screen-home.png` | `/` | App.A §A.1 |
| `screen-compare.png` | `/compare-sources` (CEMENT_001) | App.A §A.2, Ch4 §4.4 |
| `trend-tpso-9month.png` | `/trend` (CEMENT_001 + TPSO) | Ch4 §4.5, fig:trend-cmi |
| `screen-calc-walltile.png` | `/wall-tile` (area=50) | App.A §A.4 |
| `screen-health.png` | `/health` | App.A §A.5 |
| `arch-overview.pdf` | `docs/pipeline-deck/index.html` slide 02 | Ch3 §3.1 |
| `flow-pipeline.pdf` | `docs/pipeline-deck/index.html` slide 04 | Ch3 §3.3 |

---

## Cross-reference กับ source code

| Chapter section | Code in repo |
|---|---|
| Ch3 §3.1 ภาพรวม | `docs/pipeline-deck/EXPLAINED.md` |
| Ch3 §3.3.1 Web Scraping | `src/lib/scrapers/_scrapingbee.ts`, `_headless.ts` |
| Ch3 §3.3.2 Canonicalization | `src/lib/scrapers/_suggestJsp.ts` |
| Ch3 §3.3.3 Unit converter | `src/lib/units/converter.ts` |
| Ch3 §3.3.4 Outlier detection | `src/lib/stats/outlier.ts` |
| Ch3 §3.4 BoQ engine | `src/lib/calculators.ts` |
| Ch3 §3.5.1 Linear trend | `src/lib/stats/linearTrend.ts` |
| Ch3 §3.5.4 Regional aggregator | `src/app/api/regional/[material]/route.ts` |
| Ch4 §4.7 fact_calculations | `src/app/api/admin/log-calculation/route.ts` |

---

## Live system

- **URL:** <https://construction-cost-engine.steep-tooth-c420.workers.dev>
- **Repo:** <https://github.com/Bellero-Advanced/construction-cost-engine>
- **Last commit:** see `git log`
