import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { listRegisteredProviders } from "@/lib/livePrice";
import { SOURCES, SOURCE_KEYS } from "@/data/sources";
import { isScrapingBeeEnabled } from "@/lib/scrapers/_scrapingbee";
import type { SourceKey } from "@/types";

interface SourceStatus {
  key: string;
  name: string;
  type: string;
  live: boolean;
  mode: "live-headless" | "live-fetch" | "live-pdf" | "live-index" | "off";
  ttlSec: number;
  cacheKeysSeen?: number;
}

const RETAIL: SourceKey[] = [
  "homepro",
  "globalhouse",
  "thaiwatsadu",
  "bnb",
  "scghome",
  "dohome",
  "megahome",
];

function modeFor(key: string, registered: boolean): SourceStatus["mode"] {
  if (!registered) return "off";
  if (key === "tpso") return "live-index";
  if (key === "cgd") return "live-pdf";
  if (key === "dit") return "live-fetch";
  if (RETAIL.includes(key as SourceKey)) return "live-headless";
  return "off";
}

const TTL_BY_KEY: Record<string, number> = {
  tpso: 60 * 60 * 24 * 7,
  cgd: 60 * 60 * 24 * 30,
  dit: 60 * 60 * 24,
  homepro: 60 * 60 * 24,
  globalhouse: 60 * 60 * 24,
  thaiwatsadu: 60 * 60 * 24,
  bnb: 60 * 60 * 24,
  scghome: 60 * 60 * 24,
  dohome: 60 * 60 * 24,
  megahome: 60 * 60 * 24,
};

async function countCacheKeys(prefix: string): Promise<number | undefined> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const kv = (ctx?.env as CloudflareEnv | undefined)?.PRICES_KV;
    if (!kv) return undefined;
    const list = await kv.list({ prefix: `${prefix}:`, limit: 1000 });
    return list.keys.length;
  } catch {
    return undefined;
  }
}

export async function GET() {
  const live = new Set<SourceKey>(listRegisteredProviders());
  const scrapingBee = await isScrapingBeeEnabled();
  const sources: SourceStatus[] = await Promise.all(
    SOURCE_KEYS.map(async (k): Promise<SourceStatus> => {
      const key = String(k);
      const registered = live.has(k as SourceKey);
      return {
        key,
        name: SOURCES[k].name,
        type: SOURCES[k].type,
        live: registered,
        mode: modeFor(key, registered),
        ttlSec: TTL_BY_KEY[key] ?? 86400,
        cacheKeysSeen: await countCacheKeys(key),
      };
    }),
  );
  return NextResponse.json(
    {
      sources,
      registered: Array.from(live),
      scrapingBee: { enabled: scrapingBee },
      note: "Phase 4 — all 10 Thai sources wired. Retail uses ScrapingBee free-tier proxy (when SCRAPINGBEE_API_KEY set) with Cloudflare Browser Rendering fallback; govt sources read PDF/HTML directly. No mock fallback.",
    },
    {
      headers: {
        "cache-control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
