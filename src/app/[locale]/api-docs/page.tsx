import { Doc } from "@/components/ui/Doc";
import { MATERIALS } from "@/data/materials";
import { SOURCES, SOURCE_KEYS } from "@/data/sources";

const ENDPOINTS: {
  method: "GET" | "POST";
  path: string;
  desc: string;
  example?: string;
  auth?: boolean;
}[] = [
  {
    method: "GET",
    path: "/api/prices/:source/:material?province=10",
    desc: "Live price for one material from one source. Returns price (number|null), live (bool), available (bool), fetchedAt, ttlSec.",
    example:
      '/api/prices/homepro/CEMENT_001?province=10  →  {"price":220,"live":true,...}',
  },
  {
    method: "GET",
    path: "/api/compare/:material?province=10",
    desc: "Cross-source comparison. Returns price from every registered source plus summary {min, max, avg, median, spreadPct}.",
    example: "/api/compare/CEMENT_001?province=10",
  },
  {
    method: "GET",
    path: "/api/history/:source/:material?province=10",
    desc: "Time-series snapshots populated daily by the cron job. 30min edge cache.",
    example: "/api/history/dit/CEMENT_001?province=10",
  },
  {
    method: "GET",
    path: "/api/prices/status",
    desc: "Lists all sources with mode (live-headless/live-fetch/live-pdf/live-index/off), TTL, KV cache key counts, and ScrapingBee proxy state.",
  },
  {
    method: "GET",
    path: "/api/sources/freshness",
    desc: "Calls data.go.th CKAN API for each govt dataset; returns upstream metadata_modified + resource list.",
  },
  {
    method: "GET",
    path: "/api/sources/health?province=10",
    desc: "Aggregated freshness across all sources/materials at a province. Counts of fresh/ok/stale/missing per source + overall coverage %.",
    example:
      "/api/sources/health?province=10  →  {sources:[{source,fresh,ok,stale,missing,…}], summary:{coverage:62.5,…}}",
  },
  {
    method: "GET",
    path: "/api/sources/tpso/cmi",
    desc: "TPSO CMI construction-material index (extracted from official PDF).",
  },
  {
    method: "POST",
    path: "/api/admin/upload-prices",
    desc: "Manual ingest. Body: {source,province,prices:{material_id:price}}. Writes directly to KV.",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/admin/refresh-prices?source=tpso",
    desc: "Trigger live re-fetch for one or all sources. Optional ?source filter.",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/admin/snapshot-history",
    desc: "Append today's prices to history KV time-series. Called by GH Actions cron daily.",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/admin/scrape-debug",
    desc: "Returns post-hydration candidate elements (selector/price/outerHTML) for tuning retail scrapers.",
    auth: true,
  },
];

export default function ApiDocsPage() {
  return (
    <div className="page-in">
      <Doc tag="API-DOCS / PUBLIC SURFACE">
        <h3 className="mb-2 font-display text-[28px]">API</h3>
        <p className="mb-4 text-[13px] text-ink-2">
          Public REST endpoints exposed by Construction Cost Engine. All public
          GETs are edge-cached on Cloudflare. Admin endpoints require an{" "}
          <code className="bg-paper-2 px-1 font-mono">x-admin-token</code>{" "}
          header. Rate limit: retail 30/min, govt 120/min, per IP.
        </p>

        <pre className="mt-2 overflow-x-auto border-[1.5px] border-ink bg-ink p-4 font-mono text-[11px] text-paper">
          <div className="mb-2 border-b border-dashed border-line pb-2 text-[10px] uppercase tracking-[0.2em] text-amber-bright">
            BASE URL
          </div>
          https://construction-cost-engine.steep-tooth-c420.workers.dev
        </pre>
      </Doc>

      <Doc tag="ENDPOINTS">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-ink text-amber-bright">
            <tr>
              <th className="border-[1.5px] border-line px-3 py-2 text-left font-mono text-[10px] uppercase">
                Method
              </th>
              <th className="border-[1.5px] border-line px-3 py-2 text-left font-mono text-[10px] uppercase">
                Path
              </th>
              <th className="border-[1.5px] border-line px-3 py-2 text-left font-mono text-[10px] uppercase">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((e) => (
              <tr key={e.method + e.path} className="hover:bg-paper-2">
                <td className="border-[1.5px] border-line px-3 py-2 align-top font-mono text-[11px]">
                  <span
                    className={
                      "inline-block px-2 py-0.5 text-[10px] font-bold uppercase " +
                      (e.method === "GET"
                        ? "bg-teal-700 text-paper"
                        : "bg-amber-700 text-paper")
                    }
                  >
                    {e.method}
                  </span>
                  {e.auth && (
                    <span className="ml-1 inline-block bg-red-800 px-1.5 py-0.5 text-[9px] font-bold uppercase text-paper">
                      auth
                    </span>
                  )}
                </td>
                <td className="border-[1.5px] border-line px-3 py-2 align-top font-mono text-[11px]">
                  {e.path}
                </td>
                <td className="border-[1.5px] border-line px-3 py-2 align-top text-[12px]">
                  {e.desc}
                  {e.example && (
                    <pre className="mt-1 overflow-x-auto bg-paper-2 px-2 py-1 font-mono text-[10px] text-ink-3">
                      {e.example}
                    </pre>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Doc>

      <Doc tag="ENUMS">
        <h3 className="mb-2 font-display text-[18px]">Sources</h3>
        <pre className="mb-4 overflow-x-auto border-[1.5px] border-ink bg-paper-2 p-3 font-mono text-[11px]">
          {SOURCE_KEYS.map(
            (k) =>
              `${String(k).padEnd(14)}  ${SOURCES[k].type.padEnd(10)}  ${SOURCES[k].name}`,
          ).join("\n")}
        </pre>
        <h3 className="mb-2 font-display text-[18px]">
          Materials ({Object.keys(MATERIALS).length})
        </h3>
        <pre className="overflow-x-auto border-[1.5px] border-ink bg-paper-2 p-3 font-mono text-[11px]">
          {Object.values(MATERIALS)
            .map((m) => `${m.id.padEnd(16)}  ${m.unit.padEnd(8)}  ${m.name}`)
            .join("\n")}
        </pre>
      </Doc>

      <Doc tag="EXAMPLE">
        <pre className="overflow-x-auto border-[1.5px] border-ink bg-ink p-4 font-mono text-[11px] leading-relaxed text-paper">
          {`# Live price (HomePro, Bangkok)
curl https://construction-cost-engine.steep-tooth-c420.workers.dev/api/prices/homepro/CEMENT_001?province=10

# Cross-source compare for cement
curl https://construction-cost-engine.steep-tooth-c420.workers.dev/api/compare/CEMENT_001?province=10

# Manual price upload (admin token required)
curl -X POST .../api/admin/upload-prices \\
  -H "x-admin-token: $TOKEN" \\
  -H "content-type: application/json" \\
  -d '{"source":"cgd","province":10,"prices":{"CEMENT_001":175,"SAND_001":480}}'`}
        </pre>
      </Doc>
    </div>
  );
}
