"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Doc } from "@/components/ui/Doc";
import { Field, Select } from "@/components/ui/Field";
import { Stat, Th, Td } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MATERIALS } from "@/data/materials";
import { PROVINCES } from "@/data/provinces";
import { SOURCES } from "@/data/sources";
import { downloadCsv, toCsv } from "@/lib/csv";
import { fmt, fmtInt } from "@/lib/utils";

interface CompareSourceRow {
  source: string;
  sourceName: string;
  sourceType: string;
  price: number | null;
  live: boolean;
  available: boolean;
  fetchedAt: string | null;
}
interface CompareResponse {
  material: string;
  materialName: string;
  province: number;
  sources: CompareSourceRow[];
  summary: {
    liveCount: number;
    totalSources: number;
    min: number | null;
    max: number | null;
    avg: number | null;
    median: number | null;
    spreadPct: number | null;
  };
}

const GROUPS: { key: "wall_tile" | "column_beam" | "rebar"; label: string }[] =
  [
    { key: "wall_tile", label: "🧱 งานผนัง-กระเบื้อง" },
    { key: "column_beam", label: "🏛 งานเสา-คาน" },
    { key: "rebar", label: "⛓ งานเหล็กเสริม" },
  ];

export default function CompareSourcesPage() {
  const [material, setMaterial] = useState<string>("CEMENT_001");
  const [province, setProvince] = useState<number>(10);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch(
          `/api/compare/${encodeURIComponent(material)}?province=${province}`,
          { cache: "no-store" },
        );
        if (!r.ok) {
          if (!cancelled) setData(null);
          return;
        }
        const d = (await r.json()) as CompareResponse;
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [material, province]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.sources
      .filter((s) => s.price != null)
      .map((s) => ({
        source: s.source.toUpperCase(),
        price: s.price as number,
        color: SOURCES[s.source].color,
      }));
  }, [data]);

  const prov = PROVINCES.find((p) => p.id === province);

  return (
    <div className="page-in">
      <Doc tag="DATA-02 / CROSS-SOURCE COMPARE">
        <h3 className="mb-2 font-display text-[28px]">
          เปรียบเทียบราคา ข้ามแหล่งข้อมูล
        </h3>
        <p className="mb-4 text-[13px] text-ink-2">
          เลือกวัสดุ + จังหวัด → ดูราคาจากทุกแหล่งพร้อมกัน (รัฐ + ค้าปลีก)
          เพื่อเช็ค spread, หา outlier, และตัดสินใจว่าจะอ้างราคาตัวไหนใน BoQ
        </p>
        <div className="grid items-end gap-3 md:grid-cols-3">
          <Field label="วัสดุ" className="mb-0">
            <Select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            >
              {GROUPS.map((g) => (
                <optgroup key={g.key} label={g.label}>
                  {Object.values(MATERIALS)
                    .filter((m) => m.work === g.key)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </Select>
          </Field>
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
          <Button
            variant="dark"
            disabled={!data}
            onClick={() => {
              if (!data) return;
              const rows = data.sources.map((s) => ({
                source: s.source,
                source_name: s.sourceName,
                source_type: s.sourceType,
                price: s.price ?? "",
                live: s.live,
                available: s.available,
                fetched_at: s.fetchedAt ?? "",
              }));
              downloadCsv(
                `compare_${material}_${province}_${new Date()
                  .toISOString()
                  .slice(0, 10)}.csv`,
                toCsv(rows),
              );
            }}
          >
            Export CSV
          </Button>
        </div>
      </Doc>

      {loading && <p className="font-mono text-[12px] text-ink-3">โหลด…</p>}

      {data && !loading && (
        <>
          {(() => {
            const mat = MATERIALS[material];
            const c = mat?.canonical;
            const specChips: string[] = [];
            if (c?.brand) specChips.push(c.brand);
            if (c?.size) specChips.push(c.size);
            if (c?.grade) specChips.push(c.grade);
            const highSpread =
              data.summary.spreadPct != null && data.summary.spreadPct > 30;
            return (
              <Doc tag="MATCHING / TRUST">
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  <span className="font-mono text-ink-3">
                    Canonical spec:
                  </span>
                  {specChips.length > 0 ? (
                    specChips.map((t) => (
                      <Badge key={t} variant="line">
                        {t}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-ink-3">— (no canonical filter)</span>
                  )}
                  <span className="ml-auto font-mono text-[11px] text-ink-3">
                    Government = Official BoQ · Modern Trade = Market price
                  </span>
                </div>
                {highSpread && (
                  <p className="mt-3 border-l-2 border-amber-bright bg-paper-2 p-2 font-mono text-[11px] text-ink-2">
                    ⚠ Spread &gt; 30% — ราคาที่ได้เป็น{" "}
                    <strong>Indicative range</strong> เท่านั้น แต่ละแหล่งอาจ
                    match สินค้าต่าง brand/size; ใช้คอลัมน์ TYPE
                    เป็นตัวตัดสินใจ (Government = ราคาประเมินทางการ).
                  </p>
                )}
              </Doc>
            );
          })()}

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat
              label="LIVE / ทั้งหมด"
              value={`${data.summary.liveCount} / ${data.summary.totalSources}`}
              accent="teal"
            />
            <Stat
              label="ต่ำสุด"
              value={data.summary.min != null ? fmt(data.summary.min) : "—"}
              accent="amber"
            />
            <Stat
              label="สูงสุด"
              value={data.summary.max != null ? fmt(data.summary.max) : "—"}
              accent="amber"
            />
            <Stat
              label="ค่าเฉลี่ย"
              value={data.summary.avg != null ? fmt(data.summary.avg) : "—"}
              accent="teal"
            />
            <Stat
              label="Spread"
              value={
                data.summary.spreadPct != null
                  ? data.summary.spreadPct.toFixed(1) + "%"
                  : "—"
              }
              accent={
                data.summary.spreadPct != null && data.summary.spreadPct > 30
                  ? "red"
                  : "teal"
              }
            />
          </div>

          {chartData.length > 0 && (
            <Doc tag="CHART-COMPARE">
              <h3 className="mb-3 font-display text-[22px]">
                ▌ {data.materialName} @ {prov?.name}
              </h3>
              <div className="h-[340px] border border-dashed border-line bg-paper p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede5d3" />
                    <XAxis
                      dataKey="source"
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0a1628",
                        border: "1.5px solid #d97706",
                        color: "#f5f1e8",
                        fontFamily: "JetBrains Mono",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="price">
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Doc>
          )}

          <Doc tag="TABLE / ALL SOURCES">
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-ink text-amber-bright">
                <tr>
                  <Th>SOURCE</Th>
                  <Th>TYPE</Th>
                  <Th align="right">PRICE</Th>
                  <Th align="center">STATUS</Th>
                  <Th>FETCHED AT</Th>
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s) => (
                  <tr key={s.source} className="hover:bg-paper-2">
                    <Td>
                      <span
                        className="mr-2 inline-block h-2 w-2 align-middle"
                        style={{ background: SOURCES[s.source].color }}
                      />
                      <strong>{s.sourceName}</strong>
                    </Td>
                    <Td className="font-mono text-[11px] text-ink-3">
                      {s.sourceType}
                    </Td>
                    <Td align="right" mono className="font-bold">
                      {s.price != null ? fmtInt(s.price) : "—"}
                    </Td>
                    <Td align="center">
                      {s.price != null ? (
                        <Badge variant="green">LIVE</Badge>
                      ) : s.available ? (
                        <Badge variant="amber">PENDING</Badge>
                      ) : (
                        <Badge variant="line">—</Badge>
                      )}
                    </Td>
                    <Td className="font-mono text-[10px] text-ink-3">
                      {s.fetchedAt
                        ? new Date(s.fetchedAt).toLocaleString("th-TH")
                        : "—"}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Doc>
        </>
      )}
    </div>
  );
}
