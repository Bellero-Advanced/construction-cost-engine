import { NextResponse } from "next/server";
import { listRegisteredProviders } from "@/lib/livePrice";
import { SOURCES, SOURCE_KEYS } from "@/data/sources";
import type { SourceKey } from "@/types";

export const runtime = "edge";

export async function GET() {
  const live = new Set<SourceKey>(listRegisteredProviders());
  return NextResponse.json({
    sources: SOURCE_KEYS.map((k) => ({
      key: k,
      name: SOURCES[k].name,
      live: live.has(k as SourceKey),
      mode: live.has(k as SourceKey) ? "live" : "mock",
    })),
    note: "Phase 3 architecture stub. No live providers registered yet — see src/lib/scrapers/ and PROVIDERS map in src/lib/livePrice.ts.",
  });
}
