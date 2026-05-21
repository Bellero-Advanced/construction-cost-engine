"use client";

import { useEffect, useState } from "react";
import { Doc } from "@/components/ui/Doc";
import { Field, Select } from "@/components/ui/Field";
import { Stat, Th, Td } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { PROVINCES } from "@/data/provinces";
import { SOURCES } from "@/data/sources";

interface SourceHealth {
  source: string;
  name: string;
  type: string;
  ttlSec: number;
  total: number;
  fresh: number;
  ok: number;
  stale: number;
  missing: number;
  oldestFetchedAt: string | null;
  newestFetchedAt: string | null;
}

interface HealthResponse {
  province: number;
  materials: number;
  sources: SourceHealth[];
  summary: {
    fresh: number;
    ok: number;
    stale: number;
    missing: number;
    totalCells: number;
    coverage: number;
  };
}

export default function HealthPage() {
  const [province, setProvince] = useState<number>(10);
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(`/api/sources/health?province=${province}`, {
          cache: "no-store",
        });
        if (!r.ok) {
          if (!cancelled) setData(null);
          return;
        }
        const d = (await r.json()) as HealthResponse;
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [province]);

  return (
    <div className="page-in">
      <Doc tag="OPS / SOURCE HEALTH">
        <h3 className="mb-2 font-display text-[28px]">
          Source Health Dashboard
        </h3>
        <p className="mb-4 text-[13px] text-ink-2">
          Aggregated freshness ของทุกแหล่งข้อมูล × วัสดุ ที่จังหวัดที่เลือก.
          ดูได้ว่า source ไหนสด, ไหน stale, ไหน missing — สำหรับ ops/monitoring.
        </p>
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
          <Field label="จังหวัด" className="mb-0">
            <Select
              value={province}
              onChange={(e) => setProvince(parseInt(e.target.value, 10))}
            >
              {PROVINCES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.region}
                </option>
              ))}
            </Select>
          </Field>
          {loading && (
            <span className="font-mono text-[11px] text-ink-3">โหลด…</span>
          )}
        </div>
      </Doc>

      {data && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat
              label="COVERAGE"
              value={data.summary.coverage.toFixed(1) + "%"}
              accent={
                data.summary.coverage > 70
                  ? "teal"
                  : data.summary.coverage > 30
                    ? "amber"
                    : "red"
              }
            />
            <Stat
              label="FRESH"
              value={String(data.summary.fresh)}
              accent="teal"
            />
            <Stat label="OK" value={String(data.summary.ok)} accent="amber" />
            <Stat
              label="STALE"
              value={String(data.summary.stale)}
              accent="red"
            />
            <Stat
              label="MISSING"
              value={String(data.summary.missing)}
              accent="red"
            />
          </div>

          <Doc tag="PER-SOURCE BREAKDOWN">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-ink text-amber-bright">
                <tr>
                  <Th>SOURCE</Th>
                  <Th>TYPE</Th>
                  <Th align="right">FRESH</Th>
                  <Th align="right">OK</Th>
                  <Th align="right">STALE</Th>
                  <Th align="right">MISSING</Th>
                  <Th align="right">COVERAGE</Th>
                  <Th>NEWEST</Th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s) => {
                  const cov =
                    s.total > 0 ? ((s.fresh + s.ok) / s.total) * 100 : 0;
                  return (
                    <tr key={s.source} className="hover:bg-paper-2">
                      <Td>
                        <span
                          className="mr-2 inline-block h-2 w-2 align-middle"
                          style={{ background: SOURCES[s.source].color }}
                        />
                        <strong>{s.name}</strong>
                      </Td>
                      <Td className="font-mono text-[11px] text-ink-3">
                        {s.type}
                      </Td>
                      <Td align="right" mono>
                        {s.fresh > 0 ? (
                          <Badge variant="green">{s.fresh}</Badge>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td align="right" mono>
                        {s.ok > 0 ? <Badge variant="amber">{s.ok}</Badge> : "—"}
                      </Td>
                      <Td align="right" mono>
                        {s.stale > 0 ? (
                          <Badge variant="red">{s.stale}</Badge>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td align="right" mono>
                        {s.missing > 0 ? (
                          <Badge variant="line">{s.missing}</Badge>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td align="right" mono className="font-bold">
                        {cov.toFixed(0)}%
                      </Td>
                      <Td className="font-mono text-[10px] text-ink-3">
                        {s.newestFetchedAt
                          ? new Date(s.newestFetchedAt).toLocaleString("th-TH")
                          : "—"}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Doc>
        </>
      )}
    </div>
  );
}
