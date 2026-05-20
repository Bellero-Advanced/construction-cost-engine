import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { readTpsoIndex, TPSO_CMI_BASELINE } from "@/lib/scrapers/tpso";

export const runtime = "edge";

export async function GET() {
  let kv: KVNamespace | undefined;
  try {
    const ctx = await getCloudflareContext({ async: true });
    kv = (ctx?.env as { PRICES_KV?: KVNamespace } | undefined)?.PRICES_KV;
  } catch {
    /* ignore */
  }

  const snap = await readTpsoIndex(kv);

  if (!snap) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "no snapshot in KV — POST /api/admin/refresh-prices to populate (or wait for the weekly cron)",
        baseline: TPSO_CMI_BASELINE,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      baseline: TPSO_CMI_BASELINE,
      ratio: Math.round((snap.index / TPSO_CMI_BASELINE) * 10000) / 10000,
      ...snap,
    },
    {
      headers: {
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    },
  );
}
