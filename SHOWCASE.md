# Construction Cost Engine - Showcase

## 📋 Project Overview

**Construction Cost Engine** คือระบบคำนวณต้นทุนวัสดุก่อสร้างต่อหน่วย (Demo/Prototype)

### Key Features

- 🏗️ **3 ตัวคำนวณหลัก**: งานกระเบื้อง, งานคอนกรีต, งานเหล็กเสริม
- 📊 **11 แหล่งข้อมูลราคา**: TPSO, CGD, DIT + 8 ห้างค้าปลีก
- 🗺️ **10 จังหวัด**: ครอบคลุมทุกภูมิภาคของไทย
- 📈 **Historical Trends**: ติดตามแนวโน้มราคา 11 เดือน
- 🎨 **Ink & Paper Design**: Blueprint theme

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

เปิด http://localhost:3000

---

## 📦 Data Structure

### Materials (27 รายการ)

| Category | Count | Examples |
|----------|-------|----------|
| กระเบื้อง | 2 | TILE_001, TILE_002 |
| เหล็กเสริม | 7 | REBAR_DB12, REBAR_DB16 |
| คอนกรีต | 2 | CONCRETE_240, CONCRETE_280 |
| สี | 3 | PAINT_INT_001, PRIMER_001 |

### Sources (11 แหล่ง)

**Government**: TPSO, CGD, DIT  
**Retail**: HomePro, Global House, Thai Watsadu, BnB, SCG Home, Dohome, MegaHome, Boonthavorn

### Provinces (10 จังหวัด)

กทม., เชียงใหม่, นครราชสีมา, ขอนแก่น, ชลบุรี, ราชบุรี, นครศรีธรรมราช, สงขลา, นครสวรรค์, อุตรดิตถ์

---

## 💻 Technical Stack

- Next.js 16 + TypeScript (strict)
- React 19 + Tailwind CSS 4
- Recharts + next-intl
- Cloudflare Workers

---

## 📊 Example Usage

### Calculate Wall Tile Cost

```typescript
import { calcWallTile, loadLivePrices } from '@/lib/calculators';

const prices = await loadLivePrices('homepro', ['TILE_001', 'ADHESIVE_001'], 10);
const result = calcWallTile('homepro', 10, 25.5, 'TILE_001', prices);
```

### Get Live Price

```typescript
import { getLivePrice } from '@/lib/livePrice';

const result = await getLivePrice('tpso', 'CEMENT_001', 10);
// { price: 179.45, live: true, available: true }
```

---

## 📝 Development

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run deploy       # Deploy to Cloudflare
```
