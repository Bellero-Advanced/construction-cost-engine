---
name: i18n-discipline
description: How to keep all UI strings localized via `next-intl` for TH (and future EN/ZH).
---

# i18n Discipline

## Rules
1. Every visible string in JSX comes from `useTranslations()` or `getTranslations()`.
2. Inline formatting uses `t.rich`, never `dangerouslySetInnerHTML`.
3. Numbers/dates use `useFormatter()` so locale-correct.
4. Keys are dotted, namespaced by feature: `home.hero.title`, `compare.summary.spread`.

## Adding a new string
1. Add key to `src/messages/th.json` (primary).
2. Use in component:
   ```tsx
   const t = useTranslations("compare");
   return <h2>{t("title")}</h2>;
   ```
3. For HTML-style: `t.rich("body", { strong: (chunks) => <strong>{chunks}</strong> })`.
4. When EN/ZH come online, mirror keys; missing keys fall back to TH (configured in `i18n.ts`).

## Locale routing
`middleware.ts` uses `localePrefix: "as-needed"` — `/` is TH, `/en/...` is EN. Pages live under `src/app/[locale]/`.
