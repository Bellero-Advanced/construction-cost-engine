/**
 * POST /api/admin/snapshot-history
 *
 * Called daily by GH Actions cron. For every material × govt source that
 * has a cached live price in KV, appends today's price to a KV time-series
 * key like `history:dit:CEMENT_001:10` → [{date,price},…]. The trend
 * page reads these series.
 */

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getLivePrice } from "@/lib/livePrice";
import { MATERIALS } from "@/data/materials";
import { SOURCE_KEYS } from "@/data/sources";
import type { SourceKey } from "@/types";

// All registered sources — govt + retail. Retail snapshots let the trend
// page chart price spreads across e-commerce vs official indices.
const ALL_SOURCES = SOURCE_KEYS as readonly SourceKey[];
const DEFAULT_PROVINCE = 10;
const MAX_HISTORY = 365;

async function getEnv() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as CloudflareEnv | undefined;
    return { kv: env?.PRICES_KV, token: env?.ADMIN_REFRESH_TOKEN };
  } catch {
    return { kv: undefined, token: process.env.ADMIN_REFRESH_TOKEN };
  }
}

export interface HistoryEntry {
  date: string;
  price: number;
}

export async function POST(req: Request) {
  const { kv, token } = await getEnv();
  const reqToken =
    req.headers.get("x-admin-token") ??
    new URL(req.url).searchParams.get("token");
  if (token && reqToken !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!kv) {
    return NextResponse.json({ error: "KV not available" }, { status: 503 });
  }

  // Backfill mode: body may supply { date, province, source, prices }
  let body: {
    date?: string;
    province?: number;
    source?: string;
    prices?: Record<string, number>;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    /* no body = normal cron mode */
  }

  const today = body.date ?? new Date().toISOString().slice(0, 10);
  const materialIds = Object.keys(MATERIALS);
  let written = 0;
  let skipped = 0;

  // Backfill path: write supplied prices directly to history keys
  if (body.prices && body.source) {
    const province = body.province ?? DEFAULT_PROVINCE;
    for (const [mid, price] of Object.entries(body.prices)) {
      if (!MATERIALS[mid]) {
        skipped++;
        continue;
      }
      const histKey = `history:${body.source}:${mid}:${province}`;
      const existing = (await kv.get<HistoryEntry[]>(histKey, "json")) ?? [];
      if (existing.some((e) => e.date === today)) {
        skipped++;
        continue;
      }
      existing.push({ date: today, price });
      existing.sort((a, b) => a.date.localeCompare(b.date));
      const trimmed =
        existing.length > MAX_HISTORY ? existing.slice(-MAX_HISTORY) : existing;
      await kv.put(histKey, JSON.stringify(trimmed), {
        expirationTtl: 60 * 60 * 24 * 400,
      });
      written++;
    }
    return NextResponse.json({ ok: true, date: today, written, skipped });
  }

  // Normal cron path: read live prices from KV and snapshot
  const ALL_SOURCES = SOURCE_KEYS as readonly SourceKey[];
  for (const src of ALL_SOURCES) {
    for (const mid of materialIds) {
      const result = await getLivePrice(src, mid, DEFAULT_PROVINCE);
      if (result.price == null) {
        skipped++;
        continue;
      }

      const histKey = `history:${src}:${mid}:${DEFAULT_PROVINCE}`;
      const existing = (await kv.get<HistoryEntry[]>(histKey, "json")) ?? [];
      if (existing.length > 0 && existing[existing.length - 1].date === today) {
        skipped++;
        continue;
      }

      existing.push({ date: today, price: result.price });
      const trimmed =
        existing.length > MAX_HISTORY ? existing.slice(-MAX_HISTORY) : existing;
      await kv.put(histKey, JSON.stringify(trimmed), {
        expirationTtl: 60 * 60 * 24 * 400,
      });
      written++;
    }
  }

  return NextResponse.json({ ok: true, today, written, skipped });
}
