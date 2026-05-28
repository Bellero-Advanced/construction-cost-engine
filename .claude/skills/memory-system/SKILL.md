---
name: memory-system
description: How to read and write the `.claude/memory/` files for this project.
---

# Memory System

## Files
- `active.md` — what's being worked on right now + next step. Overwrite OK.
- `architecture.md` — directory layout, data flow, KV schema, deploy. Update only when structure moves.
- `decisions.md` — frozen choices (no backend, Recharts only, no `runtime=edge`, …). Append-only.
- `changelog.md` — one line per concrete change + commit SHA. Append-only.
- `experiments.md` — scraper attempts table. Append-only.

## Read order at session start
1. `MEMORY.md` (root) — single-line index of project state.
2. `CLAUDE.md` (root) — rules, commands, prohibitions.
3. `.claude/memory/active.md` — what was being worked on.
4. `.claude/memory/decisions.md` — frozen choices to honor.

## Write rules
- Never overwrite `decisions.md` or `changelog.md`. Append only.
- Be factual. No "I think we should…". Only what was decided/changed.
- Include commit SHAs when available (`git rev-parse --short HEAD`).
- If memory and the repo disagree, the **repo wins** — fix memory.
