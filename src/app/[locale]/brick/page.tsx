"use client";

import { useState } from "react";
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
import { calcBrick, loadLivePrices, BRICK_DEPS } from "@/lib/calculators";
import type { CalcResult, SourceKey } from "@/types";

export default function BrickPage() {
  const [source, setSource] = useState<string>("cgd");
  const [province, setProvince] = useState<number>(10);
  const [area, setArea] = useState<number>(20);
  const [brickId, setBrickId] = useState<string>("BRICK_001");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!area || area <= 0) {
      setError("กรุณากรอกพื้นที่ให้มากกว่า 0");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const prices = await loadLivePrices(
        source as SourceKey,
        BRICK_DEPS(brickId),
        province,
      );
      const r = calcBrick(source as SourceKey, province, area, brickId, prices);
      setResult(r);
      await fetch("/api/admin/log-calculation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(r),
      });
    } catch (e) {
      setError(`โหลดราคาไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Doc tag="CALC-E / BRICK">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <h3 className="mb-4 font-display text-[24px]">งานก่ออิฐ</h3>
          <SourceSelect label="แหล่งราคา" value={source} onChange={setSource} />
          <ProvinceSelect
            label="จังหวัด"
            value={province}
            onChange={setProvince}
          />
          <NumberField
            label="พื้นที่ก่ออิฐ (ตร.ม.)"
            value={area}
            onChange={setArea}
          />
          <Field label="ชนิดอิฐ">
            <Select
              value={brickId}
              onChange={(e) => setBrickId(e.target.value)}
            >
              <option value="BRICK_001">อิฐมอญ 14x6.5x3 ซม.</option>
              <option value="BRICK_002">อิฐมวลเบา (AAC) 20x60x7.5 ซม.</option>
            </Select>
          </Field>
          {error && (
            <p className="mb-3 font-mono text-[12px] text-red-400">{error}</p>
          )}
          <Button
            variant="primary"
            onClick={submit}
            disabled={busy}
            className="w-full"
          >
            {busy ? "กำลังคำนวณ…" : "คำนวณต้นทุน"}
          </Button>
        </div>
        <div>
          {result ? (
            <CalculatorResult data={result} />
          ) : (
            <CalcPlaceholder icon="🧱" text="กรอกข้อมูลและกดคำนวณต้นทุน" />
          )}
        </div>
      </div>
    </Doc>
  );
}
