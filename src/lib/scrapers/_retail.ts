/**
 * Build a generic SPA-search retail price provider via Cloudflare Browser
 * Rendering. Pass the URL template + DOM selectors; the helper handles
 * navigation, wait, median-price extraction, and timeout/error -> null.
 */

import type { PriceProvider } from "@/lib/livePrice";
import { headlessScrape, materialQuery } from "@/lib/scrapers/_headless";
import type { SourceKey } from "@/types";

export interface RetailScraperConfig {
  key: SourceKey;
  ttlSec: number;
  /** URL template — `{q}` is replaced with the URL-encoded search query. */
  urlTemplate: string;
  /** CSS selectors that match each product card (comma-separated allowed). */
  productCardSelector: string;
  /** CSS selectors inside a product card that contain the price text. */
  priceSelector: string;
  timeoutMs?: number;
}

export function makeRetailProvider(cfg: RetailScraperConfig): PriceProvider {
  return {
    key: cfg.key,
    ttlSec: cfg.ttlSec,
    async fetch(materialId: string): Promise<number | null> {
      const q = encodeURIComponent(materialQuery(materialId));
      const url = cfg.urlTemplate.replace("{q}", q);
      return await headlessScrape({
        url,
        waitForSelector: cfg.productCardSelector,
        timeoutMs: cfg.timeoutMs,
        extract: async (root) => {
          const page = root as {
            evaluate: <T>(
              fn: (cardSel: string, priceSel: string) => T,
              cardSel: string,
              priceSel: string,
            ) => Promise<T>;
          };
          return await page.evaluate(
            (cardSel, priceSel) => {
              const cards = Array.from(
                document.querySelectorAll(cardSel),
              ).slice(0, 10);
              const prices: number[] = [];
              for (const card of cards) {
                const priceEl = card.querySelector(priceSel);
                const txt = priceEl?.textContent ?? "";
                const m = txt.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
                if (m) {
                  const n = parseFloat(m[1]);
                  if (Number.isFinite(n) && n > 0) prices.push(n);
                }
              }
              if (prices.length === 0) return null;
              prices.sort((a, b) => a - b);
              return prices[Math.floor(prices.length / 2)];
            },
            cfg.productCardSelector,
            cfg.priceSelector,
          );
        },
      });
    },
  };
}
