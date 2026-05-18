# Engineering Rules

## Code Discipline
- Read affected files before editing. Check for existing patterns before creating new ones.
- Client Components OK — this is a static demo with client-side calculations and charts.
- All public text via `next-intl` (TH). Architectured for future EN/ZH expansion.
- Handle all UI states: loading, empty, error, populated.
- Animations respect `prefers-reduced-motion`.
- Build must pass (`npm run build`) with zero TS errors and zero lint warnings.

## Naming
- Files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Components: PascalCase — `CalculatorResult.tsx`, `Header.tsx`
- DB-style helpers: `lib/{pricing,calculators,utils}.ts`
- Types: `types/index.ts` | Imports: `@/` alias (→ `./src/*`)

## Data Discipline
- All prices/materials/sources are mock data in `src/data/`
- Deterministic pricing via `getPrice(source, material, province)` — no randomness
- New material → add to `materials.ts` + `prices.ts` + `trends.ts`
- New source → add to `sources.ts` with brand color + multiplier

## Charts
- Recharts only (NOT Chart.js)
- All chart components must be `"use client"`
- Wrap in `<ResponsiveContainer>` with fixed-height parent
- Use shared color tokens from globals.css

## Agents
- Parallel agents for independent tasks only. Sequential for dependent chains.
- Use `isolation: "worktree"` for multi-file changes that could conflict.
- Keep CLAUDE.md under 300 lines. Heavy detail goes in rules/skills/memory.
