"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Doc } from "@/components/ui/Doc";
import { Field, Select } from "@/components/ui/Field";
import {
  SourceSelect,
  ProvinceSelect,
  NumberField,
} from "@/components/calculator/Selectors";
import {
  CalculatorResult,
  CalcPlaceholder,
} from "@/components/calculator/CalculatorResult";
import {
  calcWallTile,
  loadLivePrices,
  WALL_TILE_DEPS,
} from "@/lib/calculators";
import type { CalcResult, SourceKey } from "@/types";

export default function WallTilePage() {
  const t = useTranslations("calc");
  const [source, setSource] = useState<string>("tpso");
  const [province, setProvince] = useState<number>(10);
  const [area, setArea] = useState<number>(50);
  const [tile, setTile] = useState<string>("TILE_001");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!area || area <= 0) {
      setError("กรุณากรอกพื้นที่ให้มากกว่า 0 ตารางเมตร");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const prices = await loadLivePrices(
        source as SourceKey,
        WALL_TILE_DEPS(tile),
        province,
      );
      setResult(
        calcWallTile(source as SourceKey, province, area, tile, prices),
      );
    } catch (e) {
      setError(`โหลดราคาไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Doc tag="CALC-A / WALL-TILE">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <h3 className="mb-4 font-display text-[24px]">
            {t("wallTileTitle")}
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
          <NumberField label={t("area")} value={area} onChange={setArea} />
          <Field label={t("tileType")}>
            <Select value={tile} onChange={(e) => setTile(e.target.value)}>
              <option value="TILE_001">กระเบื้องปูพื้น 12x12 นิ้ว</option>
              <option value="TILE_002">กระเบื้องปูผนัง 8x10 นิ้ว</option>
            </Select>
          </Field>
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
            <CalcPlaceholder icon="⊞" text={t("placeholder")} />
          )}
        </div>
      </div>
    </Doc>
  );
}
