"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Doc } from "@/components/ui/Doc";
import { Field, Select } from "@/components/ui/Field";
import { MATERIALS } from "@/data/materials";
import { PROVINCES } from "@/data/provinces";
import { SOURCES, SOURCE_KEYS } from "@/data/sources";

interface UploadResult {
  ok?: boolean;
  written?: string[];
  skipped?: { id: string; reason: string }[];
  error?: string;
  status?: number;
}

function parseCsv(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/[,\t;]/).map((s) => s.trim());
    if (parts.length < 2) continue;
    const id = parts[0];
    if (id.toLowerCase() === "material_id" || id.toLowerCase() === "id")
      continue;
    const price = Number(parts[1].replace(/[฿,]/g, ""));
    if (!id || !Number.isFinite(price) || price <= 0) continue;
    out[id] = price;
  }
  return out;
}

export function CsvUploader() {
  const [source, setSource] = useState<string>("cgd");
  const [province, setProvince] = useState<number>(10);
  const [token, setToken] = useState<string>("");
  const [csv, setCsv] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const parsed = parseCsv(csv);
  const parsedCount = Object.keys(parsed).length;
  const unknown = Object.keys(parsed).filter((id) => !MATERIALS[id]);

  const onFile = async (f: File | null) => {
    if (!f) return;
    const text = await f.text();
    setCsv(text);
  };

  const onSubmit = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch("/api/admin/upload-prices", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({ source, province, prices: parsed }),
      });
      const data = (await r.json()) as UploadResult;
      setResult({ ...data, status: r.status });
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "network error" });
    } finally {
      setBusy(false);
    }
  };

  const template = Object.keys(MATERIALS).slice(0, 5).join(",100\n") + ",100";

  return (
    <Doc tag="ADMIN / BULK CSV UPLOAD">
      <h3 className="mb-1 font-display text-[22px]">CSV Bulk Price Upload</h3>
      <p className="mb-3 text-[12px] text-ink-2">
        อัพโหลด CSV ราคา (material_id, price) → เขียนเข้า KV cache ของ
        source/province ที่เลือก. ต้องใช้ admin token. CGD / DIT
        ใช้สำหรับเดือนที่ auto-scraper เข้าไม่ถึง.
      </p>

      <div className="grid items-end gap-3 md:grid-cols-3">
        <Field label="Source" className="mb-0">
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCE_KEYS.map((k) => (
              <option key={String(k)} value={String(k)}>
                {SOURCES[k as string].name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Province" className="mb-0">
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
        <Field label="Admin Token" className="mb-0">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="x-admin-token"
            className="w-full border-[1.5px] border-ink bg-paper px-3 py-2 font-mono text-[12px] outline-none focus:bg-paper-2"
          />
        </Field>
      </div>

      <div className="mt-3">
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">
          CSV file or pasted text
        </label>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="font-mono text-[11px]"
          />
          <button
            type="button"
            onClick={() => setCsv(template)}
            className="border-[1.5px] border-ink bg-paper px-2 py-1 font-mono text-[10px] uppercase hover:bg-paper-2"
          >
            Load template
          </button>
        </div>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          placeholder={
            "material_id,price\nCEMENT_001,175\nSAND_001,480\nREBAR_DB12,620"
          }
          className="w-full border-[1.5px] border-ink bg-paper p-2 font-mono text-[11px] outline-none focus:bg-paper-2"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ink-2">
        <span>
          Parsed: <strong className="text-ink">{parsedCount}</strong> row(s)
          {unknown.length > 0 && (
            <span className="ml-2 text-red">
              · {unknown.length} unknown material_id
            </span>
          )}
        </span>
        <Button
          onClick={onSubmit}
          disabled={busy || parsedCount === 0 || !token}
        >
          {busy ? "Uploading…" : `Upload ${parsedCount} prices`}
        </Button>
      </div>

      {result && (
        <pre className="mt-4 overflow-x-auto border-[1.5px] border-ink bg-ink p-4 font-mono text-[11px] text-paper">
          <div className="mb-2 border-b border-dashed border-line pb-2 text-[10px] uppercase tracking-[0.2em] text-amber-bright">
            RESPONSE / {result.status ?? "ERR"}
          </div>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </Doc>
  );
}
