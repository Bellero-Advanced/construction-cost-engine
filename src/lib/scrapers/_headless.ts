/**
 * Shared headless browser helper using Cloudflare Browser Rendering.
 *
 * Each retail scraper opens a browser, navigates to the SPA search URL,
 * waits for product cards to render, scrapes the lowest-price item, and
 * closes the browser. Returns null on miss / failure.
 *
 * Requires the `BROWSER` binding in wrangler.jsonc + a Workers Paid plan
 * with Browser Rendering enabled.
 *
 * Lazy-imported to avoid pulling puppeteer into the module graph at
 * route-load time (we hit a similar issue with `unpdf` in the TPSO path).
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface HeadlessScrapeOptions {
  url: string;
  waitForSelector?: string;
  /** Run inside the page context; returns the lowest price found or null. */
  extract: (root: unknown) => Promise<number | null>;
  timeoutMs?: number;
}

async function getBrowserBinding(): Promise<Fetcher | null> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.env as CloudflareEnv | undefined)?.BROWSER ?? null;
  } catch {
    return null;
  }
}

/**
 * Run a headless-browser scrape using @cloudflare/puppeteer.
 * Returns null when:
 *   - no BROWSER binding (free tier / local dev)
 *   - navigation/wait timed out
 *   - extractor returned null
 */
export async function headlessScrape(
  opts: HeadlessScrapeOptions,
): Promise<number | null> {
  const binding = await getBrowserBinding();
  if (!binding) return null;

  const timeoutMs = opts.timeoutMs ?? 20_000;
  let puppeteer: typeof import("@cloudflare/puppeteer");
  try {
    puppeteer = await import("@cloudflare/puppeteer");
  } catch {
    return null;
  }

  // The puppeteer launch API accepts a Fetcher binding directly.
  const browser = await puppeteer.launch(
    binding as unknown as Parameters<typeof puppeteer.launch>[0],
  );

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
    );
    await page.goto(opts.url, {
      waitUntil: "networkidle2",
      timeout: timeoutMs,
    });
    if (opts.waitForSelector) {
      await page
        .waitForSelector(opts.waitForSelector, { timeout: timeoutMs })
        .catch(() => null);
    }
    const result = await opts.extract(page);
    return result;
  } catch {
    return null;
  } finally {
    await browser.close().catch(() => null);
  }
}

/**
 * Map our internal material IDs to the Thai search keyword each retail
 * site indexes against. Each scraper can override per-material if needed.
 */
export const MATERIAL_SEARCH_TH: Record<string, string> = {
  TILE_001: "กระเบื้องปูพื้น 12x12",
  TILE_002: "กระเบื้องปูผนัง 8x10",
  ADHESIVE_001: "ปูนกาวซีเมนต์",
  GROUT_001: "ปูนยาแนว",
  PVC_TRIM_001: "คิ้ว PVC",
  WATER_MIX_001: "น้ำผสมปูน",
  CEMENT_001: "ปูนซีเมนต์ปอร์ตแลนด์",
  SAND_001: "ทรายหยาบ",
  ROCK_001: "หินคลุก",
  REBAR_DB12: "เหล็กข้ออ้อย DB12",
  REBAR_DB16: "เหล็กข้ออ้อย DB16",
  REBAR_DB20: "เหล็กข้ออ้อย DB20",
  REBAR_RB6: "เหล็กกลม RB6",
  REBAR_RB9: "เหล็กกลม RB9",
  WIRE_001: "ลวดผูกเหล็ก",
  FORM_WOOD_001: "ไม้แบบ",
  NAIL_001: "ตะปู",
};

export function materialQuery(id: string): string {
  return MATERIAL_SEARCH_TH[id] ?? id;
}
