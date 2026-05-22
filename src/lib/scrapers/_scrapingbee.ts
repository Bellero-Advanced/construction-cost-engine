import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Material } from "@/types";

async function getApiKey(): Promise<string | null> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as CloudflareEnv | undefined;
    return env?.SCRAPINGBEE_API_KEY ?? null;
  } catch {
    return null;
  }
}

export interface ScrapingBeeOptions {
  url: string;
  renderJs?: boolean;
  countryCode?: string;
  waitFor?: string;
  waitMs?: number;
  timeoutMs?: number;
}

export async function fetchViaScrapingBee(
  opts: ScrapingBeeOptions,
): Promise<string | null> {
  const key = await getApiKey();
  if (!key) return null;

  const params = new URLSearchParams({
    api_key: key,
    url: opts.url,
    render_js: (opts.renderJs ?? true) ? "true" : "false",
    country_code: opts.countryCode ?? "th",
  });
  if (opts.waitFor) params.set("wait_for", opts.waitFor);
  if (opts.waitMs) params.set("wait", String(opts.waitMs));

  try {
    const r = await fetch(
      `https://app.scrapingbee.com/api/v1/?${params.toString()}`,
      { signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000) },
    );
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

export function extractPricesFromHtml(html: string): number[] {
  const cleaned = html.replace(/\s+/g, " ");

  const patterns: RegExp[] = [
    /"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/gi,
    /itemprop\s*=\s*"price"[^>]*content\s*=\s*"(\d+(?:\.\d+)?)"/gi,
    /content\s*=\s*"(\d+(?:\.\d+)?)"[^>]*itemprop\s*=\s*"price"/gi,
    /data-price(?:-amount)?\s*=\s*"(\d+(?:\.\d+)?)"/gi,
    /class="[^"]*\bprice\b[^"]*"[^>]*>\s*฿?\s*([\d,]+(?:\.\d+)?)/gi,
  ];

  for (const re of patterns) {
    const out: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(cleaned)) !== null) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n > 0 && n < 10_000_000) out.push(n);
    }
    if (out.length > 0) return out;
  }
  return [];
}

/**
 * Option B: extract `{name, price}` pairs from JSON-LD Product blobs in the
 * HTML so we can filter by canonical brand/size before averaging.
 *
 * Many SPAs embed a `<script type="application/ld+json">` Product or
 * ItemList with `name` + `offers.price`. When present, this is a far more
 * reliable signal than scraping numeric prices blind from rendered HTML.
 */
export interface NamedPrice {
  name: string;
  price: number;
}

export function extractNamedPricesFromJsonLd(html: string): NamedPrice[] {
  const out: NamedPrice[] = [];
  const re =
    /<script[^>]+type\s*=\s*"application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const body = m[1].trim();
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      continue;
    }
    walkJsonLd(data, out);
  }
  return out;
}

function walkJsonLd(node: unknown, out: NamedPrice[]): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const t = obj["@type"];
  const isProduct =
    t === "Product" || (Array.isArray(t) && t.includes("Product"));
  if (isProduct) {
    const name = String(obj.name ?? "").trim();
    const price = pickPriceFromOffers(obj.offers);
    if (name && price != null) out.push({ name, price });
  }
  // Recurse into nested fields (ItemList.itemListElement, etc.)
  for (const v of Object.values(obj)) walkJsonLd(v, out);
}

function pickPriceFromOffers(offers: unknown): number | null {
  if (offers == null) return null;
  if (Array.isArray(offers)) {
    const arr = offers
      .map((o) => pickPriceFromOffers(o))
      .filter((n): n is number => n != null);
    if (arr.length === 0) return null;
    arr.sort((a, b) => a - b);
    return arr[0];
  }
  if (typeof offers !== "object") return null;
  const o = offers as Record<string, unknown>;
  const raw = o.price ?? o.lowPrice;
  if (raw == null) return null;
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function pickPriceForMaterial(
  named: NamedPrice[],
  material: Material | null,
): number | null {
  if (named.length === 0) return null;
  if (!material) {
    const ps = named.map((n) => n.price);
    ps.sort((a, b) => a - b);
    return ps[Math.floor(ps.length / 2)];
  }
  const must: string[] = [];
  const nice: string[] = [];
  if (material.canonical?.size) must.push(norm(material.canonical.size));
  if (material.canonical?.brand) nice.push(norm(material.canonical.brand));
  if (material.canonical?.grade) nice.push(norm(material.canonical.grade));
  for (const t of material.searchTerms ?? []) {
    for (const part of norm(t).split(/[\s\-/]+/)) {
      if (part.length >= 2 && !nice.includes(part) && !must.includes(part)) {
        nice.push(part);
      }
    }
  }

  const tight: number[] = [];
  const loose: number[] = [];
  for (const np of named) {
    const n = norm(np.name);
    const mustOk = must.length === 0 || must.every((t) => n.includes(t));
    if (!mustOk) continue;
    const niceHit = nice.length === 0 || nice.some((t) => n.includes(t));
    if (niceHit) tight.push(np.price);
    else loose.push(np.price);
  }
  const arr = tight.length ? tight : loose;
  if (arr.length === 0) return null;
  arr.sort((a, b) => a - b);
  return arr[Math.floor(arr.length / 2)];
}

export function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export async function isScrapingBeeEnabled(): Promise<boolean> {
  return (await getApiKey()) !== null;
}
