# Reproducibility Rules

This is a static demo + edge cache, not an ML pipeline — but reproducibility still matters because prices change.

## Mock prices are deterministic
`getPrice(source, material, province)` in `src/lib/pricing.ts` uses a material-seeded variation. Same inputs always yield the same output. Do not introduce `Math.random()` into pricing.

## Live prices are stamped
Every KV value carries `fetchedAt: ISO`. Every API response that comes from KV returns `live: true, fetchedAt`. Never strip these.

## Snapshot history
`history:{source}:{material}:{province}` is the audit trail. The daily cron appends one point. Don't truncate or rewrite history; only append.

## Build is deterministic
- `package-lock.json` committed.
- `wrangler.jsonc` pins all bindings + IDs.
- CI uses Node 20 (specified in `.github/workflows/deploy.yml`).
- No environment-dependent code paths in pricing logic.

## When pricing logic changes
1. Bump a comment header in `src/lib/pricing.ts` with the date + reason.
2. Append `decisions.md` if the change is structural (new tier, new fallback).
3. Note in `changelog.md` with SHA.
