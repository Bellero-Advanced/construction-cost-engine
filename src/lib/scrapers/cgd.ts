/**
 * CGD (กรมบัญชีกลาง) scraper.
 *
 * CGD publishes monthly construction-material reference prices on
 * data.go.th as PDF tables. Same pattern as TPSO: fetch the PDF, extract
 * text via unpdf, regex-pull the per-material rows, write to KV.
 *
 * Lazy import for unpdf (Workers module-graph constraint).
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PriceProvider } from "@/lib/livePrice";

const CGD_INDEX_PAGE =
  "https://www.cgd.go.th/cs/internet/internet/ราคามาตรฐาน.html";
// Fallback: the data.go.th CKAN package commonly used for CGD building prices.
const CGD_CKAN_PACKAGE =
  "https://data.go.th/api/3/action/package_show?id=cmicgd042569";
const KV_KEY = "cgd:building:latest";

export interface CgdSnapshot {
  prices: Record<string, number>;
  reportPeriod: string;
  reportUrl: string;
  fetchedAt: string;
}

const CGD_NAME_MATCHERS: Record<string, RegExp[]> = {
  CEMENT_001: [/ปูนซีเมนต์.*Type.*I|ปอร์ตแลนด์.*ประเภท.*1/i],
  SAND_001: [/ทรายหยาบ/],
  ROCK_001: [/หิน.*คลุก|หิน.*1.*2/],
  REBAR_DB12: [/เหล็ก.*DB.*12|ข้ออ้อย.*12/i],
  REBAR_DB16: [/เหล็ก.*DB.*16|ข้ออ้อย.*16/i],
  REBAR_DB20: [/เหล็ก.*DB.*20|ข้ออ้อย.*20/i],
  REBAR_RB6: [/เหล็ก.*RB.*6|กลม.*6/i],
  REBAR_RB9: [/เหล็ก.*RB.*9|กลม.*9/i],
  WIRE_001: [/ลวดผูกเหล็ก/],
  NAIL_001: [/ตะปู/],
  TILE_001: [/กระเบื้อง.*ปูพื้น/],
  TILE_002: [/กระเบื้อง.*ปูผนัง/],
};

interface CkanResource {
  url?: string;
  format?: string;
  name?: string;
}
interface CkanPackage {
  result?: { resources?: CkanResource[] };
}

async function fetchLatestCgdPdfUrl(): Promise<string | null> {
  try {
    const r = await fetch(CGD_CKAN_PACKAGE, {
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as CkanPackage;
    const resources = data.result?.resources ?? [];
    const pdf = resources.find((res) =>
      (res.format ?? "").toUpperCase().includes("PDF"),
    );
    return pdf?.url ?? null;
  } catch {
    return null;
  }
}

/**
 * CGD PDF rows look like:
 *   "ปูนซีเมนต์ปอร์ตแลนด์ Type I    ถุง 50 กก.   180.00"
 * Extract name + numeric price from each line.
 */
function parseRowsFromText(
  text: string,
): Array<{ name: string; price: number }> {
  const rows: Array<{ name: string; price: number }> = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 8) continue;
    const m = trimmed.match(/^(.+?)\s+([\d,]+(?:\.\d+)?)\s*$/);
    if (!m) continue;
    const name = m[1].trim();
    const price = parseFloat(m[2].replace(/,/g, ""));
    if (Number.isFinite(price) && price > 5 && price < 1_000_000) {
      rows.push({ name, price });
    }
  }
  return rows;
}

function parsePeriod(text: string): string {
  const m = text.match(/(?:ประจำเดือน|ราคาเดือน)\s*(\S+)\s+(\d{4})/u);
  if (m) return `${m[1]} ${m[2]}`;
  return new Date().toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });
}

export async function parseCgdPdf(
  buf: Uint8Array,
): Promise<CgdSnapshot | null> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const doc = await getDocumentProxy(buf);
  const { text } = await extractText(doc, { mergePages: true });

  const rows = parseRowsFromText(text);
  if (rows.length === 0) return null;

  const prices: Record<string, number> = {};
  for (const [id, matchers] of Object.entries(CGD_NAME_MATCHERS)) {
    const hits = rows
      .filter((row) => matchers.some((re) => re.test(row.name)))
      .map((row) => row.price)
      .sort((a, b) => a - b);
    if (hits.length > 0) prices[id] = hits[Math.floor(hits.length / 2)];
  }
  if (Object.keys(prices).length === 0) return null;

  return {
    prices,
    reportPeriod: parsePeriod(text),
    reportUrl: "",
    fetchedAt: new Date().toISOString(),
  };
}

export async function refreshCgdIndex(
  kv?: KVNamespace,
): Promise<CgdSnapshot | null> {
  const url = await fetchLatestCgdPdfUrl();
  if (!url) return null;
  const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) return null;
  const buf = new Uint8Array(await r.arrayBuffer());
  const snap = await parseCgdPdf(buf);
  if (!snap) return null;
  snap.reportUrl = url;
  if (kv) {
    await kv.put(KV_KEY, JSON.stringify(snap), {
      expirationTtl: 60 * 60 * 24 * 90,
    });
  }
  return snap;
}

export async function readCgdIndex(
  kv?: KVNamespace,
): Promise<CgdSnapshot | null> {
  if (!kv) return null;
  return await kv.get<CgdSnapshot>(KV_KEY, "json");
}

export const cgdProvider: PriceProvider = {
  key: "cgd",
  ttlSec: 60 * 60 * 24 * 30,
  async fetch(materialId: string) {
    try {
      const ctx = await getCloudflareContext({ async: true });
      const kv = (ctx?.env as CloudflareEnv | undefined)?.PRICES_KV;
      const snap = await readCgdIndex(kv);
      if (!snap) return null;
      const p = snap.prices[materialId];
      return Number.isFinite(p) ? p : null;
    } catch {
      return null;
    }
  },
};

export const CGD_INDEX_PAGE_URL = CGD_INDEX_PAGE;
