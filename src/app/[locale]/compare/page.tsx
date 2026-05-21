"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Doc } from "@/components/ui/Doc";
import { Badge } from "@/components/ui/Badge";
import { Field, Select } from "@/components/ui/Field";
import { Stat, Th, Td } from "@/components/ui/Stat";
import { MATERIALS } from "@/data/materials";
import { PROVINCES } from "@/data/provinces";
import { SOURCES } from "@/data/sources";
import { fmt, fmtInt } from "@/lib/utils";
import type { Province, SourceKey } from "@/types";

const MATERIAL_GROUPS: {
  key: "wall_tile" | "column_beam" | "rebar";
  label: string;
}[] = [
  { key: "wall_tile", label: "🧱 งานผนัง-กระเบื้อง" },
  { key: "column_beam", label: "🏛 งานเสา-คาน" },
  { key: "rebar", label: "⛓ งานเหล็กเสริม" },
];

interface CompareRow {
  prov: Province;
  price: number;
}
interface CompareData {
  rows: CompareRow[];
  min: number;
  max: number;
  avg: number;
  diffPct: number;
  noData: boolean;
}

async function fetchPrice(
  source: string,
  material: string,
  provinceId: number,
): Promise<number | null> {
  try {
    const r = await fetch(
      `/api/prices/${encodeURIComponent(source)}/${encodeURIComponent(material)}?province=${provinceId}`,
      { cache: "no-store" },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as { price: number | null };
    return data.price ?? null;
  } catch {
    return null;
  }
}

export default function ComparePage() {
  const t = useTranslations("compare");
  const [material, setMaterial] = useState<string>("");
  const [source, setSource] = useState<string>("tpso");
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!material) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const results = await Promise.all(
        PROVINCES.map(async (p) => ({
          prov: p,
          price: await fetchPrice(source, material, p.id),
        })),
      );
      if (cancelled) return;
      const rows: CompareRow[] = results
        .filter((r): r is CompareRow => r.price != null && r.price > 0)
        .sort((a, b) => a.price - b.price);
      if (rows.length === 0) {
        setData({
          rows: [],
          min: 0,
          max: 0,
          avg: 0,
          diffPct: 0,
          noData: true,
        });
        setLoading(false);
        return;
      }
      const prices = rows.map((r) => r.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
      const diffPct = min > 0 ? ((max - min) / min) * 100 : 0;
      setData({ rows, min, max, avg, diffPct, noData: false });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [material, source]);

  const srcColor = SOURCES[source].color;

  return (
    <div className="page-in">
      <Doc tag="DATA-01 / PRICE COMPARE — PROVINCE">
        <h3 className="mb-2 font-display text-[28px]">{t("title")}</h3>
        <p className="mb-4 text-[13px] text-ink-2">{t("desc")}</p>
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <Field label={t("selectMaterial")} className="mb-0">
            <Select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            >
              <option value="">{t("materialPlaceholder")}</option>
              {MATERIAL_GROUPS.map((g) => (
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
          <Field label="แหล่งราคา" className="mb-0">
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              {Object.values(SOURCES).map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name} — {s.type}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Doc>

      {loading && (
        <div className="border-l-[3px] border-amber bg-paper-2 px-4 py-3 font-mono text-[12px] text-ink-2">
          กำลังโหลดราคาจาก {SOURCES[source].name}…
        </div>
      )}

      {data?.noData && !loading && (
        <div className="border-l-[3px] border-red bg-red/10 px-4 py-3 font-mono text-[12px] text-red">
          ไม่มีข้อมูลราคาสดสำหรับวัสดุนี้จาก {SOURCES[source].name} —
          ลองรีเฟรชแหล่งข้อมูลหรือเลือกแหล่งอื่น
        </div>
      )}

      {data && !data.noData && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("min")} value={fmtInt(data.min)} accent="green" />
            <Stat label={t("max")} value={fmtInt(data.max)} accent="red" />
            <Stat label={t("avg")} value={fmtInt(data.avg)} accent="teal" />
            <Stat
              label={t("diff")}
              value={data.diffPct.toFixed(2) + "%"}
              accent="amber"
            />
          </div>

          <Doc tag="CHART-01">
            <h3 className="mb-3 font-display text-[22px]">{t("chartHead")}</h3>
            <div className="h-[420px] border border-dashed border-line bg-paper p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.rows.map((r) => ({
                    name: r.prov.name.replace(/\(.*?\)/, "").trim(),
                    price: r.price,
                  }))}
                  margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede5d3" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11, fontFamily: "IBM Plex Sans Thai" }}
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
                  <Bar dataKey="price" fill={srcColor} stroke="#0a1628">
                    {data.rows.map((r) => (
                      <Cell
                        key={r.prov.id}
                        fill={
                          r.price === data.min
                            ? "#4d7c0f"
                            : r.price === data.max
                              ? "#991b1b"
                              : srcColor
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Doc>

          <Doc tag="TABLE-01">
            <h3 className="mb-3 font-display text-[22px]">{t("tableHead")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="bg-ink text-amber-bright">
                  <tr>
                    <Th>{t("cols.province")}</Th>
                    <Th>{t("cols.region")}</Th>
                    <Th align="right">{t("cols.price")}</Th>
                    <Th align="right">{t("cols.vsMin")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => {
                    const pct = ((r.price - data.min) / data.min) * 100;
                    return (
                      <tr key={r.prov.id} className="hover:bg-paper-2">
                        <Td>
                          <strong>{r.prov.name}</strong>
                        </Td>
                        <Td className="text-xs text-ink-3">{r.prov.region}</Td>
                        <Td align="right" mono>
                          <strong>{fmt(r.price)}</strong>
                        </Td>
                        <Td align="right">
                          {r.price === data.min ? (
                            <Badge variant="green">MIN ★</Badge>
                          ) : r.price === data.max ? (
                            <Badge variant="red">+{pct.toFixed(2)}%</Badge>
                          ) : (
                            <span className="font-mono text-[11px] text-ink-3">
                              +{pct.toFixed(2)}%
                            </span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Doc>
        </>
      )}
    </div>
  );
}
