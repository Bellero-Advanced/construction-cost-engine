/**
 * POST /api/admin/ai-agent
 *
 * Endpoint for AI agent (LLM-based) to submit prices it researched from
 * retail websites that cannot be auto-scraped. Writes to the same KV keys
 * as upload-prices AND appends to history time-series.
 *
 * Body: { source, province, prices: Record<string, number>, date? }
 * Auth: x-admin-token header
 */

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { MATERIALS } from "@/data/materials";
import { SOURCES } from "@/data/sources";
import { PROVINCES } from "@/data/provinces";

const DEFAULT_TTL: Record<string, number> = {
  boonthavorn: 60 * 60 * 24 * 30,
  megahome: 60 * 60 * 24 * 14,
  globalhouse: 60 * 60 * 24 * 30,
  thaiwatsadu: 60 * 60 * 24 * 30,
  bnb: 60 * 60 * 24 * 30,
  scghome: 60 * 60 * 24 * 30,
  dohome: 60 * 60 * 24 * 30,
  cgd: 60 * 60 * 24 * 30,
  dit: 60 * 60 * 24 * 30,
};

async function getEnv() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as CloudflareEnv | undefined;
    return { kv: env?.PRICES_KV, token: env?.ADMIN_REFRESH_TOKEN };
  } catch {
    return { kv: undefined, token: process.env.ADMIN_REFRESH_TOKEN };
  }
}

interface HistoryEntry {
  date: string;
  price: number;
}

export async function POST(req: Request) {
  const { kv, token } = await getEnv();
  const reqToken = req.headers.get("x-admin-token");
  if (token && reqToken !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!kv) {
    return NextResponse.json({ error: "KV unavailable" }, { status: 503 });
  }

  let body: {
    source: string;
    province: number;
    prices: Record<string, number>;
    date?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body.source || !SOURCES[body.source]) {
    return NextResponse.json({ error: "unknown source" }, { status: 400 });
  }
  if (!PROVINCES.find((p) => p.id === body.province)) {
    return NextResponse.json({ error: "unknown province" }, { status: 400 });
  }
  if (!body.prices || typeof body.prices !== "object") {
    return NextResponse.json({ error: "missing prices" }, { status: 400 });
  }

  const ttlSec = DEFAULT_TTL[body.source] ?? 60 * 60 * 24;
  const now = Date.now();
  const today = body.date ?? new Date().toISOString().slice(0, 10);
  const written: string[] = [];
  const skipped: string[] = [];

  for (const [materialId, raw] of Object.entries(body.prices)) {
    if (!MATERIALS[materialId]) {
      skipped.push(materialId);
      continue;
    }
    const price = Number(raw);
    if (!Number.isFinite(price) || price <= 0) {
      skipped.push(materialId);
      continue;
    }

    // Write live price (same key format as upload-prices)
    const priceKey = `${body.source}:${materialId}:${body.province}`;
    await kv.put(priceKey, JSON.stringify({ price, fetchedAt: now }), {
      expirationTtl: Math.max(60, ttlSec),
    });

    // Append to history time-series (same format as snapshot-history)
    const histKey = `history:${body.source}:${materialId}:${body.province}`;
    const existing = (await kv.get<HistoryEntry[]>(histKey, "json")) ?? [];
    if (!existing.some((e) => e.date === today)) {
      existing.push({ date: today, price });
      if (existing.length > 365) existing.splice(0, existing.length - 365);
      await kv.put(histKey, JSON.stringify(existing));
    }

    written.push(materialId);
  }

  return NextResponse.json({
    ok: true,
    source: body.source,
    province: body.province,
    date: today,
    written: written.length,
    skipped: skipped.length,
    writtenIds: written,
  });
}
