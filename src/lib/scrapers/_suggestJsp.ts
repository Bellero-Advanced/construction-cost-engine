/**
 * Shared helper for retail sites that expose a `/service/search/suggest.jsp`
 * JSON endpoint (HomePro family — HomePro, MegaHome). Returns a price
 * provider that hits the API directly (no headless browser needed).
 */

import type { PriceProvider } from "@/lib/livePrice";
import { materialQuery } from "@/lib/scrapers/_headless";
import type { SourceKey } from "@/types";

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

function pickPrice(items: SuggestItem[], hint: string): number | null {
  const prices: number[] = [];
  const hintTokens = hint
    .toLowerCase()
    .split(/[\s\-/]+/)
    .filter((t) => t.length >= 2);
  for (const it of items) {
    const name = (it.item_name ?? "").toLowerCase();
    // Loose match: any token (>=2 chars) appears OR no tokens to filter on.
    if (
      hintTokens.length > 0 &&
      !hintTokens.some((tok) => name.includes(tok))
    ) {
      continue;
    }
    const m = (it.price_display ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/,/g, "")
      .match(/(\d+(?:\.\d+)?)/);
    if (m) {
      const n = parseFloat(m[1]);
      if (Number.isFinite(n) && n > 0) prices.push(n);
    }
  }
  // Fallback when soft-match yields nothing — accept all items in result
  if (prices.length === 0 && items.length > 0) {
    for (const it of items) {
      const m = (it.price_display ?? "")
        .replace(/<[^>]+>/g, " ")
        .replace(/,/g, "")
        .match(/(\d+(?:\.\d+)?)/);
      if (m) {
        const n = parseFloat(m[1]);
        if (Number.isFinite(n) && n > 0) prices.push(n);
      }
    }
  }
  if (prices.length === 0) return null;
  prices.sort((a, b) => a - b);
  return prices[Math.floor(prices.length / 2)];
}

export function makeSuggestJspProvider(
  cfg: SuggestProviderConfig,
): PriceProvider {
  return {
    key: cfg.key,
    ttlSec: cfg.ttlSec ?? 60 * 60 * 24,
    async fetch(materialId: string): Promise<number | null> {
      const q = materialQuery(materialId);
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
        const ct = r.headers.get("content-type") ?? "";
        if (!ct.includes("json")) return null;
        const data = (await r.json()) as SuggestResponse;
        const items = data.items ?? [];
        if (items.length === 0) return null;
        return pickPrice(items, q);
      } catch {
        return null;
      }
    },
  };
}
