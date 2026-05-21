"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Doc } from "@/components/ui/Doc";
import { Field, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Th, Td } from "@/components/ui/Stat";
import { Button } from "@/components/ui/Button";
import { MATERIALS } from "@/data/materials";
import { PROVINCES } from "@/data/provinces";
import { SOURCES, SOURCE_KEYS } from "@/data/sources";
import { fmt } from "@/lib/utils";

interface Fetched {
  srcKey: string;
  province: number;
  fetchedAt: string;
  prices: Record<string, number | null>;
}

async function fetchPriceMap(
  source: string,
  provinceId: number,
): Promise<Record<string, number | null>> {
  const ids = Object.keys(MATERIALS);
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const r = await fetch(
          `/api/prices/${encodeURIComponent(source)}/${encodeURIComponent(id)}?province=${provinceId}`,
          { cache: "no-store" },
        );
        if (!r.ok) return [id, null] as const;
        const data = (await r.json()) as { price: number | null };
        return [id, data.price ?? null] as const;
      } catch {
        return [id, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

export default function SourcesPage() {
  const t = useTranslations("source");
  const [srcKey, setSrcKey] = useState<string>("tpso");
  const [province, setProvince] = useState<number>(10);
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchData = async () => {
    setBusy(true);
    try {
      const prices = await fetchPriceMap(srcKey, province);
      setFetched({
        srcKey,
        province,
        fetchedAt: new Date().toLocaleString("th-TH"),
        prices,
      });
    } finally {
      setBusy(false);
    }
  };

  const src = fetched ? SOURCES[fetched.srcKey] : null;
  const prov = fetched
    ? PROVINCES.find((p) => p.id === fetched.province)!
    : null;

  return (
    <div className="page-in">
      <Doc tag="SRC-01 / DATA SOURCES DETAIL">
        <h3 className="mb-2 font-display text-[28px]">{t("title")}</h3>
        <p className="mb-2 text-[13px] text-ink-2">{t("desc")}</p>
        <div className="my-2 mb-4 flex flex-wrap gap-1.5">
          {SOURCE_KEYS.map((k) => {
            const s = SOURCES[k as string];
            const active = srcKey === k;
            return (
              <button
                key={String(k)}
                type="button"
                onClick={() => setSrcKey(String(k))}
                className={
                  "flex items-center gap-1.5 border-[1.5px] border-ink px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] " +
                  (active
                    ? "bg-ink text-paper"
                    : "bg-paper text-ink hover:bg-paper-2")
                }
              >
                <span className="h-2 w-2" style={{ background: s.color }} />
                {s.short}
              </button>
            );
          })}
        </div>
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
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
          <Button onClick={fetchData}>{busy ? "…" : t("fetch")}</Button>
        </div>
      </Doc>

      {fetched && src && prov && (
        <>
          <div className="mb-4 border-l-4 border-green bg-green/10 p-3 font-mono text-xs text-green">
            {t("success")} / Data fetched from {src.name} ({src.url})
          </div>
          <Doc tag={`RESPONSE / ${src.short.toUpperCase()}`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink pb-3">
              <h3 className="font-display text-[24px]">{t("tableHead")}</h3>
              <span className="font-mono text-[11px] text-ink-3">
                SRC: {src.short.toUpperCase()} ({src.type}) / PROV: {prov.name}{" "}
                / DATE: {fetched.fetchedAt}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead className="bg-ink text-amber-bright">
                  <tr>
                    <Th>{t("cols.code")}</Th>
                    <Th>{t("cols.material")}</Th>
                    <Th>{t("cols.category")}</Th>
                    <Th align="center">{t("cols.unit")}</Th>
                    <Th align="right">{t("cols.price")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(MATERIALS).map((m) => (
                    <tr key={m.id} className="hover:bg-paper-2">
                      <Td className="font-mono text-[11px] text-ink-3">
                        {m.id}
                      </Td>
                      <Td>
                        <strong>{m.name}</strong>
                        <div className="text-[11px] text-ink-3">{m.spec}</div>
                      </Td>
                      <Td>
                        <Badge variant="line">{m.cat}</Badge>
                      </Td>
                      <Td align="center" className="text-[11px]">
                        {m.unit}
                      </Td>
                      <Td align="right" mono className="font-bold">
                        {fetched.prices[m.id] != null
                          ? fmt(fetched.prices[m.id]!)
                          : "—"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <pre className="mt-4 overflow-x-auto border-[1.5px] border-ink bg-ink p-5 font-mono text-[11px] leading-relaxed text-paper">
              <div className="mb-2.5 border-b border-dashed border-line pb-2 text-[10px] uppercase tracking-[0.2em] text-amber-bright">
                {t("jsonLabel")}
              </div>
              {JSON.stringify(
                {
                  status: "success",
                  source: src.name,
                  source_type: src.type,
                  source_url: src.url,
                  province_id: fetched.province,
                  province_name: prov.name,
                  month_year: "เมษายน 2569",
                  data: Object.values(MATERIALS)
                    .slice(0, 3)
                    .map((m) => ({
                      material_id: m.id,
                      name: m.name,
                      category: m.cat,
                      unit: m.unit,
                      price: fetched.prices[m.id] ?? null,
                    })),
                  fetched_at: new Date().toISOString(),
                },
                null,
                2,
              )}
            </pre>
          </Doc>
        </>
      )}
    </div>
  );
}
