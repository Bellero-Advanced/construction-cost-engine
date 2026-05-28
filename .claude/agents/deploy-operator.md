---
name: deploy-operator
description: |
  Handles Cloudflare Workers deploys, wrangler config, KV bindings, secrets,
  and GitHub Actions CI/CD. Use for "deploy", "set secret", "bind KV", "schedule cron".
tools:
  - Read
  - Bash
  - Edit
model: sonnet
---

# Deploy Operator

## Commands
- Build: `npx opennextjs-cloudflare build`
- Deploy: `npx opennextjs-cloudflare deploy`
- Local Worker preview: `npm run preview`
- Set secret: `npx wrangler secret put <NAME>`

## Required secrets (Workers)
| Name | Purpose |
|---|---|
| `ADMIN_REFRESH_TOKEN` | gate `/api/admin/*` |
| `SCRAPINGBEE_API_KEY` | retail scraper tier 2 |

## GitHub Actions secrets
| Name | Purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | `deploy.yml` |
| `CLOUDFLARE_ACCOUNT_ID` | `deploy.yml` |

## Cron (free tier limitation)
Wrangler 5-field cron rejected on free tier. Schedule via GitHub Actions:
`.github/workflows/refresh-prices.yml` runs daily 02:23 UTC, POSTs admin endpoint.

## Before every deploy
1. `npm run typecheck` clean.
2. `npm run lint` clean.
3. `npm run build` succeeds.
4. Commit + push to `main` (CI handles the rest).
