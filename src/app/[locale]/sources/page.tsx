"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CsvUploader } from "@/components/admin/CsvUploader";
import { Doc } from "@/components/ui/Doc";
import { Field, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Th, Td } from "@/components/ui/Stat";
import { Button } from "@/components/ui/Button";
import { downloadCsv, toCsv } from "@/lib/csv";
import { MATERIALS } from "@/data/materials";
import { PROVINCES } from "@/data/provinces";
import { SOURCES, SOURCE_KEYS } from "@/data/sources";
import { fmt } from "@/lib/utils";

interface PriceCell {
  price: number | null;
  fetchedAt: string | null;
  ttlSec: number;
  live: boolean;
}

interface Fetched {
  srcKey: string;
  province: number;
  fetchedAt: string;
  prices: Record<string, PriceCell>;
}

async function fetchPriceMap(
  source: string,
  provinceId: number,
): Promise<Record<string, PriceCell>> {
  const ids = Object.keys(MATERIALS);
  const entries = await Promise.all(
    ids.map(async (id) => {
      const empty: PriceCell = {
        price: null,
        fetchedAt: null,
        ttlSec: 86400,
        live: false,
      };
      try {
        const r = await fetch(
          `/api/prices/${encodeURIComponent(source)}/${encodeURIComponent(id)}?province=${provinceId}`,
          { cache: "no-store" },
        );
        if (!r.ok) return [id, empty] as const;
        const data = (await r.json()) as {
          price: number | null;
          fetchedAt?: string;
          ttlSec?: number;
          live?: boolean;
        };
        return [
          id,
          {
            price: data.price ?? null,
            fetchedAt: data.fetchedAt ?? null,
            ttlSec: data.ttlSec ?? 86400,
            live: data.live ?? false,
          } as PriceCell,
        ] as const;
      } catch {
        return [id, empty] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

function ageBadge(cell: PriceCell): {
  label: string;
  variant: "green" | "amber" | "red" | "line";
} {
  if (cell.price == null) return { label: "NO DATA", variant: "line" };
  if (!cell.fetchedAt) return { label: "LIVE", variant: "green" };
  const ageMs = Date.now() - new Date(cell.fetchedAt).getTime();
  const ageH = ageMs / 3_600_000;
  const ttlH = cell.ttlSec / 3600;
  if (ageH < ttlH * 0.5) return { label: "FRESH", variant: "green" };
  if (ageH < ttlH) return { label: "OK", variant: "amber" };
  return { label: "STALE", variant: "red" };
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
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-[11px] text-ink-3">
                  SRC: {src.short.toUpperCase()} ({src.type}) / PROV:{" "}
                  {prov.name} / DATE: {fetched.fetchedAt}
                </span>
                <Button
                  variant="dark"
                  onClick={() => {
                    const rows = Object.values(MATERIALS).map((m) => {
                      const c = fetched.prices[m.id];
                      return {
                        material_id: m.id,
                        name: m.name,
                        spec: m.spec,
                        category: m.cat,
                        unit: m.unit,
                        price: c?.price ?? "",
                        live: c?.live ?? false,
                        fetched_at: c?.fetchedAt ?? "",
                        ttl_sec: c?.ttlSec ?? "",
                        source: src.name,
                        province: prov.name,
                      };
                    });
                    downloadCsv(
                      `prices_${fetched.srcKey}_${prov.id}_${new Date()
                        .toISOString()
                        .slice(0, 10)}.csv`,
                      toCsv(rows),
                    );
                  }}
                >
                  Export CSV
                </Button>
              </div>
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
                    <Th align="center">FRESHNESS</Th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(MATERIALS).map((m) => {
                    const cell = fetched.prices[m.id];
                    const ab = cell
                      ? ageBadge(cell)
                      : { label: "—", variant: "line" as const };
                    return (
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
                          {cell?.price != null ? fmt(cell.price) : "—"}
                        </Td>
                        <Td align="center">
                          <Badge variant={ab.variant}>{ab.label}</Badge>
                          {cell?.fetchedAt && (
                            <div className="mt-0.5 font-mono text-[9px] text-ink-3">
                              {new Date(cell.fetchedAt).toLocaleString("th-TH")}
                            </div>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
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
                      price: fetched.prices[m.id]?.price ?? null,
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
      <CsvUploader />
    </div>
  );
}
