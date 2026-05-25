# src/middleware.ts

## หน้าที่
Next.js middleware — รันก่อนทุก request เพื่อจัดการ i18n routing

## การทำงาน

```
Request: /compare-sources
         ↓
Middleware: ตรวจ locale จาก cookie/Accept-Language header
         ↓
Redirect: /th/compare-sources  (ถ้า locale = th)
       หรือ /en/compare-sources  (ถ้า locale = en)
```

## Config
```typescript
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
  // ข้าม: /api/*, /_next/*, ไฟล์ static (*.png, *.js)
}
```

ใช้ `next-intl/middleware` เพื่อ detect locale และ redirect อัตโนมัติ

---

# src/i18n.ts

## หน้าที่
Config สำหรับ next-intl — กำหนด locales ที่รองรับและ default locale

```typescript
export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}))
```

---

# src/messages/

## หน้าที่
ไฟล์ข้อความ i18n สำหรับ UI text ทั้งหมด

| ไฟล์ | ภาษา |
|------|------|
| `th.json` | ภาษาไทย (default) |
| `en.json` | ภาษาอังกฤษ |

**ตัวอย่าง:**
```json
{
  "nav": { "compare": "เปรียบเทียบราคา", "trend": "แนวโน้ม" },
  "health": { "title": "สุขภาพข้อมูล", "fresh": "สด" }
}
```
