import { NextResponse } from "next/server";
import { getLivePrice } from "@/lib/livePrice";
import { enforceRateLimit } from "@/lib/rateLimit";
import { MATERIALS } from "@/data/materials";
import { SOURCES } from "@/data/sources";
import { PROVINCES } from "@/data/provinces";
import type { SourceKey } from "@/types";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ source: string; material: string }> },
) {
  const { source, material } = await ctx.params;
  const url = new URL(_req.url);
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

  const blocked = await enforceRateLimit(_req, source);
  if (blocked) return blocked;

  const result = await getLivePrice(source as SourceKey, material, provinceId);
  return NextResponse.json(result, {
    headers: {
      "cache-control": `public, s-maxage=${Math.min(result.ttlSec, 60 * 60 * 24 * 7)}, stale-while-revalidate=600`,
    },
  });
}
