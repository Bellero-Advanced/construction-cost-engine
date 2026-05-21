/**
 * HomePro: real JSON API hit at /service/search/suggest.jsp.
 * Faster + cheaper than headless — no Browser Rendering session needed.
 *
 * Endpoint returns ~20 items per query. We pick the cheapest in-category
 * match, since the suggest API returns mixed brands + sizes for the term.
 */

import type { PriceProvider } from "@/lib/livePrice";
import { materialQuery } from "@/lib/scrapers/_headless";

interface HomeProItem {
  item_name?: string;
  price_display?: string;
  categories?: string;
}

interface HomeProSuggestResponse {
  items?: HomeProItem[];
}

function pickPrice(items: HomeProItem[], hint: string): number | null {
  const prices: number[] = [];
  const hintTokens = hint.toLowerCase().split(/\s+/).filter(Boolean);
  for (const it of items) {
    const name = (it.item_name ?? "").toLowerCase();
    // Soft match: at least one hint token appears in the item name
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
  if (prices.length === 0) return null;
  prices.sort((a, b) => a - b);
  // Median is robust to outliers (oversize SKUs, accessory bundles)
  return prices[Math.floor(prices.length / 2)];
}

export const homeproProvider: PriceProvider = {
  key: "homepro",
  ttlSec: 60 * 60 * 24,
  async fetch(materialId: string): Promise<number | null> {
    const q = materialQuery(materialId);
    const url = `https://www.homepro.co.th/service/search/suggest.jsp?q=${encodeURIComponent(q)}`;
    try {
      const r = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
          referer: "https://www.homepro.co.th/",
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!r.ok) return null;
      const data = (await r.json()) as HomeProSuggestResponse;
      const items = data.items ?? [];
      if (items.length === 0) return null;
      return pickPrice(items, q);
    } catch {
      return null;
    }
  },
};
