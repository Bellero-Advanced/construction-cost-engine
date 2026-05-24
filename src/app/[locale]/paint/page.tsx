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
import { calcPaint, loadLivePrices, PAINT_DEPS } from "@/lib/calculators";
import type { CalcResult, SourceKey } from "@/types";

export default function PaintPage() {
  const [source, setSource] = useState<string>("cgd");
  const [province, setProvince] = useState<number>(10);
  const [area, setArea] = useState<number>(50);
  const [paintId, setPaintId] = useState<string>("PAINT_INT_001");
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
        PAINT_DEPS(paintId),
        province,
      );
      const r = calcPaint(source as SourceKey, province, area, paintId, prices);
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
    <Doc tag="CALC-D / PAINT">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          <h3 className="mb-4 font-display text-[24px]">งานทาสี</h3>
          <SourceSelect label="แหล่งราคา" value={source} onChange={setSource} />
          <ProvinceSelect
            label="จังหวัด"
            value={province}
            onChange={setProvince}
          />
          <NumberField
            label="พื้นที่ทาสี (ตร.ม.)"
            value={area}
            onChange={setArea}
          />
          <Field label="ชนิดสี">
            <Select
              value={paintId}
              onChange={(e) => setPaintId(e.target.value)}
            >
              <option value="PAINT_INT_001">สีน้ำพลาสติกทาภายใน เกรด A</option>
              <option value="PAINT_EXT_001">
                สีน้ำอะคริลิคทาภายนอก เกรด A
              </option>
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
            <CalcPlaceholder icon="🎨" text="กรอกข้อมูลและกดคำนวณต้นทุน" />
          )}
        </div>
      </div>
    </Doc>
  );
}
