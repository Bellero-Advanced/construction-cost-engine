/**
 * Real TPSO scraper — fetches the latest "CMI Report" PDF from
 * tpso.go.th, parses it with `unpdf`, extracts the headline
 * Construction Materials Price Index value + YoY % + report period,
 * and caches the snapshot in KV.
 *
 * The PDF is text-based (not scanned), so no OCR is needed.
 *
 * `unpdf` is imported lazily at call time (not at module load) because
 * loading its pdfjs-internal dependencies eagerly fails in the
 * Cloudflare Workers runtime when the route module graph is built.
 */

const TPSO_INDEX_PAGE = "https://tpso.go.th/summary-trade-economy-th";
const KV_KEY = "tpso:cmi:latest";

export interface CmiSnapshot {
  index: number;
  yoyPct: number;
  momPct: number | null;
  reportUrl: string;
  reportPeriod: string;
  fetchedAt: string;
}

/**
 * Baseline CMI value used to convert the live index into a price-multiplier.
 * 110 ≈ 12-month average around 2024-2025; safe pivot.
 */
export const TPSO_CMI_BASELINE = 110.0;

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

function parsePeriod(text: string): string {
  const re = new RegExp(`เดือน\\s*(${THAI_MONTHS.join("|")})\\s+(\\d{4})`, "u");
  const m = text.match(re);
  return m ? `${m[1]} ${m[2]}` : "";
}

export async function fetchLatestReportUrl(): Promise<string | null> {
  const r = await fetch(TPSO_INDEX_PAGE, {
    headers: { "user-agent": "Mozilla/5.0 (cost-engine refresh)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) return null;
  const html = await r.text();
  const matches = [
    ...html.matchAll(
      /https:\/\/uploads\.tpso\.go\.th\/[^"\\]*CMI[%20\s_]+Report[^"\\]*\.pdf/gi,
    ),
  ].map((m) => m[0].replace(/\\$/, ""));
  if (matches.length === 0) return null;
  // Sort lexicographically descending — filenames embed year/month so
  // the lexicographic latest tends to be the most recent. Bias toward
  // 2026/2025 reports.
  const sorted = matches.sort((a, b) => b.localeCompare(a));
  return sorted[0] ?? null;
}

export async function parseCmiPdf(
  buf: Uint8Array,
): Promise<CmiSnapshot | null> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const doc = await getDocumentProxy(buf);
  const { text } = await extractText(doc, { mergePages: true });

  // Headline: "ดัชนีราคาวัสดุก่อสร้างเดือน<MONTH> <YEAR> เท่ากับ 113.4"
  const idxMatch = text.match(/เท่ากับ\s+(\d{2,3}(?:\.\d{1,2})?)/u);
  if (!idxMatch) return null;
  const index = parseFloat(idxMatch[1]);
  if (!Number.isFinite(index) || index < 50 || index > 300) return null;

  // YoY: "(YoY) สูงขึ้นร้อยละ 0.3" or "ลดลงร้อยละ 0.3"
  const yoyMatch = text.match(
    /\(YoY\)[^0-9-]*(สูงขึ้น|ลดลง)?[^0-9-]*(\d+\.\d+)/u,
  );
  let yoyPct = 0;
  if (yoyMatch) {
    yoyPct = parseFloat(yoyMatch[2]);
    if (yoyMatch[1] === "ลดลง") yoyPct = -yoyPct;
  }

  // MoM: "(MoM) ดัชนีราคาลดลงร้อยละ 0.2"
  const momMatch = text.match(
    /\(MoM\)[^0-9-]*?(สูงขึ้น|ลดลง)?[^0-9-]*?(\d+\.\d+)/u,
  );
  let momPct: number | null = null;
  if (momMatch) {
    momPct = parseFloat(momMatch[2]);
    if (momMatch[1] === "ลดลง") momPct = -momPct;
  }

  return {
    index,
    yoyPct,
    momPct,
    reportUrl: "",
    reportPeriod: parsePeriod(text),
    fetchedAt: new Date().toISOString(),
  };
}

export async function refreshTpsoIndex(
  kv?: KVNamespace,
): Promise<CmiSnapshot | null> {
  const url = await fetchLatestReportUrl();
  if (!url) return null;

  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) return null;
  const buf = new Uint8Array(await r.arrayBuffer());

  const snap = await parseCmiPdf(buf);
  if (!snap) return null;
  snap.reportUrl = url;

  if (kv) {
    await kv.put(KV_KEY, JSON.stringify(snap), {
      expirationTtl: 60 * 60 * 24 * 60, // 60 days
    });
  }
  return snap;
}

export async function readTpsoIndex(
  kv?: KVNamespace,
): Promise<CmiSnapshot | null> {
  if (!kv) return null;
  return await kv.get<CmiSnapshot>(KV_KEY, "json");
}

/**
 * PriceProvider entry: returns a price for a (material, province) tuple
 * derived from the deterministic mock baseline scaled by the live CMI
 * delta versus baseline. Returns null if KV has no snapshot — caller
 * falls back to mock.
 */
import type { PriceProvider } from "@/lib/livePrice";
import { getPrice as getMockPrice } from "@/lib/pricing";

export const tpsoProvider: PriceProvider = {
  key: "tpso",
  ttlSec: 60 * 60 * 24 * 7, // weekly
  async fetch(materialId: string, provinceId: number) {
    try {
      const mod = await import("@opennextjs/cloudflare");
      const ctx = mod.getCloudflareContext();
      const kv = (ctx?.env as { PRICES_KV?: KVNamespace } | undefined)
        ?.PRICES_KV;
      const snap = await readTpsoIndex(kv);
      if (!snap || !Number.isFinite(snap.index)) return null;
      const base = getMockPrice("tpso", materialId, provinceId);
      if (!base) return null;
      const ratio = snap.index / TPSO_CMI_BASELINE;
      return Math.round(base * ratio * 100) / 100;
    } catch {
      return null;
    }
  },
};
