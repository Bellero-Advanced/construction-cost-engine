"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Doc } from "@/components/ui/Doc";
import {
  SourceSelect,
  ProvinceSelect,
  NumberField,
} from "@/components/calculator/Selectors";
import {
  CalculatorResult,
  CalcPlaceholder,
} from "@/components/calculator/CalculatorResult";
import { calcColumnBeam } from "@/lib/calculators";
import type { CalcResult, SourceKey } from "@/types";

export default function ColumnBeamPage() {
  const t = useTranslations("calc");
  const [source, setSource] = useState<string>("tpso");
  const [province, setProvince] = useState<number>(10);
  const [vol, setVol] = useState<number>(10);
  const [result, setResult] = useState<CalcResult | null>(null);

  const submit = () => {
    if (!vol || vol <= 0) return alert("ปริมาตรต้องมากกว่า 0");
    setResult(calcColumnBeam(source as SourceKey, province, vol));
  };

  return (
    <Doc tag="CALC-B / COLUMN-BEAM">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <h3 className="mb-4 font-display text-[24px]">
            {t("columnBeamTitle")}
          </h3>
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
          <NumberField label={t("volume")} value={vol} onChange={setVol} />
          <div className="mb-4 border-l-[3px] border-amber bg-ink px-3 py-2.5 font-mono text-[11px] text-amber-bright">
            <span className="font-bold text-rust">⚠ NOTE / </span>
            {t("helperColumnBeam")}
          </div>
          <Button block onClick={submit}>
            {t("submit")}
          </Button>
        </div>
        <div>
          {result ? (
            <CalculatorResult data={result} />
          ) : (
            <CalcPlaceholder icon="▣" text={t("placeholder")} />
          )}
        </div>
      </div>
    </Doc>
  );
}
