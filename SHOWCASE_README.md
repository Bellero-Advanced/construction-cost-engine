# Construction Cost Engine - Showcase Package

**ไฟล์สำหรับ demo และ showcase โปรเจค - รันได้บนเครื่องอื่นง่าย ๆ**

---

## 📦 Files in This Package

```
construction-cost-engine/
├── showcase_complete.ipynb    # 🎯 Main notebook (รันไฟล์นี้)
├── showcase_data.py           # Data module
├── SHOWCASE.md                # Documentation
└── SHOWCASE_README.md         # This file
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install jupyter pandas matplotlib seaborn tabulate
```

### 2. Run Showcase

```bash
jupyter notebook showcase_complete.ipynb
```

---

## 📊 What's Inside

- **Section 1**: Setup & Installation
- **Section 2**: Data Overview (27 materials, 11 sources, 10 provinces)
- **Section 3**: Price Data
- **Section 4**: Trend Analysis (11-month charts)
- **Section 5-6**: Calculator Demos (Wall Tile, Concrete)
- **Section 7**: Visualization (Source comparison)
- **Section 8**: Summary

---

## 🔧 Use Data Module Standalone

```python
from showcase_data import calc_wall_tile, BASE_PRICES

result = calc_wall_tile(
    area=25.5,
    tile_price=BASE_PRICES['TILE_001'],
    adhesive_price=BASE_PRICES['ADHESIVE_001'],
    grout_price=BASE_PRICES['GROUT_001']
)

print(f"Total: {result['total']:,.2f} THB")
```

---

## 🌐 Run Full Web App

```bash
npm install
npm run dev
```

เปิด http://localhost:3000

---

## ✅ Expected Output

เมื่อรัน notebook ครบทุก cell ควรได้:

- ✅ Load 27 materials, 11 sources, 10 provinces
- ✅ แสดงตาราง materials/sources/provinces
- ✅ กราฟ 3 แผนภูมิ (Cement, Tile, Rebar trends)
- ✅ ตัวอย่างคำนวณงานกระเบื้อง + คอนกรีต
- ✅ กราฟเปรียบเทียบราคา 6 แหล่ง

---

**🎯 รันได้ครบ = Showcase พร้อมใช้งาน!**
