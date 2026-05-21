/**
 * Build a generic SPA-search retail price provider via Cloudflare Browser
 * Rendering. Pass the URL template + DOM selectors; the helper handles
 * navigation, wait, median-price extraction, and timeout/error -> null.
 *
 * Selector resilience: each `productCardSelector` / `priceSelector` is a
 * comma-separated CSS list. The helper tries each in order until one
 * yields prices, so DOM tweaks rarely break the scrape.
 */

import type { PriceProvider } from "@/lib/livePrice";
import { headlessScrape, materialQuery } from "@/lib/scrapers/_headless";
import {
  extractPricesFromHtml,
  fetchViaScrapingBee,
  median,
} from "@/lib/scrapers/_scrapingbee";
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

      // 1) ScrapingBee free-tier first (when key bound) — bypasses the
      //    Cloudflare bot challenges that block direct egress fetches.
      const html = await fetchViaScrapingBee({
        url,
        renderJs: true,
        countryCode: "th",
        waitMs: 2500,
        timeoutMs: cfg.timeoutMs ?? 30_000,
      });
      if (html) {
        const prices = extractPricesFromHtml(html);
        const m = median(prices);
        if (m !== null) return m;
      }

      // 2) Fall back to direct Cloudflare Browser Rendering.
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
              // Try each comma-separated selector in turn — first that
              // yields >0 price hits wins. Resilient to small DOM tweaks.
              const cardSelectors = cardSel.split(",").map((s) => s.trim());
              const priceSelectors = priceSel.split(",").map((s) => s.trim());
              const collect = (cs: string, ps: string): number[] => {
                const cards = Array.from(document.querySelectorAll(cs)).slice(
                  0,
                  10,
                );
                const out: number[] = [];
                for (const card of cards) {
                  const el = card.querySelector(ps);
                  const txt = el?.textContent ?? "";
                  const m = txt.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
                  if (m) {
                    const n = parseFloat(m[1]);
                    if (Number.isFinite(n) && n > 0) out.push(n);
                  }
                }
                return out;
              };
              for (const cs of cardSelectors) {
                for (const ps of priceSelectors) {
                  const prices = collect(cs, ps);
                  if (prices.length > 0) {
                    prices.sort((a, b) => a - b);
                    return prices[Math.floor(prices.length / 2)];
                  }
                }
              }
              return null;
            },
            cfg.productCardSelector,
            cfg.priceSelector,
          );
        },
      });
    },
  };
}
