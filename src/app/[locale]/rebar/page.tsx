"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Doc } from "@/components/ui/Doc";
import { Field } from "@/components/ui/Field";
import {
  SourceSelect,
  ProvinceSelect,
} from "@/components/calculator/Selectors";
import {
  CalculatorResult,
  CalcPlaceholder,
} from "@/components/calculator/CalculatorResult";
import { MATERIALS } from "@/data/materials";
import {
  calcRebar,
  loadLivePrices,
  REBAR_DEPS,
  type RebarRow,
} from "@/lib/calculators";
import type { CalcResult, SourceKey } from "@/types";

const REBAR_OPTIONS = Object.values(MATERIALS).filter(
  (m) => m.work === "rebar" && m.wpm,
);

interface Row {
  uid: number;
  id: string;
  lengthM: number;
}

let nextUid = 1;

const initialRows: Row[] = [
  { uid: nextUid++, id: "REBAR_DB12", lengthM: 200 },
  { uid: nextUid++, id: "REBAR_DB16", lengthM: 100 },
  { uid: nextUid++, id: "REBAR_RB6", lengthM: 300 },
];

export default function RebarPage() {
  const t = useTranslations("calc");
  const [source, setSource] = useState<string>("tpso");
  const [province, setProvince] = useState<number>(10);
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const updateRow = (uid: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));

  const removeRow = (uid: number) =>
    setRows((rs) => rs.filter((r) => r.uid !== uid));

  const addRow = () =>
    setRows((rs) => [...rs, { uid: nextUid++, id: "REBAR_DB12", lengthM: 0 }]);

  const submit = async () => {
    if (rows.length === 0) {
      setError("กรุณาเพิ่มรายการเหล็กอย่างน้อย 1 รายการ");
      return;
    }
    if (!rows.some((r) => r.lengthM > 0)) {
      setError("กรุณากรอกความยาว (เมตร) ของเหล็กอย่างน้อย 1 รายการ");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const data: RebarRow[] = rows.map((r) => ({
        id: r.id,
        lengthM: r.lengthM,
      }));
      const ids = REBAR_DEPS(data.map((d) => d.id));
      const prices = await loadLivePrices(source as SourceKey, ids, province);
      setResult(calcRebar(source as SourceKey, province, data, prices));
    } catch (e) {
      setError(`โหลดราคาไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Doc tag="CALC-C / REBAR">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <h3 className="mb-4 font-display text-[24px]">{t("rebarTitle")}</h3>
          <SourceSelect
            label={t("source")}
            value={source}
            onChange={setSource}
          />
          <ProvinceSelect
            label={t("province")}
            value={province}
            onChange={setProvince}
          />
          <Field label={t("rebarList")}>
            <div className="space-y-1.5">
              {rows.map((r) => (
                <div
                  key={r.uid}
                  className="grid grid-cols-[1fr_90px_32px] gap-1.5 border-l-[3px] border-amber bg-paper-2 p-1.5"
                >
                  <select
                    value={r.id}
                    onChange={(e) => updateRow(r.uid, { id: e.target.value })}
                    className="border border-ink bg-paper px-2 py-1.5 font-mono text-[11px]"
                  >
                    {REBAR_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id.replace("REBAR_", "")} — {m.useFor}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="ม."
                    min={0}
                    step={0.1}
                    value={r.lengthM || ""}
                    onChange={(e) =>
                      updateRow(r.uid, {
                        lengthM: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="border border-ink bg-paper px-2 py-1.5 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(r.uid)}
                    className="bg-red px-0 py-1.5 font-bold text-paper"
                    aria-label="remove row"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Field>
          <Button
            variant="secondary"
            size="sm"
            block
            onClick={addRow}
            className="mb-3"
          >
            {t("addRebar")}
          </Button>
          <Button block onClick={submit}>
            {t("submit")}
          </Button>
          {error && (
            <div className="mt-3 border-l-4 border-red bg-red/10 px-3 py-2 font-mono text-[11px] text-red">
              ⚠ {error}
            </div>
          )}
        </div>
        <div>
          {result ? (
            <CalculatorResult data={result} />
          ) : (
            <CalcPlaceholder icon="⛓" text={t("placeholderRebar")} />
          )}
        </div>
      </div>
    </Doc>
  );
}
