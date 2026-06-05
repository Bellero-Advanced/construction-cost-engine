# 🏗️ Construction Cost Engine - Showcase Package

**Index ของไฟล์ทั้งหมด สำหรับ demo โปรเจค**

---

## 📦 Files Overview

| File | Size | Description |
|------|------|-------------|
| `showcase_complete.ipynb` | 10K | 🎯 **Main Jupyter Notebook** - รันไฟล์นี้ |
| `showcase_data.py` | 8.5K | 📊 Data module (materials, sources, calculators) |
| `demo.py` | - | ⚡ Quick demo script (รันใน terminal) |
| `SHOWCASE.md` | 2.5K | 📖 Project documentation |
| `SHOWCASE_README.md` | 2K | 📋 Quick start guide |
| `SHOWCASE_INDEX.md` | - | 📑 This file |

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install dependencies
pip install jupyter pandas matplotlib seaborn tabulate

# 2a. Run Jupyter Notebook (recommended)
jupyter notebook showcase_complete.ipynb

# OR 2b. Run quick demo in terminal
python3 demo.py
```

---

## 📊 What You'll See

### In Jupyter Notebook (`showcase_complete.ipynb`)

1. **Setup** - Install & import libraries
2. **Data Overview** - 27 materials, 11 sources, 10 provinces
3. **Price Data** - Base prices table
4. **Trends** - 3 charts (Cement, Tile, Rebar) over 11 months
5. **Calculator A** - Wall Tile (25.5 sqm demo)
6. **Calculator B** - Concrete (2.5 cu.m. demo)
7. **Visualization** - Source comparison chart
8. **Summary** - Complete recap

### In Terminal Demo (`demo.py`)

- Data overview
- Sample materials with prices
- Data sources list
- Wall tile calculator demo
- Concrete calculator demo
- Price trends analysis
- Next steps

---

## 🎯 Expected Results

### Calculator Outputs

**Wall Tile (25.5 sqm)**
- กระเบื้อง: 26.78 ตร.ม. @ 215 THB = 5,756.63 THB
- ปูนกาว: 6.38 ถุง @ 165 THB = 1,051.88 THB
- ปูนยาแนว: 7.65 ถุง @ 38 THB = 290.70 THB
- **Total**: 7,099.20 THB (278.40 THB/sqm)

**Concrete (2.5 cu.m.)**
- ปูนซีเมนต์: 17.5 ถุง @ 179.45 THB = 3,140.38 THB
- ทราย: 1.25 ลบ.ม. @ 480 THB = 600.00 THB
- หิน: 2.5 ลบ.ม. @ 520 THB = 1,300.00 THB
- **Total**: 5,040.38 THB (2,016.15 THB/cu.m.)

---

## 📈 Data Coverage

### Materials (27 total, 9 in demo)
- กระเบื้อง (Tiles): 2 types
- ปูน (Cement/Adhesive): 2 types
- ทราย/หิน (Sand/Rock): 2 types
- เหล็กเสริม (Rebar): 7 sizes (RB6-DB25)
- อื่น ๆ (Wire, Wood, Paint, Brick, Concrete)

### Data Sources (11 total, 6 in demo)
- **Government**: TPSO, CGD, DIT
- **Retail**: HomePro, Global House, Thai Watsadu, BnB Home, SCG Home, Dohome, MegaHome, Boonthavorn

### Provinces (10 total, 8 in demo)
- กลาง: กทม./ปริมณฑล, นครสวรรค์, ราชบุรี
- เหนือ: เชียงใหม่, อุตรดิตถ์
- อีสาน: นครราชสีมา, ขอนแก่น
- ตะวันออก: ชลบุรี
- ใต้: นครศรีธรรมราช, สงขลา

---

## 🔧 API Examples

### Import Data

```python
from showcase_data import (
    MATERIALS,      # Dict of 9 materials
    SOURCES,        # Dict of 6 sources
    PROVINCES,      # List of 8 provinces
    BASE_PRICES,    # Dict of prices
    TRENDS,         # Dict of 11-month trends
    MONTH_LABELS    # List of month labels
)
```

### Use Calculators

```python
from showcase_data import calc_wall_tile, calc_concrete, BASE_PRICES

# Wall Tile
result = calc_wall_tile(
    area=25.5,
    tile_price=BASE_PRICES['TILE_001'],
    adhesive_price=BASE_PRICES['ADHESIVE_001'],
    grout_price=BASE_PRICES['GROUT_001']
)
# result['total'] = 7099.20 THB

# Concrete
result = calc_concrete(
    volume=2.5,
    cement_price=BASE_PRICES['CEMENT_001'],
    sand_price=BASE_PRICES['SAND_001'],
    rock_price=BASE_PRICES['ROCK_001']
)
# result['total'] = 5040.38 THB
```

---

## 🌐 Full Web Application

หากต้องการรันระบบเว็บเต็มรูปแบบ:

```bash
cd construction-cost-engine/
npm install
npm run dev
```

เปิดเบราว์เซอร์: http://localhost:3000

**Features:**
- 🏗️ 3 calculators (Wall Tile, Concrete, Rebar)
- 📊 Compare prices across 11 sources
- 🗺️ Compare 10 provinces
- 📈 11-month trend charts
- 🎨 Ink & Paper blueprint design

---

## ✅ Validation Checklist

### After Running Notebook

- ✅ Loaded 9 materials, 6 sources, 8 provinces
- ✅ Displayed materials/sources/provinces tables
- ✅ Showed base prices for 9 items
- ✅ Generated 3 trend charts (Cement, Tile, Rebar)
- ✅ Calculated wall tile cost (25.5 sqm) = 7,099.20 THB
- ✅ Calculated concrete cost (2.5 cu.m.) = 5,040.38 THB
- ✅ Generated source comparison chart (6 sources)
- ✅ Displayed summary

### After Running demo.py

- ✅ Data overview printed
- ✅ Sample materials shown (3 items)
- ✅ Data sources listed (6 sources)
- ✅ Wall tile demo complete
- ✅ Concrete demo complete
- ✅ Price trends shown (2 materials)
- ✅ Next steps displayed

---

## 🐛 Troubleshooting

### Module not found

```bash
# Make sure showcase_data.py is in the same folder
ls showcase_data.py

# If missing, the file should be in the same directory as the notebook
```

### Import errors

```bash
# Reinstall dependencies
pip install --upgrade pandas matplotlib seaborn tabulate jupyter
```

### Notebook won't start

```bash
# Try alternative method
jupyter lab showcase_complete.ipynb

# Or use VS Code with Python extension
```

---

## 📧 Support & Credits

**Project**: Construction Cost Engine  
**Purpose**: Senior Project / Thesis Demo  
**Tech Stack**: Next.js 16, TypeScript, React 19, Tailwind CSS 4  
**Design**: Ink & Paper blueprint aesthetic  
**Adapted from**: Factory Landing's Korn framework

---

## 🎯 Success Criteria

**Showcase is ready when:**
- ✅ `demo.py` runs without errors
- ✅ `showcase_complete.ipynb` runs all cells successfully
- ✅ All calculators produce correct results
- ✅ Charts display properly
- ✅ Documentation is clear

---

**🏗️ Happy Building!**
