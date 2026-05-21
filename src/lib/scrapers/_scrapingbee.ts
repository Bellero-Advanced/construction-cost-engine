import { getCloudflareContext } from "@opennextjs/cloudflare";

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

export function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export async function isScrapingBeeEnabled(): Promise<boolean> {
  return (await getApiKey()) !== null;
}
