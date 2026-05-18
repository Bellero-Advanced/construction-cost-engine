"use client";

import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/Button";
import { MATERIALS } from "@/data/materials";
import { MONTH_LABELS, TRENDS } from "@/data/prices";
import { fmt, fmtInt } from "@/lib/utils";

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

  const single = useMemo(() => {
    if (!mode || mode.kind !== "single") return null;
    const m = MATERIALS[mode.id];
    const data = TRENDS[mode.id] || [];
    const first = data[0];
    const last = data[data.length - 1];
    const diff = last - first;
    const pct = (diff / first) * 100;
    const chartData = MONTH_LABELS.map((label, i) => ({
      label,
      price: data[i],
    }));
    return { m, first, last, diff, pct, chartData };
  }, [mode]);

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
            <h3 className="mb-3 font-display text-[22px]">▌ {single.m.name}</h3>
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
