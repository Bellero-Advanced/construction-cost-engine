import { MATERIALS } from "@/data/materials";
import { getPrice } from "@/lib/pricing";
import type { BomItem, CalcResult, SourceKey } from "@/types";

function buildItem(
  source: SourceKey,
  id: string,
  qty: number,
  province: number,
): BomItem {
  const m = MATERIALS[id];
  const unitPrice = getPrice(source, id, province);
  return {
    id,
    name: m.name,
    qty,
    unit: m.unit,
    unitPrice,
    total: qty * unitPrice,
  };
}

export function calcWallTile(
  source: SourceKey,
  province: number,
  area: number,
  tileId: string,
): CalcResult {
  const items: BomItem[] = [];
  items.push(
    buildItem(source, tileId, area * (MATERIALS[tileId].cons ?? 0), province),
  );
  items.push(
    buildItem(
      source,
      "ADHESIVE_001",
      area * MATERIALS.ADHESIVE_001.cons!,
      province,
    ),
  );
  items.push(
    buildItem(source, "GROUT_001", area * MATERIALS.GROUT_001.cons!, province),
  );
  items.push(
    buildItem(
      source,
      "PVC_TRIM_001",
      area * MATERIALS.PVC_TRIM_001.cons!,
      province,
    ),
  );
  items.push(
    buildItem(
      source,
      "WATER_MIX_001",
      area * MATERIALS.WATER_MIX_001.cons!,
      province,
    ),
  );
  const total = items.reduce((s, i) => s + i.total, 0);
  return {
    workName: "งานผนัง-กระเบื้อง",
    source,
    province,
    items,
    total,
    unitCost: total / area,
    unitLabel: "บาท / ตร.ม.",
    extraInfo: `พื้นที่ ${area} ตร.ม.`,
  };
}

export function calcColumnBeam(
  source: SourceKey,
  province: number,
  vol: number,
): CalcResult {
  const items: BomItem[] = [];
  ["CEMENT_001", "SAND_001", "ROCK_001", "WATER_MIX_002"].forEach((id) => {
    items.push(buildItem(source, id, vol * MATERIALS[id].cons!, province));
  });
  const total = items.reduce((s, i) => s + i.total, 0);
  return {
    workName: "งานเสา-คาน คอนกรีต",
    source,
    province,
    items,
    total,
    unitCost: total / vol,
    unitLabel: "บาท / ลบ.ม.",
    extraInfo: `ปริมาตร ${vol} ลบ.ม.`,
  };
}

export interface RebarRow {
  id: string;
  lengthM: number;
}

export function calcRebar(
  source: SourceKey,
  province: number,
  rows: RebarRow[],
): CalcResult {
  const items: BomItem[] = [];
  let totalKg = 0;
  rows.forEach((r) => {
    if (!r.lengthM || r.lengthM <= 0) return;
    const m = MATERIALS[r.id];
    const kg = r.lengthM * (m.wpm ?? 0);
    totalKg += kg;
    const ton = kg / 1000;
    const price = getPrice(source, r.id, province);
    items.push({
      id: r.id,
      name: m.name,
      useFor: m.useFor,
      qty: ton,
      unit: m.unit,
      unitPrice: price,
      total: ton * price,
    });
  });

  const wireKg = (totalKg / 1000) * MATERIALS.WIRE_001.consPerTon!;
  const wirePrice = getPrice(source, "WIRE_001", province);
  items.push({
    id: "WIRE_001",
    name: MATERIALS.WIRE_001.name,
    useFor: "ผูกเหล็กเสริม",
    qty: wireKg,
    unit: "กก.",
    unitPrice: wirePrice,
    total: wireKg * wirePrice,
  });

  const concM3 = totalKg / 100;
  const formSqm = concM3 * 10;
  const formSheets = formSqm / (1.2 * 2.4);
  const formQty = formSheets / MATERIALS.FORM_WOOD_001.reuse!;
  const formPrice = getPrice(source, "FORM_WOOD_001", province);
  items.push({
    id: "FORM_WOOD_001",
    name: MATERIALS.FORM_WOOD_001.name,
    useFor: "แบบหล่อ (ใช้ซ้ำ 4 ครั้ง)",
    qty: formQty,
    unit: "แผ่น",
    unitPrice: formPrice,
    total: formQty * formPrice,
  });

  const nailKg = formSheets * MATERIALS.NAIL_001.consPerForm!;
  const nailPrice = getPrice(source, "NAIL_001", province);
  items.push({
    id: "NAIL_001",
    name: MATERIALS.NAIL_001.name,
    useFor: "ตอกไม้แบบ",
    qty: nailKg,
    unit: "กก.",
    unitPrice: nailPrice,
    total: nailKg * nailPrice,
  });

  const total = items.reduce((s, i) => s + i.total, 0);
  const ton = totalKg / 1000;
  return {
    workName: "งานเหล็กเสริม",
    source,
    province,
    items,
    total,
    unitCost: ton > 0 ? total / ton : 0,
    unitLabel: "บาท / ตันเหล็ก",
    extraInfo: `น้ำหนักเหล็ก ${totalKg.toFixed(2)} กก. (${ton.toFixed(3)} ตัน)`,
  };
}
