# Thesis LaTeX Project — Overleaf (XeLaTeX)

> วิทยานิพนธ์ปริญญาบัณฑิต: "การพัฒนาระบบอัตโนมัติสำหรับการคำนวณต้นทุนต่อหน่วย
> ของวัสดุก่อสร้างจากข้อมูลของกระทรวงพาณิชย์และสถานประกอบการค้าปลีกสมัยใหม่
> ทั่วประเทศ"
>
> ผู้วิจัย: นาย พัชรพงษ์ จิวสืบพงษ์ (6330357521)
> อ.ที่ปรึกษา: รศ.ดร. วัชระ เพียรสุภาพ
> ภาควิชาวิศวกรรมโยธา จุฬาฯ — ปีการศึกษา 2568

---

## ⚠ สำคัญที่สุด — Compiler Settings

ใน Overleaf ต้องตั้งค่า:
1. **Menu → Compiler → XeLaTeX** (ไม่ใช่ pdfLaTeX!)
2. **Menu → Main document → main.tex**
3. ปล่อย Bibliography compiler เป็น Biber (default)

**ทำไม:** ภาษาไทยใน LaTeX ต้องใช้ **XeLaTeX** + **polyglossia** + **fontspec**
ถ้าใช้ pdfLaTeX (default) → ภาษาไทยหายหมด, citations แสดง `labelyearlabel...`

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
└── README.md
```

**คาดจำนวนหน้ารวม:** 60-80 หน้า (เหมาะสมกับ thesis ป.ตรี)

---

## ขั้นตอนใช้งาน Overleaf

### 1. Upload Project
1. New Project → Upload Project
2. Zip โฟลเดอร์ `docs/thesis/` ทั้งโฟลเดอร์
3. Set main document: `main.tex`
4. **Set Compiler: XeLaTeX** (สำคัญมาก)

### 2. Verify Thai font (Overleaf)
Overleaf มี Norasi ติดตั้งไว้แล้ว (ทุก TeX Live distribution มี). ถ้า compile แล้วฟอนต์
ไม่สวยให้ลองเปลี่ยนใน `main.tex`:
```latex
\setmainfont[Ligatures=TeX]{Norasi}        % default — ทำงานทุก distribution
\setmainfont[Ligatures=TeX]{Garuda}         % alternative — มีในหลาย distribution
% \setmainfont{TH Sarabun New}              % ⚠ ห้ามใช้ — Overleaf TeX Live 2025 ไม่มี
```

### 3. Compile
- กด "Recompile"
- รอ XeLaTeX → Biber → XeLaTeX → XeLaTeX (3-pass)
- ดู PDF ที่ panel ขวา

---

## Bug Fixes จาก PDF เดิม

ปัญหาที่พบใน `thesis_overleaf.pdf` (เวอร์ชั่นก่อนหน้า):

| Bug | สาเหตุ | แก้แล้วโดย |
|---|---|---|
| ภาษาไทยหายเกือบหมด | compile ด้วย pdfLaTeX | ใช้ `\usepackage{polyglossia}` + XeLaTeX |
| `labelyearlabelmonthlabelday` ในทุก citation | biblatex APA ต้องการ `date` field | เปลี่ยน `.bib` ให้ใช้ `date={2024}` แทน `year=` |
| TOC entries เป็น `.....` ว่าง | chapter title ไทย render ไม่ได้ | XeLaTeX + Thai font fix |
| เนื้อหาน้อย (~22 หน้า) | chapter scaffolds สั้น | expand ทุกบท 3-5 เท่า |
| header chapter เป็น `บทที่ 1` ตามด้วยบรรทัดว่าง | LaTeX bug — chapter title หาย | ฟิกซ์ใน XeLaTeX setup |

---

## Citation Style

ใช้ **numeric** (\[1\], \[2\], \[3\]) แทน APA — กันปัญหา biblatex render fail
เปลี่ยนเป็น `style=apa` ภายหลังได้ถ้าต้องการ

```latex
\usepackage[backend=biber,style=numeric,sorting=nyt]{biblatex}
```

**ตัวอย่างการอ้าง:**
- `\cite{ashworth2015}` → \[1\]
- `\textcite{lee2024}` → Lee and Yun \[2\]

15 entries ใน `references.bib` ครอบคลุม:
- Sirieawphikul (2024), Crone & Voith (1992), Ashworth et al. (2013)
- Ashworth & Perera (2015), Leung et al. (2005), Benchanakatkun (2014)
- Lee & Yun (2024), Rao et al. (2015), Chunyaem et al. (2019)
- Liu et al. (2024), Elmohr et al. (2022)
- TPSO (2569), CGD (2017), Vercel Next.js (2025), Cloudflare (2025)

---

## Workflow แนะนำ

### สัปดาห์ 1: ตรวจสอบ + ปรับเนื้อหา
- ✓ Compile ครั้งแรกใน Overleaf — ตรวจสอบไม่มี LaTeX error
- ✓ ตรวจ Thai render ทุกหน้า + แก้คำผิด
- ✓ เพิ่มเนื้อหาที่ที่ปรึกษา comment

### สัปดาห์ 2: Figures + Tables
- ถ่าย screenshot 7 รูปจาก production website (ดูตารางด้านล่าง)
- export pipeline diagrams เป็น PDF จาก `docs/pipeline-deck/`
- แทนที่ทุก `\fbox{Placeholder...}` ด้วย `\includegraphics`

### สัปดาห์ 3: Proofread + ส่งอาจารย์
- run spell check (Thai + English)
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

**วิธีถ่าย:**
1. F12 → device toolbar → 1280×720
2. Cmd-Shift-S → save as `.png`
3. upload ใส่ folder `figures/` ของ Overleaf
4. uncomment `\includegraphics{...}` ในไฟล์ที่เกี่ยวข้อง

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
