"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Doc } from "@/components/ui/Doc";
import { Field, Select } from "@/components/ui/Field";
import { Stat } from "@/components/ui/Stat";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MATERIALS } from "@/data/materials";
import { MONTH_LABELS, TRENDS } from "@/data/prices";
import { linearTrend, percentageChange } from "@/lib/stats/linearTrend";
import { fmt, fmtInt } from "@/lib/utils";

const HISTORY_SOURCES = [
  { key: "dit", label: "DIT (รายวัน)" },
  { key: "cgd", label: "CGD (รายเดือน)" },
  { key: "tpso", label: "TPSO (CMI index)" },
  { key: "homepro", label: "HomePro (รายปลีก)" },
  { key: "megahome", label: "MegaHome (รายปลีก)" },
  { key: "globalhouse", label: "Global House (รายปลีก)" },
  { key: "thaiwatsadu", label: "Thai Watsadu (รายปลีก)" },
  { key: "bnb", label: "BnB Home (รายปลีก)" },
  { key: "scghome", label: "SCG Home (รายปลีก)" },
  { key: "dohome", label: "Dohome (รายปลีก)" },
];

interface HistoryEntry {
  date: string;
  price: number;
}

const GROUPS: { key: "wall_tile" | "column_beam" | "rebar"; label: string }[] =
  [
    { key: "wall_tile", label: "🧱 งานผนัง-กระเบื้อง" },
    { key: "column_beam", label: "🏛 งานเสา-คาน" },
    { key: "rebar", label: "⛓ งานเหล็กเสริม" },
  ];

const REBAR_IDS = [
  "REBAR_RB6",
  "REBAR_RB9",
  "REBAR_DB10",
  "REBAR_DB12",
  "REBAR_DB16",
  "REBAR_DB20",
  "REBAR_DB25",
];
const REBAR_COLORS = [
  "#991b1b",
  "#d97706",
  "#4d7c0f",
  "#0e7c7b",
  "#1a3556",
  "#b94d2c",
  "#c89500",
];

type Mode = { kind: "single"; id: string } | { kind: "all-rebar" };

