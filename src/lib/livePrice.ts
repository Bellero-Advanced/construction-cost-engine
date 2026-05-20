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

import { getPrice } from "@/lib/pricing";
import type { SourceKey } from "@/types";

export interface PriceResult {
  price: number;
  live: boolean;
  source: SourceKey | string;
  fetchedAt?: string; // ISO; only set when live=true
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
    const mod = await import("@opennextjs/cloudflare");
    const ctx = mod.getCloudflareContext();
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
  tpso: 60 * 60 * 24 * 7, // weekly (govt monthly index)
  cgd: 60 * 60 * 24 * 30, // monthly (quarterly source)
  homepro: 60 * 60 * 24, // daily
  globalhouse: 60 * 60 * 24,
  thaiwatsadu: 60 * 60 * 24,
  bnb: 60 * 60 * 24,
};

/**
 * Registry of live providers. The `tpso` provider parses the latest
 * CMI Report PDF from tpso.go.th and applies the index delta to the
 * deterministic mock baseline.
 */
import { tpsoProvider } from "@/lib/scrapers/tpso";

const PROVIDERS: Partial<Record<SourceKey, PriceProvider>> = {
  tpso: tpsoProvider,
};

export async function getLivePrice(
  sourceKey: SourceKey | string,
  materialId: string,
  provinceId: number,
): Promise<PriceResult> {
  const fallback = getPrice(sourceKey, materialId, provinceId);
  const provider = PROVIDERS[sourceKey as SourceKey];
  const ttlSec =
    provider?.ttlSec ?? DEFAULT_TTL[sourceKey as SourceKey] ?? 86400;

  if (!provider) {
    return { price: fallback, live: false, source: sourceKey, ttlSec };
  }

  const key = cacheKey(sourceKey, materialId, provinceId);
  const cached = await kvGet(key);
  const now = Date.now();

  if (cached && now - cached.fetchedAt < ttlSec * 1000) {
    return {
      price: cached.price,
      live: true,
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
        source: sourceKey,
        fetchedAt: new Date(now).toISOString(),
        ttlSec,
      };
    }
  } catch {
    // swallow — fall through to mock
  }

  // Stale cache is still better than mock; otherwise mock.
  if (cached) {
    return {
      price: cached.price,
      live: true,
      source: sourceKey,
      fetchedAt: new Date(cached.fetchedAt).toISOString(),
      ttlSec,
    };
  }
  return { price: fallback, live: false, source: sourceKey, ttlSec };
}

export function listRegisteredProviders(): SourceKey[] {
  return Object.keys(PROVIDERS) as SourceKey[];
}
