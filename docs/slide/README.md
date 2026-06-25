# Slide Presentation — Thesis Defense

สไลด์นำเสนอวิทยานิพนธ์ภาษาไทย ใช้ LaTeX Beamer (XeLaTeX/Tectonic)
สำหรับการนำเสนอประมาณ **1 ชั่วโมง** ต่อคณะกรรมการสอบ
ไล่เนื้อหาตามวิทยานิพนธ์ใน `../thesis/` เป็นบท ๆ

## โครงสร้าง (63 หน้า / 63 frames)

| ส่วน | จำนวน frames | หัวข้อหลัก | เวลาประมาณ |
|---|---|---|---|
| Title + Outline | 2 | หน้าปก + สารบัญ | 2 นาที |
| **บทที่ 1 บทนำ** | 12 | ที่มา, ปัญหา 8 ประเด็น, วัตถุประสงค์, ขอบเขต 5 ด้าน, ประโยชน์ | 11 นาที |
| **บทที่ 2 ทบทวนวรรณกรรม** | 8 | องค์ประกอบต้นทุน, 5 ขั้นตอน Ashworth, ตัวอย่าง CGD, 8 ข้อจำกัด, 4 เทคโนโลยี, งานวิจัยที่เกี่ยวข้อง | 9 นาที |
| **บทที่ 3 วิธีดำเนินการวิจัย** | 19 | 5 ระยะ R&D, เกณฑ์เลือก 8 เอกชน, เกณฑ์เลือก 5 ประเภทงาน, สถาปัตยกรรม, KV+Schema, 4 กลยุทธ์, AI Agent loop, Canonicalization, Units, z-score, BOQ, สถิติ, Deploy | 18 นาที |
| **บทที่ 4 ผลการวิจัย** | 13 | Coverage 100%, สถานะดึง, เปรียบเทียบราคา (ปูน/เหล็ก), แนวโน้ม + Regression, Regional, BOQ wall tile, 5 work-types, Validation 37 คู่, Case study, Performance | 12 นาที |
| **บทที่ 5 สรุป** | 8 | สรุปตามวัตถุประสงค์, ข้อมูลเบื้องต้น 11 แหล่ง, สถานะดึง/ไม่ดึง 3 กลุ่ม, Contribution, ข้อจำกัด, อนาคต, บทสรุป | 7 นาที |
| Q&A | 1 | ขอบคุณ + รับคำถาม | (สงวนเวลาให้กรรมการ) |

**รวม ~62 frames × 55 วินาที ≈ 57 นาที** + Q&A

## การคอมไพล์

```bash
cd docs/slide
tectonic -X compile main.tex     # ใช้ตัวนี้ — ติดตั้ง self-contained
# หรือ
xelatex main.tex && xelatex main.tex   # ถ้ามี TeX Live
```

**ฟอนต์:** ใช้ TH Sarabun New จาก `../thesis/fonts/` (ใช้ร่วมกับวิทยานิพนธ์)
**Output:** `main.pdf` (16:9 widescreen, ~292 KB, 63 หน้า)
**Compile:** ผ่านโดยไม่มี error/warning ใด ๆ

## การปรับแต่งก่อนนำเสนอ

ใน `main.tex`:
- บรรทัด `\author{ชื่อนิสิต~นามสกุล}` → ใส่ชื่อจริง
- บรรทัด `\date{พฤษภาคม พ.ศ.~2569}` → ใส่วันสอบ
- หากต้องการเปลี่ยนสี: ปรับ `\usecolortheme{seahorse}` → `dolphin`, `crane`, `wolverine`, ฯลฯ

## Tips การนำเสนอ

1. **บทที่ 3 และ 4 เป็นจุดที่กรรมการมักถามมากที่สุด** — เนื้อหาในสไลด์มีรายละเอียดพร้อมตอบ
2. หากเวลาน้อย ตัดบทที่ 4 frames 4.7 (Validation) และ 4.9 (Performance) ออกได้ก่อน
3. เตรียมตอบประเด็นที่อาจารย์เคยคอมเมนต์
   - **เกณฑ์เลือก 8 เอกชน** → frames 3.2 (2 frames)
   - **เกณฑ์เลือก 5 ประเภทงาน** → frame 3.3
   - **ระยะวิเคราะห์ความต้องการ** → frame 3.1 ใช้ชื่อใหม่ "ระยะศึกษาและกำหนดความต้องการของระบบ"
   - **ข้อมูลเบื้องต้นแต่ละแหล่ง + ดึง/ไม่ดึง** → frames 5.2 (2 frames)
4. การ validate AI Agent (สำหรับคำถาม) → frame 3.6.4: เปรียบเทียบกับ CGD baseline ratio 0.5--3.0

## Troubleshooting

- ฟอนต์ไม่ขึ้นเป็น TH Sarabun → ตรวจ `../thesis/fonts/THSarabunNew.ttf` มีอยู่
- Tectonic compile error → ลอง `tectonic -X compile main.tex --keep-logs` แล้วดู `main.log`
- ตารางล้นหน้า → เปลี่ยน `\footnotesize` → `\scriptsize` ในตารางนั้น
- หาก deploy บน Overleaf: เลือก compiler **XeLaTeX**, upload ทั้ง `docs/thesis/fonts/` และ `docs/slide/main.tex`
