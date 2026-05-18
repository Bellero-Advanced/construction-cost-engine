# Korn Framework — Construction Cost Engine Integration

**Date:** 2026-05-19
**Status:** Active
**Source:** Adapted from Factory Landing Korn Framework
**Project type:** Static demo + client-side calculator + Cloudflare Workers

---

## What's Different from Factory Landing

| Aspect | Factory Landing | Construction Cost Engine |
|--------|-----------------|--------------------------|
| Theme | Dark crimson (B2B SaaS) | **Light "Ink & Paper"** (blueprint) |
| Accent | `#DC2626` crimson | **`#d97706` amber** |
| Backend | Supabase (6 tables, RLS) | **None** (mock data only) |
| i18n | TH/EN/ZH | **TH only** (architectured for more) |
| Data | DB-backed | **Static TS files** in `src/data/` |
| Charts | Recharts (admin only) | **Recharts everywhere** |
| Render | SSR + ISR | **All client-side calc** + SSR shell |

The Korn skills/agents (UI builder, dev builder, design reviewer, etc.) still apply — they're just pointed at this project's stack and patterns.

---

## Design Identity (Ink & Paper)

### Color tokens (`globals.css` `@theme`)
```css
--color-ink: #0a1628;          /* Dark navy primary text */
--color-ink-2: #11253f;         /* Mid */
--color-ink-3: #1a3556;         /* Subtle */
--color-paper: #f5f1e8;         /* Cream background */
--color-paper-2: #ede5d3;       /* Card-tint */
--color-line: #2a4769;          /* Dashed divider */
--color-amber: #d97706;         /* Primary accent */
--color-amber-bright: #f59e0b;  /* Highlight */
--color-rust: #b94d2c;
--color-teal: #0e7c7b;
--color-green: #4d7c0f;
--color-red: #991b1b;
/* Source brand colors */
--color-tpso: #1a3556;
--color-cgd: #b94d2c;
--color-homepro: #e30613;
--color-globalhouse: #f37021;
--color-thaiwatsadu: #009a3d;
--color-bnb: #003a70;
```

### Typography
- Display: **Bebas Neue** (`font-display`) — for big headings, stat numbers
- Body: **IBM Plex Sans Thai** (`font-sans`) — for prose, UI
- Mono: **JetBrains Mono** (`font-mono`) — for codes, IDs, numbers, doc-tags

### Document aesthetic
- `.doc` — paper card with `5px 5px 0` hard offset shadow + 1.5px ink border
- `.doc-tag` — top-right corner tag in mono uppercase (e.g. `DOC-001 / OVERVIEW`)
- Body has a subtle 24px amber grid background

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Bare root layout (returns children)
│   ├── globals.css         # Tailwind v4 inline @theme
│   └── [locale]/
│       ├── layout.tsx      # Locale shell: Header + main + Footer + NextIntlClientProvider
│       ├── page.tsx        # Home (hero + 6 source cards + 3 category cards)
│       ├── wall-tile/page.tsx
│       ├── column-beam/page.tsx
│       ├── rebar/page.tsx
│       ├── compare/page.tsx    # 10-province comparison + Recharts bar chart
│       ├── stores/page.tsx     # 6-source comparison + Recharts bar chart + insight
│       ├── trend/page.tsx      # 12-month line chart, single or all-rebar
│       └── sources/page.tsx    # Source detail viewer with JSON sample
├── components/
│   ├── ui/                 # Button, Doc, Badge, Field/Input/Select, Stat/Th/Td
│   ├── layout/             # Header (sticky nav), Footer
│   └── calculator/         # CalculatorResult, Selectors
├── data/                   # sources.ts, materials.ts, provinces.ts, prices.ts (+ trends, colors)
├── lib/                    # pricing.ts (getPrice), calculators.ts (3 work types), utils.ts
├── types/                  # index.ts (Source, Material, Province, BomItem, CalcResult)
├── messages/               # th.json (single locale, ~150 keys)
├── i18n.ts                 # next-intl config
└── middleware.ts           # localePrefix: "as-needed"
```

---

## Deploy

| Item | Value |
|------|-------|
| Worker name | `construction-cost-engine` |
| Build | `npx opennextjs-cloudflare build` → `.open-next/` |
| Deploy | `npx opennextjs-cloudflare deploy` |
| CI/CD | `.github/workflows/deploy.yml` (typecheck → build → deploy on push to `main`) |
| Required secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

---

## Status — Phase 1 Complete

- Foundation: Next.js 16 + React 19 + Tailwind 4 inline theme + next-intl ✓
- 8 pages: home, 3 calculators, 2 comparisons, trend, sources ✓
- Recharts integration (no Chart.js) ✓
- Cloudflare Workers config + GitHub Actions CI/CD ✓
- TH messages (~150 keys), no hardcoded strings on pages ✓

## Phase 2 candidates
- EN/ZH locale expansion (data already locale-ready, just add messages)
- Real Supabase backend for stored scraped prices
- PDF/Excel export from BOM
- Mobile responsive polish (currently desktop-first)
- SEO metadata + OG image
