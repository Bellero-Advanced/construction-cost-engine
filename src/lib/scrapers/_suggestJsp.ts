/**
 * Shared helper for retail sites that expose a `/service/search/suggest.jsp`
 * JSON endpoint (HomePro family — HomePro, MegaHome). Returns a price
 * provider that hits the API directly (no headless browser needed).
 *
 * Option B canonicalization:
 *   - prefers Material.canonical.{brand,size} tokens to filter result items
 *   - falls back to Material.searchTerms[] hint tokens
 *   - falls back to legacy MATERIAL_SEARCH_TH if nothing else available
 */

import type { PriceProvider } from "@/lib/livePrice";
import { materialQuery } from "@/lib/scrapers/_headless";
import { MATERIALS } from "@/data/materials";
import type { Material, SourceKey } from "@/types";

interface SuggestItem {
  item_name?: string;
  price_display?: string;
  categories?: string;
}

interface SuggestResponse {
  items?: SuggestItem[];
}

interface SuggestProviderConfig {
  key: SourceKey;
  /** Origin without trailing slash, e.g. https://www.homepro.co.th */
  origin: string;
  ttlSec?: number;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokensFor(material: Material): { must: string[]; nice: string[] } {
  const must: string[] = [];
  const nice: string[] = [];
  const c = material.canonical;
  if (c?.size) must.push(norm(c.size));
  if (c?.brand) nice.push(norm(c.brand));
  if (c?.grade) nice.push(norm(c.grade));
  for (const t of material.searchTerms ?? []) {
    for (const part of norm(t).split(/[\s\-/]+/)) {
      if (part.length >= 2 && !nice.includes(part) && !must.includes(part)) {
        nice.push(part);
      }
    }
  }
  return { must, nice };
}

function parsePrice(it: SuggestItem): number | null {
  const m = (it.price_display ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/,/g, "")
    .match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function pickPrice(items: SuggestItem[], material: Material | null): number | null {
  if (items.length === 0) return null;

  // Legacy path — no canonical metadata, accept all
  if (!material) {
    const prices = items.map(parsePrice).filter((n): n is number => n != null);
    return prices.length ? median(prices) : null;
  }

  const { must, nice } = tokensFor(material);
  const tight: number[] = [];
  const loose: number[] = [];

  for (const it of items) {
    const name = norm(it.item_name ?? "");
    const price = parsePrice(it);
    if (price == null) continue;

    const mustOk =
      must.length === 0 || must.every((t) => name.includes(t));
    if (!mustOk) continue;

    const niceHit = nice.some((t) => name.includes(t));
    if (mustOk && (niceHit || nice.length === 0)) {
      tight.push(price);
    } else {
      loose.push(price);
    }
  }

  if (tight.length) return median(tight);
  if (loose.length) return median(loose);
  // Last resort: accept any item (legacy behaviour)
  const all = items.map(parsePrice).filter((n): n is number => n != null);
  return all.length ? median(all) : null;
}

function searchQueryFor(
  cfg: SuggestProviderConfig,
  materialId: string,
): string {
  const m = MATERIALS[materialId];
  const override = m?.sourceOverrides?.[cfg.key]?.searchTerm;
  if (override) return override;
  const term = m?.searchTerms?.[0];
  if (term) return term;
  return materialQuery(materialId);
}

export function makeSuggestJspProvider(
  cfg: SuggestProviderConfig,
): PriceProvider {
  return {
    key: cfg.key,
    ttlSec: cfg.ttlSec ?? 60 * 60 * 24,
    async fetch(materialId: string): Promise<number | null> {
      const material = MATERIALS[materialId] ?? null;
      const q = searchQueryFor(cfg, materialId);
      const url = `${cfg.origin}/service/search/suggest.jsp?q=${encodeURIComponent(q)}`;
      try {
        const r = await fetch(url, {
          headers: {
            accept: "application/json",
            "user-agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
            referer: `${cfg.origin}/`,
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (!r.ok) return null;
        // Note: MegaHome serves JSON with text/html content-type — don't filter
        // on content-type; just try to parse.
        let data: SuggestResponse;
        try {
          data = (await r.json()) as SuggestResponse;
        } catch {
          return null;
        }
        const items = data.items ?? [];
        if (items.length === 0) return null;
        return pickPrice(items, material);
      } catch {
        return null;
      }
    },
  };
}
