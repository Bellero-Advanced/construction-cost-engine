/**
 * DIT (Department of Internal Trade) scraper for daily construction-material
 * prices from price.moc.go.th. No headless browser needed — page is SSR HTML.
 *
 * Tune NAME_MATCHERS / table regex if the upstream layout changes.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PriceProvider } from "@/lib/livePrice";

const DIT_BUILDING_MATERIALS_URL =
  "https://moc-price.moc.go.th/price/wholesale/group/24";
const KV_KEY = "dit:building-materials:latest";

export interface DitSnapshot {
  prices: Record<string, number>;
  reportPeriod: string;
  fetchedAt: string;
  reportUrl: string;
}

const DIT_NAME_MATCHERS: Record<string, RegExp[]> = {
  CEMENT_001: [/ปูนซีเมนต์ปอร์ตแลนด์/, /ปูน.*ตราเสือ|ตราช้าง/],
  SAND_001: [/ทรายหยาบ/, /ทรายแม่น้ำ/],
  ROCK_001: [/หิน.*1.*2/, /หินคลุก/],
  REBAR_DB12: [/เหล็ก.*DB.*12|ข้ออ้อย.*12/i],
  REBAR_DB16: [/เหล็ก.*DB.*16|ข้ออ้อย.*16/i],
  REBAR_DB20: [/เหล็ก.*DB.*20|ข้ออ้อย.*20/i],
  REBAR_RB6: [/เหล็ก.*RB.*6|กลม.*6/i],
  REBAR_RB9: [/เหล็ก.*RB.*9|กลม.*9/i],
  WIRE_001: [/ลวดผูกเหล็ก/],
  NAIL_001: [/ตะปู/],
};

function parseDitTable(html: string): Array<{ name: string; price: number }> {
  const rows: Array<{ name: string; price: number }> = [];
  const trMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const m of trMatches) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((t) =>
      t[1].replace(/<[^>]+>/g, "").trim(),
    );
    if (tds.length < 2) continue;
    const name = tds[0];
    for (let i = 1; i < tds.length; i++) {
      const txt = tds[i].replace(/,/g, "");
      const pm = txt.match(/^(\d+(?:\.\d+)?)/);
      if (pm) {
        const price = parseFloat(pm[1]);
        if (Number.isFinite(price) && price > 5 && price < 1_000_000) {
          rows.push({ name, price });
          break;
        }
      }
    }
  }
  return rows;
}

function parsePeriod(html: string): string {
  const m = html.match(/ประจำวันที่\s+(\d{1,2}\s+\S+\s+\d{4})/u);
  return m ? m[1] : new Date().toLocaleDateString("th-TH");
}

export async function refreshDitIndex(
  kv?: KVNamespace,
): Promise<DitSnapshot | null> {
  const r = await fetch(DIT_BUILDING_MATERIALS_URL, {
    headers: {
      "user-agent": "Mozilla/5.0 (cost-engine refresh)",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) return null;
  const html = await r.text();
  const rows = parseDitTable(html);
  if (rows.length === 0) return null;

  const prices: Record<string, number> = {};
  for (const [id, matchers] of Object.entries(DIT_NAME_MATCHERS)) {
    const hits = rows
      .filter((row) => matchers.some((re) => re.test(row.name)))
      .map((row) => row.price)
      .sort((a, b) => a - b);
    if (hits.length > 0) {
      prices[id] = hits[Math.floor(hits.length / 2)];
    }
  }

  const snap: DitSnapshot = {
    prices,
    reportPeriod: parsePeriod(html),
    reportUrl: DIT_BUILDING_MATERIALS_URL,
    fetchedAt: new Date().toISOString(),
  };

  if (kv) {
    await kv.put(KV_KEY, JSON.stringify(snap), {
      expirationTtl: 60 * 60 * 24 * 30,
    });
  }
  return snap;
}

export async function readDitIndex(
  kv?: KVNamespace,
): Promise<DitSnapshot | null> {
  if (!kv) return null;
  return await kv.get<DitSnapshot>(KV_KEY, "json");
}

export const ditProvider: PriceProvider = {
  key: "dit",
  ttlSec: 60 * 60 * 24,
  async fetch(materialId: string) {
    try {
      const ctx = await getCloudflareContext({ async: true });
      const kv = (ctx?.env as CloudflareEnv | undefined)?.PRICES_KV;
      const snap = await readDitIndex(kv);
      if (!snap) return null;
      const p = snap.prices[materialId];
      return Number.isFinite(p) ? p : null;
    } catch {
      return null;
    }
  },
};
