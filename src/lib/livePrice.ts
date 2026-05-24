/**
 * Live-price layer.
 *
 * Phase 3 architecture stub. Resolves a (source, material, province) tuple to
 * either a real, scraped/fetched price (when a provider is registered AND
 * fresh data exists in cache) or falls back to the deterministic mock from
 * `pricing.ts`. The UI surfaces which path was taken via `PriceResult.live`.
 *
 * Cache strategy:
 *  - In-memory Map by default (works on a single Worker isolate, fine for
 *    this demo). Swap `kvGet`/`kvPut` for `env.PRICES_KV.get/put` when a
 *    Cloudflare KV binding is added in `wrangler.jsonc`.
 *  - TTL is per-source (govt monthly = 7d, retail = 24h).
 *
 * Adding a real source = implement `PriceProvider.fetch()` in
 * `src/lib/scrapers/<source>.ts` and register it in `PROVIDERS` below.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { SourceKey } from "@/types";

export interface PriceResult {
  /** Live price in THB. `null` when no live data is available. */
  price: number | null;
  /** True when the value came from a real provider (cached or fresh). */
  live: boolean;
  /** True when the source has any value to return at all (live or stale). */
  available: boolean;
  source: SourceKey | string;
  fetchedAt?: string;
  ttlSec: number;
}

export interface PriceProvider {
  key: SourceKey;
  ttlSec: number;
  fetch: (materialId: string, provinceId: number) => Promise<number | null>;
}

const memCache = new Map<string, { price: number; fetchedAt: number }>();

const cacheKey = (s: string, m: string, p: number) => `${s}:${m}:${p}`;

async function getKv(): Promise<KVNamespace | null> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.env as CloudflareEnv | undefined)?.PRICES_KV ?? null;
  } catch {
    return null;
  }
}

async function kvGet(
  key: string,
): Promise<{ price: number; fetchedAt: number } | null> {
  const kv = await getKv();
  if (kv) {
    const v = await kv.get<{ price: number; fetchedAt: number }>(key, "json");
    if (v) return v;
  }
  return memCache.get(key) ?? null;
}

async function kvPut(
  key: string,
  value: { price: number; fetchedAt: number },
  ttlSec: number,
): Promise<void> {
  memCache.set(key, value);
  const kv = await getKv();
  if (kv) {
    await kv.put(key, JSON.stringify(value), {
      expirationTtl: Math.max(60, ttlSec),
    });
  }
}

// Default TTLs by source tier — in seconds.
const DEFAULT_TTL: Record<SourceKey, number> = {
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
  boonthavorn: 60 * 60 * 24 * 30,
};

/**
 * Provider registry. Every Thai source we ship has a real scraper —
 * no mock fallback. When a provider returns null the API surfaces
 * `available: false` and the UI displays "—".
 */
import { tpsoProvider } from "@/lib/scrapers/tpso";
import { cgdProvider } from "@/lib/scrapers/cgd";
import { ditProvider } from "@/lib/scrapers/dit";
import { homeproProvider } from "@/lib/scrapers/homepro";
import { globalhouseProvider } from "@/lib/scrapers/globalhouse";
import { thaiwatsaduProvider } from "@/lib/scrapers/thaiwatsadu";
import { bnbProvider } from "@/lib/scrapers/bnb";
import { scghomeProvider } from "@/lib/scrapers/scghome";
import { dohomeProvider } from "@/lib/scrapers/dohome";
import { megahomeProvider } from "@/lib/scrapers/megahome";
import { boonthavornProvider } from "@/lib/scrapers/boonthavorn";

const PROVIDERS: Partial<Record<SourceKey, PriceProvider>> = {
  tpso: tpsoProvider,
  cgd: cgdProvider,
  dit: ditProvider,
  homepro: homeproProvider,
  globalhouse: globalhouseProvider,
  thaiwatsadu: thaiwatsaduProvider,
  bnb: bnbProvider,
  scghome: scghomeProvider,
  dohome: dohomeProvider,
  megahome: megahomeProvider,
  boonthavorn: boonthavornProvider,
};

export async function getLivePrice(
  sourceKey: SourceKey | string,
  materialId: string,
  provinceId: number,
): Promise<PriceResult> {
  const provider = PROVIDERS[sourceKey as SourceKey];
  const ttlSec =
    provider?.ttlSec ?? DEFAULT_TTL[sourceKey as SourceKey] ?? 86400;

  if (!provider) {
    return {
      price: null,
      live: false,
      available: false,
      source: sourceKey,
      ttlSec,
    };
  }

  const key = cacheKey(sourceKey, materialId, provinceId);
  const cached = await kvGet(key);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < ttlSec * 1000) {
    return {
      price: cached.price,
      live: true,
      available: true,
      source: sourceKey,
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
      ttlSec,
    };
  }

  try {
    const fresh = await provider.fetch(materialId, provinceId);
    if (fresh != null && Number.isFinite(fresh) && fresh > 0) {
      await kvPut(key, { price: fresh, fetchedAt: now }, ttlSec);
      return {
        price: fresh,
        live: true,
        available: true,
        source: sourceKey,
        fetchedAt: new Date(now).toISOString(),
        ttlSec,
      };
    }
  } catch {
    // fall through
  }

  // Stale cache is still real data
  if (cached) {
    return {
      price: cached.price,
      live: true,
      available: true,
      source: sourceKey,
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
      ttlSec,
    };
  }
  return {
    price: null,
    live: false,
    available: false,
    source: sourceKey,
    ttlSec,
  };
}

export function listRegisteredProviders(): SourceKey[] {
  return Object.keys(PROVIDERS) as SourceKey[];
}
