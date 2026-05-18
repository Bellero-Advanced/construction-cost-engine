"use client";

import { PROVINCES } from "@/data/provinces";
import { SOURCES } from "@/data/sources";
import { COLORS } from "@/data/prices";
import { fmt, fmtInt } from "@/lib/utils";
import type { CalcResult } from "@/types";

const RES_LABELS = {
  totalCost: "▌ TOTAL COST",
  unitCost: "▌ UNIT COST",
  sourceLoc: "▌ SOURCE / LOCATION",
  bom: "BOM / BILL OF MATERIALS",
  bomHead: "▌ รายละเอียดวัสดุ",
  breakdown: "BREAKDOWN",
  breakdownHead: "▌ สัดส่วนต้นทุน",
  breakdownDesc: "วัสดุไหนคิดเป็นต้นทุนเท่าไร",
  cols: {
    material: "รายการวัสดุ",
    qty: "ปริมาณ",
    unit: "หน่วย",
    unitPrice: "ราคา/หน่วย",
    total: "รวม (บาท)",
  },
  total: "TOTAL",
};

export function CalculatorResult({ data }: { data: CalcResult }) {
  const prov = PROVINCES.find((p) => p.id === data.province)!;
  const src = SOURCES[data.source]!;
  const totalSafe = data.total > 0 ? data.total : 1;

  const segs = data.items.map((it, i) => ({
    pct: (it.total / totalSafe) * 100,
    color: COLORS[i % COLORS.length],
    name: it.name,
    total: it.total,
  }));

  const sourceTextColor =
    src.color === "#1a3556" || src.color === "#003a70" ? "#fbbf24" : "#fff";

  return (
    <div className="page-in">
      {/* Summary */}
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <SumCard
          label={RES_LABELS.totalCost}
          value={fmt(data.total)}
          sub={`บาท / ${data.extraInfo}`}
        />
        <SumCard
          label={RES_LABELS.unitCost}
          value={fmt(data.unitCost)}
          sub={data.unitLabel}
          highlight
        />
        <div
          className="relative overflow-hidden border-l-[5px] bg-ink px-5 py-[18px] text-paper"
          style={{ borderLeftColor: src.color }}
        >
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/70">
            {RES_LABELS.sourceLoc}
          </div>
          <div
            className="font-display text-[22px] leading-none tracking-[0.02em]"
            style={{ color: sourceTextColor }}
          >
            {src.short}
          </div>
          <div className="mt-1 font-mono text-[11px] text-paper/65">
            {prov.name.replace(/\(.*?\)/, "").trim()} —{" "}
            {prov.region.toUpperCase()}
          </div>
        </div>
      </div>

      {/* BOM */}
      <div className="doc mb-6">
        <span className="doc-tag">{RES_LABELS.bom}</span>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink pb-3">
          <h3 className="font-display text-[24px] tracking-[0.03em]">
            {RES_LABELS.bomHead}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="bg-ink text-amber-bright">
              <tr>
                <th className="border-b-2 border-amber p-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.15em]">
                  {RES_LABELS.cols.material}
                </th>
                <th className="border-b-2 border-amber p-3 text-right font-mono text-[10px] font-bold uppercase tracking-[0.15em]">
                  {RES_LABELS.cols.qty}
                </th>
                <th className="border-b-2 border-amber p-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.15em]">
                  {RES_LABELS.cols.unit}
                </th>
                <th className="border-b-2 border-amber p-3 text-right font-mono text-[10px] font-bold uppercase tracking-[0.15em]">
                  {RES_LABELS.cols.unitPrice}
                </th>
                <th className="border-b-2 border-amber p-3 text-right font-mono text-[10px] font-bold uppercase tracking-[0.15em]">
                  {RES_LABELS.cols.total}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it) => (
                <tr key={it.id + it.name} className="hover:bg-paper-2">
                  <td className="border-b border-dashed border-paper-2 p-3">
                    <strong>{it.name}</strong>
                    {it.useFor && (
                      <div className="text-[11px] text-ink-3">
                        ↳ {it.useFor}
                      </div>
                    )}
                  </td>
                  <td className="border-b border-dashed border-paper-2 p-3 text-right font-mono">
                    {fmt(it.qty)}
                  </td>
                  <td className="border-b border-dashed border-paper-2 p-3 text-center text-[11px]">
                    {it.unit}
                  </td>
                  <td className="border-b border-dashed border-paper-2 p-3 text-right font-mono">
                    {fmt(it.unitPrice)}
                  </td>
                  <td className="border-b border-dashed border-paper-2 p-3 text-right font-mono font-bold">
                    {fmt(it.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-paper-2 font-bold">
                <td
                  colSpan={4}
                  className="border-y-2 border-ink p-3 text-right"
                >
                  <strong>{RES_LABELS.total}</strong>
                </td>
                <td className="border-y-2 border-ink p-3 text-right font-mono text-[15px]">
                  {fmt(data.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Breakdown */}
      <div className="doc mb-6">
        <span className="doc-tag">{RES_LABELS.breakdown}</span>
        <h3 className="mb-2 font-display text-[22px]">
          {RES_LABELS.breakdownHead}
        </h3>
        <p className="mb-2 text-xs text-ink-3">{RES_LABELS.breakdownDesc}</p>
        <div className="mt-4 flex h-8 overflow-hidden border-[1.5px] border-ink">
          {segs.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-center overflow-hidden whitespace-nowrap font-mono text-[11px] font-bold text-paper transition-all duration-300"
              style={{ width: `${s.pct}%`, background: s.color }}
            >
              {s.pct >= 8 ? `${s.pct.toFixed(1)}%` : ""}
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {segs.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div
                className="h-3.5 w-3.5 flex-shrink-0 border border-ink"
                style={{ background: s.color }}
              />
              <span className="flex-1 truncate">
                {s.name.length > 28 ? s.name.substring(0, 28) + "…" : s.name}
              </span>
              <span className="font-mono text-[11px] text-ink-3">
                {fmtInt(s.total)} บ.
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SumCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "relative overflow-hidden border-l-[5px] border-ink bg-amber px-5 py-[18px] text-ink"
          : "relative overflow-hidden border-l-[5px] border-amber bg-ink px-5 py-[18px] text-paper"
      }
    >
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">
        {label}
      </div>
      <div className="font-display text-[38px] leading-none tracking-[0.02em]">
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] opacity-65">{sub}</div>
    </div>
  );
}

export function CalcPlaceholder({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="border-2 border-dashed border-line bg-white/40 px-6 py-20 text-center text-ink-3">
      <div className="mb-3 font-display text-[80px] leading-none text-amber">
        {icon}
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.15em] whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}
