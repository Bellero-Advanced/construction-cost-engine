/**
 * GET /api/history/[source]/[material]?province=10
 * Returns the KV time-series captured by /api/admin/snapshot-history.
 */

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { MATERIALS } from "@/data/materials";
import { SOURCES } from "@/data/sources";
import { PROVINCES } from "@/data/provinces";

export const revalidate = 1800; // 30 min

interface HistoryEntry {
  date: string;
  price: number;
}

async function getKv(): Promise<KVNamespace | undefined> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.env as CloudflareEnv | undefined)?.PRICES_KV;
  } catch {
    return undefined;
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ source: string; material: string }> },
) {
  const { source, material } = await ctx.params;
  const url = new URL(req.url);
  const provinceId = Number(url.searchParams.get("province") ?? "10");

  if (!SOURCES[source]) {
    return NextResponse.json({ error: "unknown source" }, { status: 404 });
  }
  if (!MATERIALS[material]) {
    return NextResponse.json({ error: "unknown material" }, { status: 404 });
  }
  if (!PROVINCES.find((p) => p.id === provinceId)) {
    return NextResponse.json({ error: "unknown province" }, { status: 404 });
  }

  const kv = await getKv();
  if (!kv) {
    return NextResponse.json({ source, material, provinceId, series: [] });
  }

  const key = `history:${source}:${material}:${provinceId}`;
  const series = (await kv.get<HistoryEntry[]>(key, "json")) ?? [];
  return NextResponse.json(
    { source, material, provinceId, series },
    {
      headers: {
        "cache-control": "public, s-maxage=1800, stale-while-revalidate=300",
      },
    },
  );
}
