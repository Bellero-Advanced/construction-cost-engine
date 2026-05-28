---
description: Project-specific shortcuts for construction-cost-engine
---

# /cce

Use these slash-style hints when chatting:

- `/cce add-source <name>` — invoke `scraper-engineer` with the new-source template + register in `src/data/sources.ts` + add `experiments.md` row.
- `/cce add-material <id>` — update `src/data/materials.ts` + `prices.ts` + `trends.ts` + `messages/th.json` + relevant calculator.
- `/cce add-page <route>` — invoke `frontend-builder` to scaffold `src/app/[locale]/<route>/page.tsx` with Doc-card aesthetic.
- `/cce refresh-tpso` — guide to POST `/api/admin/refresh-prices?source=tpso` with `ADMIN_REFRESH_TOKEN`.
- `/cce deploy` — invoke `deploy-operator`: typecheck → lint → build → push.
- `/cce session-end` — invoke `memory-keeper` to update `active.md` + append `changelog.md`.
