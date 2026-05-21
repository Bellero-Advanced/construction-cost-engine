import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { MATERIALS } from "@/data/materials";
import { SOURCES, SOURCE_KEYS } from "@/data/sources";
import type { SourceKey } from "@/types";

export const revalidate = 60;

const DEFAULT_PROVINCE = 10;
const TTL_BY_KEY: Record<string, number> = {
  tpso: 60 * 60 * 24 * 30,
  cgd: 60 * 60 * 24 * 30,
  dit: 60 * 60 * 24 * 30,
  homepro: 60 * 60 * 24 * 14,
  globalhouse: 60 * 60 * 24 * 30,
  thaiwatsadu: 60 * 60 * 24 * 30,
  bnb: 60 * 60 * 24 * 30,
  scghome: 60 * 60 * 24 * 30,
  dohome: 60 * 60 * 24 * 30,
  megahome: 60 * 60 * 24 * 14,
};

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

interface SourceHealth {
  source: string;
  name: string;
  type: string;
  ttlSec: number;
  total: number;
  fresh: number;
  ok: number;
  stale: number;
  missing: number;
  oldestFetchedAt: string | null;
  newestFetchedAt: string | null;
}

export async function GET(req: Request) {
  const ctx = await getCloudflareContext({ async: true });
  const kv = (ctx?.env as CloudflareEnv | undefined)?.PRICES_KV;
  if (!kv) {
    return NextResponse.json({ error: "KV unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const province = Number(url.searchParams.get("province") ?? DEFAULT_PROVINCE);
  const materialIds = Object.keys(MATERIALS);
  const now = Date.now();

  const perSource: SourceHealth[] = await Promise.all(
    SOURCE_KEYS.map(async (k) => {
      const src = String(k) as SourceKey;
      const ttlSec = TTL_BY_KEY[src] ?? 86400;
      const ttlMs = ttlSec * 1000;

      let fresh = 0,
        ok = 0,
        stale = 0,
        missing = 0,
        oldest: number | null = null,
        newest: number | null = null;

      await Promise.all(
        materialIds.map(async (mid) => {
          const key = `${src}:${mid}:${province}`;
          const v = await kv.get<CacheEntry>(key, "json");
          if (!v) {
            missing++;
            return;
          }
          const age = now - v.fetchedAt;
          if (age < ttlMs * 0.5) fresh++;
          else if (age < ttlMs) ok++;
          else stale++;
          if (oldest == null || v.fetchedAt < oldest) oldest = v.fetchedAt;
          if (newest == null || v.fetchedAt > newest) newest = v.fetchedAt;
        }),
      );

      return {
        source: src,
        name: SOURCES[k].name,
        type: SOURCES[k].type,
        ttlSec,
        total: materialIds.length,
        fresh,
        ok,
        stale,
        missing,
        oldestFetchedAt: oldest != null ? new Date(oldest).toISOString() : null,
        newestFetchedAt: newest != null ? new Date(newest).toISOString() : null,
      };
    }),
  );

  const totalCells = perSource.length * materialIds.length;
  const summary = perSource.reduce(
    (acc, s) => ({
      fresh: acc.fresh + s.fresh,
      ok: acc.ok + s.ok,
      stale: acc.stale + s.stale,
      missing: acc.missing + s.missing,
    }),
    { fresh: 0, ok: 0, stale: 0, missing: 0 },
  );

  return NextResponse.json(
    {
      province,
      materials: materialIds.length,
      sources: perSource,
      summary: {
        ...summary,
        totalCells,
        coverage:
          totalCells > 0
            ? +(((summary.fresh + summary.ok) / totalCells) * 100).toFixed(1)
            : 0,
      },
    },
    {
      headers: {
        "cache-control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
