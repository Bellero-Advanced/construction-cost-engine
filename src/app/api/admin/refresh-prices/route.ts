import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { listRegisteredProviders } from "@/lib/livePrice";
import { refreshTpsoIndex } from "@/lib/scrapers/tpso";
import type { CmiSnapshot } from "@/lib/scrapers/tpso";

export const runtime = "edge";

async function getKv(): Promise<KVNamespace | undefined> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.env as { PRICES_KV?: KVNamespace } | undefined)?.PRICES_KV;
  } catch {
    return undefined;
  }
}

async function getExpectedToken(): Promise<string | undefined> {
  try {
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.env as { ADMIN_REFRESH_TOKEN?: string } | undefined)
      ?.ADMIN_REFRESH_TOKEN;
  } catch {
    return process.env.ADMIN_REFRESH_TOKEN;
  }
}

async function runRefresh(): Promise<{
  ok: boolean;
  results: { provider: string; ok: boolean; snapshot?: CmiSnapshot | null }[];
}> {
  const kv = await getKv();
  const out: {
    provider: string;
    ok: boolean;
    snapshot?: CmiSnapshot | null;
  }[] = [];

  // TPSO
  try {
    const snap = await refreshTpsoIndex(kv);
    out.push({ provider: "tpso", ok: !!snap, snapshot: snap });
  } catch (e) {
    out.push({ provider: "tpso", ok: false, snapshot: null });
    console.error("tpso refresh failed:", (e as Error).message);
  }

  return { ok: out.some((r) => r.ok), results: out };
}

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  const expected = await getExpectedToken();
  if (expected && token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runRefresh();
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wantsRun = url.searchParams.get("run") === "1";
  const token =
    req.headers.get("x-admin-token") ?? url.searchParams.get("token");
  const expected = await getExpectedToken();

  if (wantsRun) {
    if (expected && token !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const result = await runRefresh();
    return NextResponse.json(result);
  }

  return NextResponse.json({
    ok: true,
    info: "POST or GET ?run=1 with x-admin-token / ?token= to refresh. Configured cron: weekly Sun 03:17 UTC (see wrangler.jsonc).",
    providers: listRegisteredProviders(),
  });
}
