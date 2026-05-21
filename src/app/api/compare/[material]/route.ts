import { NextResponse } from "next/server";
import { getLivePrice } from "@/lib/livePrice";
import { MATERIALS } from "@/data/materials";
import { SOURCES, SOURCE_KEYS } from "@/data/sources";
import { PROVINCES } from "@/data/provinces";
import type { SourceKey } from "@/types";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ material: string }> },
) {
  const { material } = await ctx.params;
  const url = new URL(req.url);
  const provinceId = Number(url.searchParams.get("province") ?? "10");

  if (!MATERIALS[material]) {
    return NextResponse.json({ error: "unknown material" }, { status: 404 });
  }
  if (!PROVINCES.find((p) => p.id === provinceId)) {
    return NextResponse.json({ error: "unknown province" }, { status: 404 });
  }

  const results = await Promise.all(
    SOURCE_KEYS.map(async (k) => {
      const src = String(k) as SourceKey;
      const r = await getLivePrice(src, material, provinceId);
      return {
        source: String(k),
        sourceName: SOURCES[k].name,
        sourceType: SOURCES[k].type,
        price: r.price,
        live: r.live,
        available: r.available,
        fetchedAt: r.fetchedAt ?? null,
      };
    }),
  );

  const live = results.filter((r) => r.price != null);
  const prices = live.map((r) => r.price as number);
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const avg = prices.length
    ? prices.reduce((s, p) => s + p, 0) / prices.length
    : null;
  const median =
    prices.length > 0
      ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)]
      : null;
  const spreadPct =
    min != null && max != null && min > 0 ? ((max - min) / min) * 100 : null;

  return NextResponse.json(
    {
      material,
      materialName: MATERIALS[material].name,
      province: provinceId,
      sources: results,
      summary: {
        liveCount: live.length,
        totalSources: results.length,
        min,
        max,
        avg,
        median,
        spreadPct,
      },
    },
    {
      headers: {
        "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
