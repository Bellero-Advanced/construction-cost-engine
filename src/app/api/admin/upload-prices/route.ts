/**
 * POST /api/admin/upload-prices
 *
 * Manual price ingest path — auth-gated. Accepts a JSON body shaped like
 *   { source: "cgd", province: 10, prices: { CEMENT_001: 175, SAND_001: 480, ... } }
 * and writes each entry to the same KV cache key the providers read from,
 * with `fetchedAt = now`. The /api/prices/[source]/[material] route will
 * serve these values transparently (live=true, available=true).
 *
 * Use cases:
 *  - CGD / DIT data that the auto-scrapers can't reach (anti-bot / no API)
 *  - Retail sites that block Cloudflare Browser Rendering IPs
 *  - Spot fixes when a scraper goes stale
 *
 * curl example:
 *   curl -X POST $WORKER/api/admin/upload-prices \
 *     -H "x-admin-token: $TOKEN" \
 *     -H "content-type: application/json" \
 *     -d '{"source":"cgd","province":10,"prices":{"CEMENT_001":175}}'
 */

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { MATERIALS } from "@/data/materials";
import { SOURCES } from "@/data/sources";
import { PROVINCES } from "@/data/provinces";

async function getEnv() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as CloudflareEnv | undefined;
    return { kv: env?.PRICES_KV, token: env?.ADMIN_REFRESH_TOKEN };
  } catch {
    return { kv: undefined, token: process.env.ADMIN_REFRESH_TOKEN };
  }
}

interface UploadBody {
  source: string;
  province: number;
  prices: Record<string, number>;
  ttlSec?: number;
}

const DEFAULT_TTL_BY_SOURCE: Record<string, number> = {
  tpso: 60 * 60 * 24 * 30,
  cgd: 60 * 60 * 24 * 30,
  dit: 60 * 60 * 24 * 30,
  homepro: 60 * 60 * 24 * 14,
  globalhouse: 60 * 60 * 24 * 30,
  thaiwatsadu: 60 * 60 * 24 * 30,
  bnb: 60 * 60 * 24 * 30,
  scghome: 60 * 60 * 24 * 30,
  dohome: 60 * 60 * 24 * 30,
  megahome: 60 * 60 * 24 * 14,
};

export async function POST(req: Request) {
  const { kv, token } = await getEnv();
  const reqToken = req.headers.get("x-admin-token");
  if (token && reqToken !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!kv) {
    return NextResponse.json({ error: "KV unavailable" }, { status: 503 });
  }

  let body: UploadBody;
  try {
    body = (await req.json()) as UploadBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.source || !SOURCES[body.source]) {
    return NextResponse.json(
      { error: "unknown source", got: body.source },
      { status: 400 },
    );
  }
  if (!PROVINCES.find((p) => p.id === body.province)) {
    return NextResponse.json(
      { error: "unknown province", got: body.province },
      { status: 400 },
    );
  }
  if (!body.prices || typeof body.prices !== "object") {
    return NextResponse.json({ error: "missing prices" }, { status: 400 });
  }

  const ttlSec =
    body.ttlSec ?? DEFAULT_TTL_BY_SOURCE[body.source] ?? 60 * 60 * 24;
  const now = Date.now();
  const written: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const [materialId, raw] of Object.entries(body.prices)) {
    if (!MATERIALS[materialId]) {
      skipped.push({ id: materialId, reason: "unknown material" });
      continue;
    }
    const price = Number(raw);
    if (!Number.isFinite(price) || price <= 0) {
      skipped.push({ id: materialId, reason: "invalid price" });
      continue;
    }
    const key = `${body.source}:${materialId}:${body.province}`;
    await kv.put(key, JSON.stringify({ price, fetchedAt: now }), {
      expirationTtl: Math.max(60, ttlSec),
    });
    written.push(materialId);
  }

  return NextResponse.json({
    ok: true,
    source: body.source,
    province: body.province,
    written,
    skipped,
    ttlSec,
    fetchedAt: new Date(now).toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    usage:
      "POST {source,province,prices:{materialId:price}} with x-admin-token header. " +
      "Writes directly to the KV cache that /api/prices/[source]/[material] reads.",
    supportedSources: Object.keys(SOURCES),
    materialIds: Object.keys(MATERIALS),
  });
}
