"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import { Badge } from "@/components/ui/Badge";
import { Field, Select } from "@/components/ui/Field";
import { Stat, Th, Td } from "@/components/ui/Stat";
import { MATERIALS } from "@/data/materials";
import { PROVINCES } from "@/data/provinces";
import { SOURCES, SOURCE_KEYS } from "@/data/sources";
import { getPrice } from "@/lib/pricing";
import { fmt, fmtInt } from "@/lib/utils";

const GROUPS: { key: "wall_tile" | "column_beam" | "rebar"; label: string }[] =
  [
    { key: "wall_tile", label: "🧱 งานผนัง-กระเบื้อง" },
    { key: "column_beam", label: "🏛 งานเสา-คาน" },
    { key: "rebar", label: "⛓ งานเหล็กเสริม" },
  ];

export default function StoresPage() {
  const t = useTranslations("stores");
  const [material, setMaterial] = useState<string>("");
  const [province, setProvince] = useState<number>(10);

  const data = useMemo(() => {
    if (!material) return null;
    const rows = SOURCE_KEYS.map((key) => ({
      key: String(key),
      src: SOURCES[key as string],
      price: getPrice(key as string, material, province),
    })).sort((a, b) => a.price - b.price);
    const min = rows[0].price;
    const max = rows[rows.length - 1].price;
    const avg = rows.reduce((s, r) => s + r.price, 0) / rows.length;
    const save = max - min;
    const savePct = (save / max) * 100;
    const govPrices = rows
      .filter((r) => r.src.type === "Government")
      .map((r) => r.price);
    const retailPrices = rows
      .filter((r) => r.src.type === "Modern Trade")
      .map((r) => r.price);
    const govAvg = govPrices.reduce((s, p) => s + p, 0) / govPrices.length;
    const retailAvg =
      retailPrices.reduce((s, p) => s + p, 0) / retailPrices.length;
    const diffGovRetail = ((retailAvg - govAvg) / govAvg) * 100;
    return { rows, min, max, avg, save, savePct, diffGovRetail };
  }, [material, province]);

  const m = material ? MATERIALS[material] : null;

  return (
    <div className="page-in">
      <Doc tag="DATA-02 / PRICE COMPARE — STORES">
        <h3 className="mb-2 font-display text-[28px]">{t("title")}</h3>
        <p className="mb-4 text-[13px] text-ink-2">{t("desc")}</p>
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <Field label={t("selectMaterial")} className="mb-0">
            <Select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
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
          <Field label={t("selectProvince")} className="mb-0">
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
        </div>
      </Doc>

      {data && m && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={t("min")}
              value={fmtInt(data.min)}
              sub={"★ " + data.rows[0].src.short.toUpperCase()}
              accent="green"
            />
            <Stat
              label={t("max")}
              value={fmtInt(data.max)}
              sub={data.rows[data.rows.length - 1].src.short.toUpperCase()}
              accent="red"
            />
            <Stat label={t("avg")} value={fmtInt(data.avg)} accent="teal" />
            <Stat
              label={t("save")}
              value={fmtInt(data.save) + " (" + data.savePct.toFixed(1) + "%)"}
              accent="amber"
            />
          </div>

          <Doc tag="CHART-02">
            <h3 className="mb-3 font-display text-[22px]">{t("chartHead")}</h3>
            <div className="h-[420px] border border-dashed border-line bg-paper p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.rows.map((r) => ({
                    name: r.src.short,
                    price: r.price,
                    fill: r.src.color,
                  }))}
                  margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede5d3" />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fontFamily: "JetBrains Mono",
                      fontWeight: 700,
                    }}
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
                  <Bar dataKey="price" stroke="#0a1628">
                    {data.rows.map((r) => (
                      <Cell key={r.key} fill={r.src.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Doc>

          <Doc tag="TABLE-02">
            <h3 className="mb-3 font-display text-[22px]">{t("tableHead")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="bg-ink text-amber-bright">
                  <tr>
                    <Th>{t("cols.source")}</Th>
                    <Th>{t("cols.type")}</Th>
                    <Th align="right">{t("cols.price")}</Th>
                    <Th align="right">{t("cols.vsMin")}</Th>
                    <Th align="center">{t("cols.status")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => {
                    const pct = ((r.price - data.min) / data.min) * 100;
                    return (
                      <tr key={r.key} className="hover:bg-paper-2">
                        <Td>
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold">
                            <span
                              className="h-2.5 w-2.5 flex-shrink-0"
                              style={{ background: r.src.color }}
                            />
                            <strong className="font-sans">{r.src.name}</strong>
                          </span>
                        </Td>
                        <Td className="text-xs">{r.src.type}</Td>
                        <Td
                          align="right"
                          mono
                          className="text-[14px] font-bold"
                        >
                          {fmt(r.price)} บ.
                        </Td>
                        <Td
                          align="right"
                          mono
                          className={
                            "text-[11px] " +
                            (r.price === data.min ? "text-green" : "text-ink-3")
                          }
                        >
                          {r.price === data.min
                            ? "— BASE —"
                            : "+" + pct.toFixed(2) + "%"}
                        </Td>
                        <Td align="center">
                          {r.price === data.min ? (
                            <Badge variant="green">
                              {t("badges.cheapest")}
                            </Badge>
                          ) : r.price === data.max ? (
                            <Badge variant="red">{t("badges.expensive")}</Badge>
                          ) : r.src.type === "Government" ? (
                            <Badge variant="amber">
                              {t("badges.government")}
                            </Badge>
                          ) : (
                            <Badge variant="line">{t("badges.general")}</Badge>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Doc>

          <Doc tag="INSIGHT">
            <h3 className="mb-3 font-display text-[22px]">
              {t("insightHead")}
            </h3>
            <div className="border-l-4 border-teal bg-teal/10 p-4 font-mono text-xs text-teal">
              <p>
                <strong>▌ ราคาถูกที่สุด:</strong> {data.rows[0].src.name} ที่{" "}
                {fmt(data.min)} บาท
              </p>
              <p>
                <strong>▌ ราคาแพงที่สุด:</strong>{" "}
                {data.rows[data.rows.length - 1].src.name} ที่ {fmt(data.max)}{" "}
                บาท
              </p>
              <p>
                <strong>▌ ส่วนต่าง:</strong> {fmtInt(data.save)} บาท (
                {data.savePct.toFixed(1)}%) — เลือกร้านได้คุ้มค่ากว่า
              </p>
              <p>
                <strong>▌ ค่าเฉลี่ยหน่วยราชการ vs ค้าปลีก:</strong> ราคาค้าปลีก
                {data.diffGovRetail >= 0 ? "สูงกว่า" : "ต่ำกว่า"}
                ราคาราชการเฉลี่ย{" "}
                <strong>{Math.abs(data.diffGovRetail).toFixed(1)}%</strong>
              </p>
            </div>
          </Doc>
        </>
      )}
    </div>
  );
}
