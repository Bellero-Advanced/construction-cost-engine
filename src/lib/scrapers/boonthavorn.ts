/**
 * Boonthavorn price provider via Magento GraphQL API.
 * The site exposes /graphql with product search — no scraping needed.
 */
import type { PriceProvider } from "@/lib/livePrice";
import { MATERIALS } from "@/data/materials";
import type { SourceKey } from "@/types";

interface GqlProduct {
  name: string;
  price_range: { minimum_price: { regular_price: { value: number } } };
}

function searchTermFor(materialId: string): string {
  const m = MATERIALS[materialId];
  const override = m?.sourceOverrides?.["boonthavorn" as SourceKey]?.searchTerm;
  if (override) return override;
  return m?.searchTerms?.[0] ?? materialId;
}

function pickBestPrice(items: GqlProduct[], materialId: string): number | null {
  if (items.length === 0) return null;
  const m = MATERIALS[materialId];
  const size = m?.canonical?.size?.toLowerCase();
  // Prefer items whose name contains the canonical size (e.g. "50 กก", "50kg")
  if (size) {
    const sizeNorm = size.replace(/\s+/g, "").toLowerCase();
    const match = items.find((it) =>
      it.name.toLowerCase().replace(/\s+/g, "").includes(sizeNorm),
    );
    if (match) return match.price_range.minimum_price.regular_price.value;
  }
  // Fallback: median of all prices
  const prices = items
    .map((it) => it.price_range.minimum_price.regular_price.value)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);
  if (prices.length === 0) return null;
  return prices[Math.floor(prices.length / 2)];
}

export const boonthavornProvider: PriceProvider = {
  key: "boonthavorn",
  ttlSec: 60 * 60 * 24 * 30,
  async fetch(materialId: string): Promise<number | null> {
    const q = searchTermFor(materialId);
    try {
      const r = await fetch("https://www.boonthavorn.com/graphql", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: `{ products(search: "${q}" pageSize: 10) { items { name price_range { minimum_price { regular_price { value } } } } } }`,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!r.ok) return null;
      const data = (await r.json()) as {
        data: { products: { items: GqlProduct[] } };
      };
      return pickBestPrice(data.data.products.items, materialId);
    } catch {
      return null;
    }
  },
};
