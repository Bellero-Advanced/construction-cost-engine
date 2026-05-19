/**
 * Scraper template — copy this file when adding a new source.
 *
 * To activate:
 *   1. Implement `fetch()` to return a real price number, or null on miss.
 *   2. Register the export in `src/lib/livePrice.ts` PROVIDERS map:
 *
 *        import { homeproProvider } from "@/lib/scrapers/homepro";
 *        const PROVIDERS = { homepro: homeproProvider };
 *
 *   3. (Optional) Add a Cloudflare KV binding `PRICES_KV` to `wrangler.jsonc`
 *      and swap the memCache in livePrice.ts for `env.PRICES_KV`.
 *
 * Source-specific notes:
 *   - HomePro / Global House / Thai Watsadu / BnB: SPA — direct HTML scrape
 *     returns no prices. Must reverse-engineer the XHR endpoint
 *     (e.g. omnistg.homepro.co.th) or run a headless browser on a VPS /
 *     browserless.io and have THIS function call that worker.
 *   - TPSO: PDF-only on data.go.th. Add an offline ETL that runs monthly
 *     via Cloudflare Cron Triggers, parses the PDF, writes to KV. This
 *     `fetch()` just reads the pre-parsed KV entry.
 *   - CGD: same story as TPSO but quarterly.
 */

import type { PriceProvider } from "@/lib/livePrice";

export const homeproProvider: PriceProvider = {
  key: "homepro",
  ttlSec: 60 * 60 * 24, // 24h

  async fetch(
    _materialId: string,
    _provinceId: number,
  ): Promise<number | null> {
    // NOT IMPLEMENTED. Returns null so livePrice falls back to mock.
    //
    // Implementation sketch when a headless-scrape worker is available:
    //   const url = `${process.env.SCRAPER_URL}/homepro?q=${encodeURIComponent(
    //     materialToSearchQuery(_materialId),
    //   )}`;
    //   const r = await fetch(url, {
    //     headers: { "x-scraper-token": process.env.SCRAPER_TOKEN ?? "" },
    //     signal: AbortSignal.timeout(8000),
    //   });
    //   if (!r.ok) return null;
    //   const { medianPrice } = (await r.json()) as { medianPrice: number };
    //   return medianPrice;
    return null;
  },
};
