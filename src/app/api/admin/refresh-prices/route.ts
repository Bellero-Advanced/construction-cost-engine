/**
 * Phase 3 — weekly cron entry point for refreshing live prices.
 *
 * Cron schedule is defined in `wrangler.jsonc` (`triggers.crons`).
 * Currently a no-op skeleton: walks every registered PriceProvider and
 * calls `fetch()` for each (source × material × province) tuple, but the
 * PROVIDERS map in `src/lib/livePrice.ts` is empty until a real scraper
 * is wired.
 *
 * To run manually:
 *   curl -X POST https://construction-cost-engine.steep-tooth-c420.workers.dev/api/admin/refresh-prices \
 *     -H "x-admin-token: $ADMIN_REFRESH_TOKEN"
 */

import { NextResponse } from "next/server";
import { listRegisteredProviders } from "@/lib/livePrice";

export const runtime = "edge";

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  const expected = process.env.ADMIN_REFRESH_TOKEN;

  if (expected && token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const providers = listRegisteredProviders();
  if (providers.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "no providers registered — nothing to refresh",
      providers: [],
    });
  }

  // Once a provider is wired, fan-out fetch calls here:
  //   for (const key of providers) {
  //     for (const m of TOP_MATERIALS) {
  //       for (const p of TOP_PROVINCES) {
  //         await getLivePrice(key, m, p); // populates KV via cache write
  //       }
  //     }
  //   }

  return NextResponse.json({
    ok: true,
    message: `would refresh ${providers.length} provider(s)`,
    providers,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "POST with x-admin-token to refresh. Configured cron: weekly Sun 03:17 UTC (see wrangler.jsonc).",
    providers: listRegisteredProviders(),
  });
}