export default function TrendPage() {
  const t = useTranslations("trend");
  const [mode, setMode] = useState<Mode | null>(null);
  const [source, setSource] = useState<string>("dit");
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!mode || mode.kind !== "single") {
      setHistory(null);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    (async () => {
      try {
        const r = await fetch(
          `/api/history/${encodeURIComponent(source)}/${encodeURIComponent(mode.id)}?province=10`,
          { cache: "no-store" },
        );
        if (!r.ok) {
          if (!cancelled) setHistory([]);
          return;
        }
        const data = (await r.json()) as { series: HistoryEntry[] };
        if (!cancelled) setHistory(data.series ?? []);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, source]);

  const single = useMemo(() => {
    if (!mode || mode.kind !== "single") return null;
    const m = MATERIALS[mode.id];
    let chartData: { label: string; price: number }[];
    let isReal = false;
    if (history && history.length >= 2) {
      chartData = history.map((h) => ({
        label: h.date.slice(5),
        price: h.price,
      }));
      isReal = true;
    } else {
      const data = TRENDS[mode.id] ?? [];
      chartData = MONTH_LABELS.map((label, i) => ({
        label,
        price: data[i] ?? 0,
      }));
    }
    if (chartData.length === 0) return null;
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    const diff = last - first;
    const pct = first > 0 ? (diff / first) * 100 : 0;
    const trend = linearTrend(chartData.map((d) => d.price));
    const pctChanges = percentageChange(chartData.map((d) => d.price));
    const chartWithTrend = chartData.map((d, i) => ({
      ...d,
      trendLine: trend ? +trend.forecast(i).toFixed(0) : undefined,
      pctChange: pctChanges[i],
    }));
    return {
      m,
      first,
      last,
      diff,
      pct,
      chartData: chartWithTrend,
      isReal,
      trend,
    };
  }, [mode, history]);

  const allRebarData = useMemo(() => {
    if (!mode || mode.kind !== "all-rebar") return null;
    return MONTH_LABELS.map((label, i) => {
      const row: Record<string, number | string> = { label };
      REBAR_IDS.forEach((id) => {
        row[id.replace("REBAR_", "")] = TRENDS[id][i];
      });
      return row;
    });
  }, [mode]);

  return (
    <div className="page-in">
      <Doc tag="DATA-03 / 12M TREND">
        <h3 className="mb-2 font-display text-[28px]">{t("title")}</h3>
        <p className="mb-4 text-[13px] text-ink-2">{t("desc")}</p>
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
          <Field label={t("selectMaterial")} className="mb-0">
            <Select
              value={mode?.kind === "single" ? mode.id : ""}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                setMode({ kind: "single", id: v });
              }}
            >
              <option value="">— เลือกวัสดุ —</option>
              {GROUPS.map((g) => (
                <optgroup key={g.key} label={g.label}>
                  {Object.values(MATERIALS)
                    .filter((mm) => mm.work === g.key)
                    .map((mm) => (
                      <option key={mm.id} value={mm.id}>
                        {mm.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field label="แหล่งข้อมูล" className="mb-0">
            <Select value={source} onChange={(e) => setSource(e.target.value)}>
              {HISTORY_SOURCES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="dark" onClick={() => setMode({ kind: "all-rebar" })}>
            {t("allRebar")}
          </Button>
        </div>
      </Doc>

      {single && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={t("first")}
              value={fmtInt(single.first)}
              accent="teal"
            />
            <Stat label={t("last")} value={fmtInt(single.last)} accent="teal" />
            <Stat
              label={t("diff")}
              value={(single.diff >= 0 ? "+" : "") + fmt(single.diff)}
              accent="amber"
            />
            <Stat
              label={t("diffPct")}
              value={
                (single.diff >= 0 ? "+" : "") + single.pct.toFixed(2) + "%"
              }
              accent="amber"
            />
          </div>
          <Doc tag="CHART-03">
            <h3 className="mb-3 flex flex-wrap items-center gap-2 font-display text-[22px]">
              <span>▌ {single.m.name}</span>
              {single.isReal ? (
                <Badge variant="green">LIVE / {history?.length ?? 0} จุด</Badge>
              ) : (
                <Badge variant="amber">FIXTURE / ยังไม่มีข้อมูลย้อนหลัง</Badge>
              )}
              {historyLoading && (
                <span className="font-mono text-[10px] text-ink-3">โหลด…</span>
              )}
            </h3>
            <div className="h-[420px] border border-dashed border-line bg-paper p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={single.chartData}
                  margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede5d3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
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
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    dot={{
                      r: 4,
                      fill: "#0a1628",
                      stroke: "#d97706",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6 }}
                  />
                  {single.trend && (
                    <Line
                      type="linear"
                      dataKey="trendLine"
                      stroke="#5eead4"
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      dot={false}
                      name={`Trend (b=${single.trend.b > 0 ? "+" : ""}${single.trend.b} ฿/period, R²=${single.trend.r2})`}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Doc>
        </>
      )}

      {allRebarData && (
        <Doc tag="CHART-03">
          <h3 className="mb-3 font-display text-[22px]">
            {t("allRebarTitle")}
          </h3>
          <div className="h-[480px] border border-dashed border-line bg-paper p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={allRebarData}
                margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ede5d3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a1628",
                    border: "1.5px solid #d97706",
                    color: "#f5f1e8",
                    fontFamily: "JetBrains Mono",
                    fontSize: 11,
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: "IBM Plex Sans Thai",
                    fontSize: 11,
                  }}
                />
                {REBAR_IDS.map((id, i) => (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id.replace("REBAR_", "")}
                    stroke={REBAR_COLORS[i]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Doc>
      )}
    </div>
  );
}
