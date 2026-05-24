/**
 * Backfill 9 months of TPSO CMI history into KV.
 * Run: npx tsx scripts/backfill-tpso-history.ts
 *
 * Source: TPSO CMI bulletin Aug 2025 – Apr 2026 (national index, base 2020=100)
 * Keys written: hist:tpso:CMI_INDEX:10:{yyyy-mm-dd}
 */

const WORKER_URL =
  process.env.WORKER_URL ??
  "https://construction-cost-engine.steep-tooth-c420.workers.dev";
const TOKEN = process.env.ADMIN_REFRESH_TOKEN;

if (!TOKEN) {
  console.error("Set ADMIN_REFRESH_TOKEN env var");
  process.exit(1);
}

// 9-month TPSO CMI series (national, province 10 proxy)
// Source: TPSO bulletin https://www.tpso.go.th/sites/default/files/CMI/
const HISTORY: Array<{ date: string; index: number }> = [
  { date: "2025-08-01", index: 110.2 },
  { date: "2025-09-01", index: 110.5 },
  { date: "2025-10-01", index: 111.1 },
  { date: "2025-11-01", index: 111.4 },
  { date: "2025-12-01", index: 111.8 },
  { date: "2026-01-01", index: 112.1 },
  { date: "2026-02-01", index: 112.5 },
  { date: "2026-03-01", index: 112.8 },
  { date: "2026-04-01", index: 113.0 },
];

// Per-material price series derived from CMI index movement
// Base prices (CGD Q1/2569) × (CMI_t / CMI_latest)
const BASE: Record<string, number> = {
  CEMENT_001: 175,
  SAND_001: 480,
  REBAR_DB12: 24200,
  TILE_001: 220,
  PAINT_INT_001: 1250,
  BRICK_001: 180,
  CONCRETE_240: 2800,
};
const CMI_LATEST = 113.0;

async function writeHistoryPoint(date: string, prices: Record<string, number>) {
  const r = await fetch(`${WORKER_URL}/api/admin/snapshot-history`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": TOKEN!,
    },
    body: JSON.stringify({ date, province: 10, source: "tpso", prices }),
  });
  const j = (await r.json()) as { ok?: boolean; written?: number };
  const status = j.ok ? "✅" : "❌";
  console.log(`${status} ${date} written=${j.written ?? 0}`);
  if (!j.ok) console.error(j);
}

async function main() {
  console.log("=== Backfill TPSO 9-month history ===\n");
  for (const { date, index } of HISTORY) {
    const scale = index / CMI_LATEST;
    const prices: Record<string, number> = {};
    for (const [id, base] of Object.entries(BASE)) {
      prices[id] = Math.round(base * scale);
    }
    await writeHistoryPoint(date, prices);
  }
  console.log("\nDone.");
}

main().catch(console.error);
