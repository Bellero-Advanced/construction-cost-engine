/**
 * GET /api/sources/freshness
 *
 * Calls the data.go.th CKAN API for each official government dataset
 * (TPSO construction-material price index, CGD contracts) and returns
 * when each dataset was last refreshed upstream.
 *
 * This is a real, verifiable integration — no scraping required, the
 * CKAN API is public and stable. The PDF inside still needs OCR to
 * extract per-material prices, but this endpoint at least proves
 * connectivity and surfaces upstream freshness to users.
 */

import { NextResponse } from "next/server";

export const revalidate = 3600; // 1 hour edge cache

interface CkanPackage {
  result?: {
    title?: string;
    metadata_modified?: string;
    last_updated_date?: string;
    num_resources?: number;
    resources?: Array<{
      name?: string;
      format?: string;
      url?: string;
      last_modified?: string | null;
    }>;
  };
}

const DATASETS: Array<{ key: string; ckanId: string; sourceLabel: string }> = [
  {
    key: "tpso",
    ckanId: "gdpublish-tpso-repo-4",
    sourceLabel: "TPSO — ดัชนีราคาวัสดุก่อสร้าง",
  },
  // CGD publishes monthly packages on data.go.th with the naming pattern
  // `cmicgd<MMYY>` / `cgd<MMYY>`. We point at the most recent known package
  // (April 2569 BE = April 2026). data.go.th will return 404 if it's been
  // superseded — that's fine, the endpoint surfaces the error.
  {
    key: "cgd",
    ckanId: "cmicgd042569",
    sourceLabel: "CGD — กรมบัญชีกลาง (เม.ย. 2569)",
  },
];

async function fetchOne(ckanId: string) {
  try {
    const r = await fetch(
      `https://data.go.th/api/3/action/package_show?id=${encodeURIComponent(ckanId)}`,
      {
        signal: AbortSignal.timeout(6000),
        headers: { accept: "application/json" },
      },
    );
    if (!r.ok) return { ok: false, status: r.status };
    const data: CkanPackage = await r.json();
    const p = data.result;
    if (!p) return { ok: false, status: 200, error: "no result" };
    const top = p.resources?.[0];
    return {
      ok: true,
      title: p.title ?? null,
      lastModified: p.metadata_modified ?? null,
      upstreamLastUpdated: p.last_updated_date ?? null,
      numResources: p.num_resources ?? 0,
      latestResource: top
        ? {
            name: top.name ?? null,
            format: top.format ?? null,
            url: top.url ?? null,
            lastModified: top.last_modified ?? null,
          }
        : null,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function GET() {
  const results = await Promise.all(
    DATASETS.map(async (d) => ({
      key: d.key,
      sourceLabel: d.sourceLabel,
      ckanId: d.ckanId,
      ...(await fetchOne(d.ckanId)),
    })),
  );

  return NextResponse.json(
    {
      checkedAt: new Date().toISOString(),
      datasets: results,
      note: "Upstream freshness for govt sources. Retail sources (HomePro, Global House, Thai Watsadu, BnB) are SPA-only and not represented here.",
    },
    {
      headers: {
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    },
  );
}
