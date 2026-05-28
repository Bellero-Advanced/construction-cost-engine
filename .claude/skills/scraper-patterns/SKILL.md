---
name: scraper-patterns
description: Templates and pitfalls for adding a new price source under `src/lib/scrapers/`.
---

# Scraper Patterns

## Tier order
1. Provider JSON API.
2. ScrapingBee free tier (residential proxy, ~1k req/mo).
3. Cloudflare Browser Rendering (puppeteer-style, paid).
4. AI-estimated from CGD × multiplier.

## Worker compatibility checklist
- [ ] No `runtime = "edge"` in route file.
- [ ] Heavy module (`unpdf`, `xlsx`, `puppeteer`) loaded via `await import("…")` inside the function.
- [ ] All `fetch()` wrapped in try/catch with 20s `AbortSignal.timeout(20_000)`.
- [ ] Returns `{ ok: true, data } | { ok: false, error }` (no thrown errors out of the scraper).
- [ ] Writes to `PRICES_KV` with explicit `expirationTtl`.

## Skeleton
```ts
// src/lib/scrapers/<source>.ts
export async function scrape<Source>(
  material: MaterialId,
  province: ProvinceCode,
  env: CloudflareEnv,
): Promise<{ price: number; fetchedAt: string } | null> {
  const cacheKey = `<source>:${material}:${province}`;
  const cached = await env.PRICES_KV.get(cacheKey, "json");
  if (cached) return cached as any;

  try {
    const res = await fetch(buildUrl(material, province), {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": "construction-cost-engine/1.0" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const price = parsePrice(json);
    const out = { price, fetchedAt: new Date().toISOString() };
    await env.PRICES_KV.put(cacheKey, JSON.stringify(out), {
      expirationTtl: 30 * 24 * 3600,
    });
    return out;
  } catch {
    return null;
  }
}
```

## Pitfalls (incidents we've hit)
- **Top-level `import` of `unpdf`** crashes Worker module graph. Always lazy.
- **`localeCompare` on filenames** ranks `cmi_oct_2019.pdf` above `CMI Report Oct 2026.pdf`. Parse year/month numerically.
- **PDF metadata vs body** — TPSO URL says `March_2027` but body says `มีนาคม 2568`. Trust body, not URL.
- **moc-price.moc.go.th** egress-blocked from Workers (DIT). Manual upload via admin endpoint.

## After adding
- Append a row in `.claude/memory/experiments.md`.
- Add the source to `src/data/sources.ts` with brand color + multiplier.
