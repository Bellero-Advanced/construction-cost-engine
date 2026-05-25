# construction-cost-engine — Source Code Guide

ระบบอัตโนมัติสำหรับการคำนวณต้นทุนต่อหน่วยของวัสดุก่อสร้าง
รวบรวมราคาจาก 11 แหล่ง (3 ภาครัฐ + 8 Modern Trade) ครอบคลุม 27 วัสดุ 77 จังหวัด

## โครงสร้างโฟลเดอร์หลัก

```
src/
├── app/              Next.js App Router — หน้าเว็บและ API endpoints
│   ├── [locale]/     หน้าเว็บสาธารณะ (รองรับ th/en)
│   └── api/          REST API endpoints ทั้งหมด
├── components/       React components ที่ใช้ซ้ำ
├── data/             ข้อมูล static (วัสดุ, แหล่ง, จังหวัด)
├── lib/              Business logic หลัก
│   ├── scrapers/     ตัวดึงข้อมูลราคาจากแต่ละแหล่ง
│   ├── stats/        การวิเคราะห์เชิงสถิติ
│   └── units/        การแปลงหน่วย
├── messages/         ข้อความ i18n (th.json, en.json)
└── types/            TypeScript type definitions
```

## Stack เทคโนโลยี

| ส่วน | เทคโนโลยี | เหตุผล |
|------|-----------|--------|
| Framework | Next.js 16 (App Router) | Server-side rendering, edge runtime |
| Language | TypeScript (strict) | Type safety, ลด runtime errors |
| Styling | Tailwind CSS 4 | Utility-first, ไม่ต้องเขียน CSS |
| Database | Cloudflare KV | Key-value lookup < 20ms ทั่วโลก |
| Hosting | Cloudflare Workers | Edge runtime, 0 cold start |
| PDF Parsing | unpdf (WASM) | รัน Workers ได้, ไม่ต้อง OCR |
| Scraping | ScrapingBee + Puppeteer | Bypass bot challenge |

## Live URL

https://construction-cost-engine.steep-tooth-c420.workers.dev
