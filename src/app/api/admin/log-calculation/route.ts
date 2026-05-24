/**
 * POST /api/admin/log-calculation
 * Saves a completed BOQ calculation to KV as fact_calculations.
 * Key: calc:{uuid} — TTL 365 days.
 */
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CalcResult } from "@/types";

async function getEnv() {
  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as CloudflareEnv | undefined;
    return { kv: env?.PRICES_KV, token: env?.ADMIN_REFRESH_TOKEN };
  } catch {
    return { kv: undefined, token: process.env.ADMIN_REFRESH_TOKEN };
  }
}

function uuid() {
  return crypto.randomUUID();
}

export async function POST(req: Request) {
  const { kv } = await getEnv();
  if (!kv)
    return NextResponse.json({ error: "KV unavailable" }, { status: 503 });

  let body: CalcResult;
  try {
    body = (await req.json()) as CalcResult;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.workName || !body.source) {
    return NextResponse.json(
      { error: "missing required fields" },
      { status: 400 },
    );
  }

  const id = uuid();
  const record = { ...body, savedAt: new Date().toISOString() };
  await kv.put(`calc:${id}`, JSON.stringify(record), {
    expirationTtl: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true, id });
}
