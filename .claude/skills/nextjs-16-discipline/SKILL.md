---
name: nextjs-16-discipline
description: Next.js 16 App Router conventions — read this before writing any route, layout, or page.
---

# Next.js 16 Discipline

> Next.js 16 has breaking changes from older versions. **Read `node_modules/next/dist/docs/` before assuming an API exists.**

## App Router rules
- Pages live under `src/app/[locale]/<route>/page.tsx` (locale-scoped).
- Layouts: `layout.tsx`. The locale layout owns `NextIntlClientProvider`.
- Loading UI: `loading.tsx`. Error UI: `error.tsx` (must be `"use client"`).
- Route handlers: `src/app/api/<path>/route.ts` exporting `GET`/`POST`/etc.

## Client vs Server
- Default to **Server Components**. Add `"use client"` only when the file uses hooks, browser APIs, or Recharts.
- Calculators that update on input → `"use client"`.
- Static doc cards → server.

## What NOT to do
- Do not set `export const runtime = "edge"` on routes that use `getCloudflareContext()` — breaks OpenNext bundle (see decisions.md).
- Do not write to `tailwind.config.ts` — Tailwind v4 inline `@theme` only.
- Do not import a `pages/` directory — App Router only.

## Build constraints
- `next.config.ts` sets `typescript.ignoreBuildErrors: true` (memory pressure on Worker bundle). Run `npm run typecheck` separately and keep it clean.
