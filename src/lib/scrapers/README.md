# src/lib/scrapers/

## หน้าที่
ตัวดึงข้อมูลราคา (Price Providers) สำหรับแต่ละแหล่ง — แต่ละไฟล์ export `PriceProvider` object ที่มี `fetch(materialId, provinceId)` method

## สถาปัตยกรรม

```
_headless.ts      ← Cloudflare Browser Rendering (Puppeteer)
_retail.ts        ← Generic retail scraper factory (ใช้ ScrapingBee + headless)
_scrapingbee.ts   ← ScrapingBee API wrapper + price extraction utilities
_suggestJsp.ts    ← HomePro/MegaHome JSON API wrapper

tpso.ts           ← TPSO CMI PDF parser
cgd.ts            ← CGD PDF parser (anti-bot)
dit.ts            ← DIT JSON API
homepro.ts        ← HomePro (suggestJsp)
megahome.ts       ← MegaHome (suggestJsp)
boonthavorn.ts    ← Boonthavorn (Magento GraphQL)
globalhouse.ts    ← Global House (makeRetailProvider)
thaiwatsadu.ts    ← Thai Watsadu (makeRetailProvider)
bnb.ts            ← BnB Home (makeRetailProvider)
scghome.ts        ← SCG Home (makeRetailProvider)
dohome.ts         ← Dohome (makeRetailProvider)
```

## ไฟล์ Base Helpers

### `_headless.ts` — Cloudflare Browser Rendering
เปิด headless Chrome ใน Cloudflare Workers ผ่าน `@cloudflare/puppeteer`
- `headlessScrape(url, waitForSelector, extract)` — navigate + extract DOM
- `materialQuery(materialId)` — สร้าง search query จาก material searchTerms

### `_scrapingbee.ts` — ScrapingBee Proxy
ส่ง request ผ่าน residential proxy เพื่อหลีกเลี่ยง bot challenge
- `fetchViaScrapingBee(opts)` — เรียก ScrapingBee API
- `extractPricesFromHtml(html)` — regex สกัดตัวเลขราคาจาก HTML
- `extractNamedPricesFromJsonLd(html)` — สกัดราคาจาก JSON-LD structured data
- `pickPriceForMaterial(items, material)` — เลือกราคาที่ตรงกับ canonical spec
- `median(prices)` — คำนวณ median ของราคาที่พบ

### `_suggestJsp.ts` — HomePro/MegaHome JSON API
เรียก `/service/search/suggest.jsp?q={keyword}` โดยตรง (ไม่ต้อง browser)
- `makeSuggestJspProvider(config)` — factory สร้าง provider
- ใช้ 3-tier token matching: must tokens (size) → nice tokens (brand) → median fallback

### `_retail.ts` — Generic Retail Factory
สร้าง provider สำหรับ SPA retail sites ที่ต้องใช้ ScrapingBee
- `makeRetailProvider(config)` — factory รับ urlTemplate + CSS selectors
- ลำดับ fallback: ScrapingBee JSON-LD → ScrapingBee regex → Headless Browser

## ไฟล์ Scrapers รายแหล่ง

### `tpso.ts` — TPSO CMI Index
- ดึง PDF report จาก `tpso.go.th`
- Parse ด้วย `unpdf` (WASM PDF parser)
- สกัด CMI index value + report period
- **หมายเหตุ:** TPSO ให้แค่ index ไม่ใช่ราคารายวัสดุ — `tpsoProvider.fetch()` return `null` เสมอ, ราคาคำนวณจาก `CGD × (CMI/baseline)`

### `cgd.ts` — กรมบัญชีกลาง
- ดึง PDF rate report จาก `cgd.go.th`
- Parse ตาราง HTML ด้วย regex
- มีระบบ auto-discover URL ล่าสุด

### `dit.ts` — กรมการค้าภายใน
- เรียก JSON API ของ `price.moc.go.th`
- ส่งคืนราคาตลาดรายวัน

### `boonthavorn.ts` — บุญถาวร (Magento GraphQL)
```typescript
// เรียก GraphQL โดยตรง — ไม่ต้องใช้ ScrapingBee
const r = await fetch("https://www.boonthavorn.com/graphql", {
  method: "POST",
  body: JSON.stringify({ query: `{ products(search: "${q}" pageSize: 10) { ... } }` })
})
```
- `pickBestPrice()` — เลือกราคาที่ตรงกับ canonical size ก่อน, fallback เป็น median

### `homepro.ts` / `megahome.ts`
ใช้ `makeSuggestJspProvider` — เรียก JSON API โดยตรง ไม่ต้อง browser

### `globalhouse.ts`, `thaiwatsadu.ts`, `bnb.ts`, `scghome.ts`, `dohome.ts`
ใช้ `makeRetailProvider` — ScrapingBee proxy + CSS selector extraction
