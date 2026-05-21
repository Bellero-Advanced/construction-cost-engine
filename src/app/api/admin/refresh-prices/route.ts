import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { listRegisteredProviders } from "@/lib/livePrice";
import { refreshTpsoIndex } from "@/lib/scrapers/tpso";
import { refreshCgdIndex } from "@/lib/scrapers/cgd";
import { refreshDitIndex } from "@/lib/scrapers/dit";

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

interface RefreshResult {
  provider: string;
  ok: boolean;
  snapshot?: unknown;
  error?: string;
}

const REFRESHERS: Record<
  string,
  (kv: KVNamespace | undefined) => Promise<unknown>
> = {
  tpso: (kv) => refreshTpsoIndex(kv),
  cgd: (kv) => refreshCgdIndex(kv),
  dit: (kv) => refreshDitIndex(kv),
};

async function runRefresh(only?: string): Promise<{
  ok: boolean;
  results: RefreshResult[];
}> {
  const kv = await getKv();
  const targets = only
    ? [only].filter((k) => k in REFRESHERS)
    : Object.keys(REFRESHERS);
  const out: RefreshResult[] = [];

  for (const name of targets) {
    try {
      const snap = await REFRESHERS[name](kv);
      out.push({ provider: name, ok: !!snap, snapshot: snap });
    } catch (e) {
      out.push({
        provider: name,
        ok: false,
        error: (e as Error).message,
      });
    }
  }

  return { ok: out.some((r) => r.ok), results: out };
}

export async function POST(req: Request) {
  const token = req.headers.get("x-admin-token");
  const expected = await getExpectedToken();
  if (expected && token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const only = url.searchParams.get("source") ?? undefined;
  const result = await runRefresh(only);
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
    const only = url.searchParams.get("source") ?? undefined;
    const result = await runRefresh(only);
    return NextResponse.json(result);
  }

  return NextResponse.json({
    ok: true,
    info: "POST or GET ?run=1 with x-admin-token / ?token= to refresh. Optionally ?source=tpso|cgd|dit to refresh one source. Retail sources (homepro/globalhouse/thaiwatsadu/bnb/scghome/dohome/megahome) refresh on-demand via /api/prices/<source>/<material>.",
    refreshers: Object.keys(REFRESHERS),
    providers: listRegisteredProviders(),
  });
}
