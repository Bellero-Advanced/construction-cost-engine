# Construction Data Fetcher

ดึงข้อมูล **ราคาวัสดุก่อสร้างจริง** จาก API ของหน่วยงานภาครัฐไทย แล้วบันทึกลงไฟล์ Excel อัตโนมัติ

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | คืออะไร |
|------|---------|
| `fetch_construction_data.py` | สคริปต์หลัก — ดึง API → เขียน Excel |
| `requirements.txt` | library ที่ต้องติดตั้ง (pandas, openpyxl) |
| `data-fetcher-explained.pdf` | คู่มืออธิบายโค้ดแบบเข้าใจง่าย (จาก LaTeX) |
| `data-fetcher-explained.docx` | คู่มือเดียวกันในรูปแบบ Word |
| `data-fetcher-explained.tex` | ต้นฉบับ LaTeX ของคู่มือ |
| `build_docs.sh` | สคริปต์คอมไพล์คู่มือเป็น PDF + DOCX |
| `fonts/` | ฟอนต์ Sarabun สำหรับคอมไพล์ LaTeX |
| `output/` | โฟลเดอร์เก็บไฟล์ Excel (สร้างอัตโนมัติเมื่อรัน) |

## เริ่มใช้งาน

```bash
# 1. ติดตั้ง library
pip install -r requirements.txt

# 2. รันสคริปต์
python3 fetch_construction_data.py
```

ได้ไฟล์ Excel ใหม่ใน `output/construction_data_<วันเวลา>.xlsx` ทุกครั้งที่รัน

## แหล่งข้อมูล (API จริง)

1. **CSI** — `dataapi.moc.go.th/csi-indexes`
   ดัชนีราคาวัสดุก่อสร้างระดับประเทศ รายเดือน (กระทรวงพาณิชย์)
2. **CPIP** — `dataapi.moc.go.th/cpip-indexes`
   ดัชนีราคาก่อสร้างรายจังหวัด สูงสุด 77 จังหวัด (กระทรวงพาณิชย์)
3. **Green Label** — `nhicservices.nha.co.th/.../green_label/mid`
   ราคาวัสดุฉลากเขียวจริงเป็นบาท 5,000+ รายการ

## ไฟล์ Excel ที่ได้ (6 sheet)

| Sheet | เนื้อหา |
|-------|---------|
| Summary | ภาพรวมการดึง (เวลา, จำนวนแถวแต่ละแหล่ง) |
| CSI_National | ดัชนีระดับประเทศ |
| CPIP_Provincial | ดัชนีรายจังหวัด |
| GreenLabel_Prices | ราคาวัสดุจริง |
| GreenLabel_Summary | สรุปราคา เฉลี่ย/ต่ำสุด/สูงสุด ต่อหมวด |
| Fetch_Logs | log การดึงทุกขั้นตอน |

## คอมไพล์คู่มือใหม่ (ถ้าแก้ .tex)

```bash
./build_docs.sh
```

ต้องมี `xelatex` (TinyTeX/MacTeX) และ `pandoc` ติดตั้งไว้

## หมายเหตุ

- API ของกระทรวงพาณิชย์ตอบช้า (30–45 วินาที/ครั้ง) สคริปต์มีระบบ retry อัตโนมัติ
- ข้อมูลทั้งหมดเป็น **ของจริง** ดึงสดทุกครั้งที่รัน ไม่ใช่ mock
