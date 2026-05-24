# fonts/ — Custom font directory for Overleaf

วาง TH Sarabun New TTF ทั้ง 4 ไฟล์ในโฟลเดอร์นี้
**ชื่อไฟล์ต้องตรงตามนี้** (ไม่มีช่องว่าง — ใช้ dash):

```
fonts/
├── THSarabunNew.ttf            (regular)
├── THSarabunNew-Bold.ttf       (bold)
├── THSarabunNew-Italic.ttf     (italic)
└── THSarabunNew-BoldItalic.ttf (bold italic)
```

**สำคัญ:** ถ้า zip ที่ดาวน์โหลดมาตั้งชื่อ `THSarabunNew Bold.ttf` (มีช่องว่าง)
ต้อง **rename** เป็น `THSarabunNew-Bold.ttf` ก่อน upload — XeLaTeX/Overleaf
มีปัญหากับชื่อ font file ที่มีช่องว่าง (TFM not found error)

## ดาวน์โหลด

- **Source 1 (แนะนำ):** <https://www.f0nt.com/release/th-sarabun-new/>
  คลิก "Download font" → unzip ได้ 4 ไฟล์ .ttf
- **Source 2 (GitHub):** <https://github.com/SIPA-CTH/THFonts>
- **Source 3 (Google):** <https://fonts.google.com/specimen/Sarabun>
  ⚠ Google Sarabun ไม่ใช่ตัวเดียวกับ TH Sarabun New แต่ใกล้เคียง 99%

## Auto-detect ใน main.tex (ใหม่)

`main.tex` ตอนนี้ใช้ `\IfFontExistsTF` ตรวจสอบไฟล์ก่อน:
- **ถ้ามี** `THSarabunNew.ttf` ใน `fonts/` → ใช้ TH Sarabun New
- **ถ้าไม่มี** → fall back เป็น Norasi (ที่ TeX Live มีอยู่แล้ว) อัตโนมัติ

ดังนั้น ไม่ต้องแก้ `main.tex` แล้ว — แค่ upload ไฟล์ font ก็ทำงานทันที

## ขั้นตอนใน Overleaf (ทำตามนี้)

1. ดาวน์โหลด TH Sarabun New จาก f0nt.com → unzip ได้ 4 ไฟล์ `.ttf`
2. **Rename** ไฟล์ให้ตรงตามนี้ (ตัด space → ใช้ dash):
   ```
   THSarabunNew Bold.ttf       →  THSarabunNew-Bold.ttf
   THSarabunNew Italic.ttf     →  THSarabunNew-Italic.ttf
   THSarabunNew BoldItalic.ttf →  THSarabunNew-BoldItalic.ttf
   THSarabunNew.ttf            →  คงเดิม
   ```
3. ใน Overleaf project → คลิก folder `fonts/` → Upload 4 ไฟล์
4. Recompile (Compiler = XeLaTeX)
5. ถ้ายังเจอ "TFM not found" → เช็คชื่อไฟล์ใน Overleaf อีกครั้งให้ตรงเป๊ะ

## Troubleshooting

| Error | สาเหตุ | แก้ |
|---|---|---|
| `TFM not found "[./fonts/TH Sarabun New]"` | ยังไม่ได้ upload font หรือชื่อมีช่องว่าง | upload + rename ลบช่องว่าง |
| `BoldFont undefined` | upload เฉพาะ regular | upload ครบ 4 ไฟล์ |
| ภาษาไทย render เป็น Norasi | auto-detect fail (path ไม่เจอ) | เช็ค `THSarabunNew.ttf` (ไม่มี space) อยู่ใน `fonts/` |

## License

TH Sarabun New เป็นฟอนต์ราชการของไทย ภายใต้ลิขสิทธิ์ Apache 2.0
ปล่อยฟรีโดย SIPA และ ครม. ตามมติเมื่อ 2553-09-07 ใช้ได้ทุกวัตถุประสงค์
รวมถึงงานเชิงพาณิชย์และวิทยานิพนธ์.

ไฟล์ font ไม่ได้ commit เข้า git repo (ขนาดใหญ่ + license attribution)
แต่ละผู้ใช้ download เอง.
