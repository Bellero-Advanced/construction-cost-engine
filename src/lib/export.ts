"use client";

import * as XLSX from "xlsx";
import { PROVINCES } from "@/data/provinces";
import { SOURCES } from "@/data/sources";
import type { CalcResult } from "@/types";

function fileSafe(s: string) {
  return s.replace(/[\\/:*?"<>|]/g, "_");
}

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function exportToExcel(data: CalcResult) {
  const prov = PROVINCES.find((p) => p.id === data.province);
  const src = SOURCES[data.source];

  const summary = [
    ["Construction Cost Engine — BOM Report"],
    [],
    ["หมวดงาน", data.workName],
    ["แหล่งราคา", `${src?.name ?? data.source} (${src?.type ?? ""})`],
    ["จังหวัด", prov?.name ?? `#${data.province}`],
    ["ภูมิภาค", prov?.region ?? ""],
    ["ข้อมูล", data.extraInfo],
    ["วันที่ออกรายงาน", new Date().toLocaleString("th-TH")],
    [],
    ["รายการวัสดุ", "ปริมาณ", "หน่วย", "ราคา/หน่วย", "รวม (บาท)", "การใช้งาน"],
    ...data.items.map((it) => [
      it.name,
      Number(it.qty.toFixed(4)),
      it.unit,
      Number(it.unitPrice.toFixed(2)),
      Number(it.total.toFixed(2)),
      it.useFor ?? "",
    ]),
    [],
    ["", "", "", "TOTAL", Number(data.total.toFixed(2)), ""],
    ["", "", "", "UNIT COST", Number(data.unitCost.toFixed(2)), data.unitLabel],
  ];

  const ws = XLSX.utils.aoa_to_sheet(summary);
  ws["!cols"] = [
    { wch: 42 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 32 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BOM");

  const filename = `BOM_${fileSafe(data.workName)}_${timestamp()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportToPDF() {
  if (typeof window === "undefined") return;
  window.print();
}
