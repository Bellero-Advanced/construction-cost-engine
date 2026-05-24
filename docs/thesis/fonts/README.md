# fonts/ — Custom font directory for Overleaf

วาง TH Sarabun New TTF ทั้ง 4 ไฟล์ในโฟลเดอร์นี้:

```
fonts/
├── THSarabunNew.ttf            (regular)
├── THSarabunNew Bold.ttf       (bold)
├── THSarabunNew Italic.ttf     (italic)
└── THSarabunNew BoldItalic.ttf (bold italic)
```

## ดาวน์โหลด

- **Source 1 (แนะนำ):** <https://www.f0nt.com/release/th-sarabun-new/>
  คลิก "Download font" → unzip ได้ 4 ไฟล์ .ttf
- **Source 2 (GitHub):** <https://github.com/SIPA-CTH/THFonts>
- **Source 3 (Google):** <https://fonts.google.com/specimen/Sarabun>
  ⚠ Google Sarabun ไม่ใช่ตัวเดียวกับ TH Sarabun New แต่ใกล้เคียง 99%

## ขั้นตอนใน Overleaf

1. ใน project file tree → New Folder → ตั้งชื่อ `fonts`
2. New File / Upload → upload ทั้ง 4 ไฟล์เข้า fonts/
3. แก้ `main.tex` บรรทัด 19-29:
   - **Comment** บรรทัด `\setmainfont[Ligatures=TeX,Scale=1.0]{Norasi}` (Option B)
   - **Uncomment** 7 บรรทัดของ Option A (เริ่มที่ `\setmainfont[Path=./fonts/...`)
4. Recompile

## License

TH Sarabun New เป็นฟอนต์ราชการของไทย ภายใต้ลิขสิทธิ์ Apache 2.0
ปล่อยฟรีโดย SIPA และ คณะรัฐมนตรี ตามมติเมื่อ 2553-09-07
ใช้ได้ทุกวัตถุประสงค์รวมถึงงานเชิงพาณิชย์และวิทยานิพนธ์.

ไฟล์ font ไม่ได้ commit เข้า git repo (ขนาดใหญ่ + license attribution)
แต่ละผู้ใช้ download เอง.
