/**
 * GET /api/regional/[material]?source=cgd
 * Aggregates province-level prices into 6 Thai regions.
 * Returns: { region: string, provinces: number, mean, median, min, max }[]
 */
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { MATERIALS } from "@/data/materials";
import { PROVINCES } from "@/data/provinces";

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ material: string }> },
) {
  const { material } = await params;
  if (!MATERIALS[material]) {
    return NextResponse.json({ error: "unknown material" }, { status: 400 });
  }
  const url = new URL(req.url);
  const source = url.searchParams.get("source") ?? "cgd";

  const ctx = await getCloudflareContext({ async: true });
  const kv = (ctx?.env as CloudflareEnv | undefined)?.PRICES_KV;
  if (!kv)
    return NextResponse.json({ error: "KV unavailable" }, { status: 503 });

  // Group provinces by region
  const byRegion = new Map<string, number[]>();
  await Promise.all(
    PROVINCES.map(async (p) => {
      const key = `${source}:${material}:${p.id}`;
      const v = await kv.get<CacheEntry>(key, "json");
      if (v?.price != null) {
        const arr = byRegion.get(p.region) ?? [];
        arr.push(v.price);
        byRegion.set(p.region, arr);
      }
    }),
  );

  const regions = Array.from(byRegion.entries())
    .map(([region, prices]) => ({
      region,
      provinces: prices.length,
      mean: +(prices.reduce((s, x) => s + x, 0) / prices.length).toFixed(2),
      median: median(prices),
      min: Math.min(...prices),
      max: Math.max(...prices),
    }))
    .sort((a, b) => b.mean - a.mean);

  return NextResponse.json(
    { material, materialName: MATERIALS[material].name, source, regions },
    {
      headers: {
        "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
