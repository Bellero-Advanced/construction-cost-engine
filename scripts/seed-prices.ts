/**
 * Sprint 2 — AI-research price seed
 * Run: npx tsx scripts/seed-prices.ts
 *
 * Sources (AI-researched, Q1-Q2/2569):
 *   CGD  — กรมบัญชีกลาง ราคามาตรฐาน Q1/2569
 *   DIT  — กรมการค้าภายใน bulletin Q1/2569
 *   Boonthavorn — web catalog Q2/2026
 *   Paint — TOA/Beger/Dulux published catalog Q1/2569
 *   Brick — Q-CON/Superblock/HomePro Q2/2026
 *
 * ⚠ Verify 20% sample before thesis defense.
 */

const WORKER_URL =
  process.env.WORKER_URL ??
  "https://construction-cost-engine.steep-tooth-c420.workers.dev";
const TOKEN = process.env.ADMIN_REFRESH_TOKEN;

if (!TOKEN) {
  console.error("Set ADMIN_REFRESH_TOKEN env var");
  process.exit(1);
}

interface UploadPayload {
  source: string;
  province: number;
  prices: Record<string, number>;
  ttlSec?: number;
}

async function upload(payload: UploadPayload) {
  const r = await fetch(`${WORKER_URL}/api/admin/upload-prices`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": TOKEN!,
    },
    body: JSON.stringify(payload),
  });
  const j = (await r.json()) as {
    ok?: boolean;
    written?: string[];
    skipped?: unknown[];
  };
  const status = j.ok ? "✅" : "❌";
  console.log(
    `${status} ${payload.source} prov=${payload.province} written=${j.written?.length ?? 0} skipped=${(j.skipped as unknown[])?.length ?? 0}`,
  );
  if (!j.ok) console.error(j);
}

// ── CGD — กรมบัญชีกลาง ราคามาตรฐาน Q1/2569 ──────────────────────────────
const CGD_PRICES: Record<string, number> = {
  CEMENT_001: 175,
  SAND_001: 480,
  ROCK_001: 650,
  REBAR_RB6: 25500,
  REBAR_RB9: 25000,
  REBAR_DB10: 24800,
  REBAR_DB12: 24200,
  REBAR_DB16: 23900,
  REBAR_DB20: 23700,
  REBAR_DB25: 23500,
  TILE_001: 220,
  TILE_002: 195,
  ADHESIVE_001: 180,
  GROUT_001: 65,
  WIRE_001: 38,
  NAIL_001: 42,
  FORM_WOOD_001: 520,
  PAINT_INT_001: 1250,
  PAINT_EXT_001: 1590,
  PRIMER_001: 820,
  BRICK_001: 180,
  BRICK_002: 2200,
  CONCRETE_240: 2800,
  CONCRETE_280: 3100,
};

// ── DIT — กรมการค้าภายใน Q1/2569 ────────────────────────────────────────
const DIT_PRICES: Record<string, number> = {
  CEMENT_001: 195,
  SAND_001: 510,
  ROCK_001: 680,
  REBAR_DB12: 24800,
  TILE_001: 245,
  PAINT_INT_001: 1290,
  PAINT_EXT_001: 1650,
  BRICK_001: 190,
  CONCRETE_240: 2900,
};

// ── Boonthavorn — web catalog Q2/2026 ────────────────────────────────────
const BOONTHAVORN_PRICES: Record<string, number> = {
  CEMENT_001: 215,
  SAND_001: 540,
  REBAR_DB12: 685 * 12, // 685 ฿/เส้น 12m → ≈ 8,220 ฿/ตัน (wpm=0.888 kg/m → 10.656 kg/เส้น → ~64 เส้น/ตัน)
  TILE_001: 289,
  ADHESIVE_001: 195,
  GROUT_001: 79,
  PAINT_INT_001: 1350,
  PAINT_EXT_001: 1750,
  PRIMER_001: 890,
  BRICK_001: 210,
  BRICK_002: 3200,
};

// ── Regional variants — 5 key materials × 5 provinces ────────────────────
// Source: TPSO CMI Q1/2569 regional bulletin
const REGIONAL: Array<{
  province: number;
  region: string;
  mult: Record<string, number>;
}> = [
  {
    province: 50,
    region: "เหนือ/เชียงใหม่",
    mult: {
      CEMENT_001: 195,
      SAND_001: 520,
      REBAR_DB12: 25300,
      TILE_001: 255,
      PAINT_INT_001: 1380,
    },
  },
  {
    province: 40,
    region: "อีสาน/ขอนแก่น",
    mult: {
      CEMENT_001: 188,
      SAND_001: 550,
      REBAR_DB12: 25000,
      TILE_001: 248,
      PAINT_INT_001: 1310,
    },
  },
  {
    province: 20,
    region: "ตะวันออก/ชลบุรี",
    mult: {
      CEMENT_001: 178,
      SAND_001: 490,
      REBAR_DB12: 24400,
      TILE_001: 228,
      PAINT_INT_001: 1270,
    },
  },
  {
    province: 90,
    region: "ใต้/สงขลา",
    mult: {
      CEMENT_001: 215,
      SAND_001: 680,
      REBAR_DB12: 26200,
      TILE_001: 285,
      PAINT_INT_001: 1450,
    },
  },
  {
    province: 70,
    region: "ตะวันตก/ราชบุรี",
    mult: {
      CEMENT_001: 180,
      SAND_001: 500,
      REBAR_DB12: 24500,
      TILE_001: 232,
      PAINT_INT_001: 1260,
    },
  },
];

async function main() {
  console.log("=== Seed prices — Sprint 2 ===\n");

  // CGD — province 10 (กทม.)
  await upload({
    source: "cgd",
    province: 10,
    prices: CGD_PRICES,
    ttlSec: 60 * 60 * 24 * 90,
  });

  // DIT — province 10
  await upload({
    source: "dit",
    province: 10,
    prices: DIT_PRICES,
    ttlSec: 60 * 60 * 24 * 30,
  });

  // Boonthavorn — province 10
  await upload({
    source: "boonthavorn",
    province: 10,
    prices: BOONTHAVORN_PRICES,
    ttlSec: 60 * 60 * 24 * 30,
  });

  // Regional CGD variants
  for (const r of REGIONAL) {
    await upload({
      source: "cgd",
      province: r.province,
      prices: r.mult,
      ttlSec: 60 * 60 * 24 * 90,
    });
  }

  console.log("\nDone.");
}

main().catch(console.error);
