# CLAUDE.md

## Project Identity

**Construction Cost Engine** — ระบบคำนวณต้นทุนวัสดุก่อสร้างต่อหน่วย (Demo/Prototype)

- **Scope:** Static calculator for construction material cost estimation
- **Design:** Ink & Paper blueprint theme, Amber accents
- **Data:** Mock data from 6 sources (TPSO, CGD, HomePro, Global House, Thai Watsadu, BnB Home)
- **Auth:** None — public demo
- **Adapted from:** Factory Landing's Korn framework (same agents/skills, different stack)

## Commands

```bash
npm install          # Install deps
npm run dev          # Dev server on localhost:3000
npm run build        # Production build
npm run build:worker # Build for Cloudflare Workers (.open-next/)
npm run deploy       # Deploy to Cloudflare Workers
npm run lint         # ESLint
npm run typecheck    # TypeScript check (tsc --noEmit)
```

## Stack

Next.js 16 (App Router) · TypeScript (strict) · React 19 · Tailwind CSS 4 (inline `@theme`) · Recharts · next-intl (TH; architected for EN/ZH) · Cloudflare Workers via `@opennextjs/cloudflare`

**Path alias:** `@` → `./src`. Always use `@/` imports.

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx       # Bare root (returns children)
│   ├── globals.css      # Tailwind v4 inline @theme (all color/font tokens here)
│   └── [locale]/        # Locale-scoped pages
│       ├── layout.tsx   # Header + main + Footer + NextIntlClientProvider
│       ├── page.tsx     # Home
│       ├── wall-tile/   # Calculator A
│       ├── column-beam/ # Calculator B
│       ├── rebar/       # Calculator C
│       ├── compare/     # 10-province comparison
│       ├── stores/      # 6-source comparison
│       ├── trend/       # 12-month trends
│       └── sources/     # Source detail viewer
├── components/
│   ├── ui/              # Button, Doc, Badge, Field, Stat (primitives)
│   ├── layout/          # Header, Footer
│   └── calculator/      # CalculatorResult, Selectors
├── data/                # sources, materials, provinces, prices (mock TS)
├── lib/                 # pricing, calculators, utils
├── types/               # Shared TypeScript types
├── messages/            # i18n JSON (th.json)
├── i18n.ts              # next-intl request config
└── middleware.ts        # locale routing (localePrefix: "as-needed")
```

## Core Rules

1. **Client Components are fine.** This is a demo — most calculators + charts need `"use client"`.
2. **Tailwind 4 inline `@theme`.** All design tokens live in `src/app/globals.css`. No `tailwind.config.ts`.
3. **i18n mandatory.** All UI text via `next-intl`. Use `t.rich` for HTML-style formatting — never inject raw HTML.
4. **TypeScript strict.** No `any`. No `@ts-ignore`. Build skips TS check via `ignoreBuildErrors: true` for memory reasons — run `npm run typecheck` separately.
5. **Mock data only.** All prices/materials live in `src/data/`. New material → add to `materials.ts` + `prices.ts` + `trends.ts`.
6. **Deterministic pricing.** `getPrice(source, material, province)` uses material-seeded variation — same inputs always give same output.
7. **Recharts only.** Do not add Chart.js. Wrap all charts in `<ResponsiveContainer>` inside a fixed-height parent.
8. **Handle all UI states.** Loading, empty (placeholder), result.

## Coding Standards

- Prettier: single quotes inside JSX, semicolons, trailing commas, ~100 char, 2-space indent
- Naming: PascalCase (components/types), camelCase (functions/vars), UPPER_SNAKE_CASE (material IDs like `REBAR_DB12`)
- Imports: `@/` alias. Group: React → third-party → `@/` internal
- Components: Functional only. Props via interface. Default export for pages, named for reusable.

## Color Palette (Ink & Paper)

```
Background body:  paper #f5f1e8 (cream) with amber dot-grid
Card paper:       paper #f5f1e8
Card tint:        paper-2 #ede5d3
Text primary:     ink #0a1628
Text secondary:   ink-2 #11253f
Text muted:       ink-3 #1a3556
Dashed dividers:  line #2a4769
Primary accent:   amber #d97706
Highlight:        amber-bright #f59e0b
Semantic:         green #4d7c0f / red #991b1b / teal #0e7c7b / rust #b94d2c

Source brands:
TPSO #1a3556  CGD #b94d2c  HomePro #e30613
GlobalHouse #f37021  ThaiWatsadu #009a3d  BnB #003a70
```

## Document Aesthetic

Every major section is wrapped in a `<Doc tag="...">` card:
- 1.5px ink border + 5px hard offset shadow (no soft drop-shadow)
- Top-right `doc-tag` in mono uppercase (e.g. `DOC-001 / OVERVIEW`)
- Headings use `font-display` (Bebas Neue) with `▌` prefix
- Numbers/IDs/units use `font-mono` (JetBrains Mono)
- Hover lift: `hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_var(--color-ink)]`

## Deploy

- Worker name: `construction-cost-engine`
- Custom domain: TBD
- CI/CD: `.github/workflows/deploy.yml` — typecheck → build → deploy on push to `main`
- Required secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Do Not

1. Do not add a backend — this is static demo with mock data.
2. Do not add Chart.js — Recharts only.
3. Do not hardcode UI text — use `next-intl`.
4. Do not inject raw HTML strings — use `t.rich` for inline formatting.
5. Do not create a `tailwind.config.ts` — tokens live in `globals.css` `@theme`.
6. Do not skip placeholder/result/error states.
7. Do not use `service_role`-style admin keys.

## References

- Korn integration: `.korn/integration-summary.md`
- Engineering rules: `.claude/rules/engineering.md`
- Session continuity: `.claude/rules/session-continuity.md`
- Memory: `MEMORY.md`
- Adapted from: `../factory-landing/`

## .claude/ Architecture

- **Rules:** `.claude/rules/{engineering,session-continuity,reproducibility,scraper-discipline}.md`
- **Memory:** `.claude/memory/{active,architecture,decisions,changelog,experiments}.md`
- **Agents:** `.claude/agents/{plan-orchestrator,frontend-builder,scraper-engineer,api-designer,deploy-operator,memory-keeper}.md`
- **Skills:** `.claude/skills/{memory-system,scraper-patterns,cloudflare-workers,i18n-discipline,kv-cache-strategy,nextjs-16-discipline}/SKILL.md`
- **Commands:** `.claude/commands/cce.md`
- **Settings:** `.claude/settings.json` (allow/deny + timeouts)

Read order at session start: `MEMORY.md` → `CLAUDE.md` → `.claude/memory/active.md` → `.claude/memory/decisions.md`.
