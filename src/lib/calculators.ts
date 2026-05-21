import { MATERIALS } from "@/data/materials";
import type { BomItem, CalcResult, SourceKey } from "@/types";

export type PriceMap = Record<string, number | null>;

/**
 * Batch-load live prices for a set of material ids by calling the
 * public /api/prices route. Works from both server and client without
 * pulling Cloudflare bindings into the client bundle.
 */
export async function loadLivePrices(
  source: SourceKey,
  materialIds: string[],
  province: number,
): Promise<PriceMap> {
  const unique = Array.from(new Set(materialIds));
  const entries = await Promise.all(
    unique.map(async (id) => {
      try {
        const r = await fetch(
          `/api/prices/${encodeURIComponent(source)}/${encodeURIComponent(id)}?province=${province}`,
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

function buildItem(
  prices: PriceMap,
  source: SourceKey,
  id: string,
  qty: number,
): BomItem {
  const m = MATERIALS[id];
  const unitPrice = prices[id] ?? 0;
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
  prices: PriceMap,
): CalcResult {
  const items: BomItem[] = [];
  items.push(
    buildItem(prices, source, tileId, area * (MATERIALS[tileId].cons ?? 0)),
  );
  items.push(
    buildItem(
      prices,
      source,
      "ADHESIVE_001",
      area * MATERIALS.ADHESIVE_001.cons!,
    ),
  );
  items.push(
    buildItem(prices, source, "GROUT_001", area * MATERIALS.GROUT_001.cons!),
  );
  items.push(
    buildItem(
      prices,
      source,
      "PVC_TRIM_001",
      area * MATERIALS.PVC_TRIM_001.cons!,
    ),
  );
  items.push(
    buildItem(
      prices,
      source,
      "WATER_MIX_001",
      area * MATERIALS.WATER_MIX_001.cons!,
    ),
  );
  const total = items.reduce((s, i) => s + i.total, 0);
  return {
    workName: "งานผนัง-กระเบื้อง",
    source,
    province,
    items,
    total,
    unitCost: area > 0 ? total / area : 0,
    unitLabel: "บาท / ตร.ม.",
    extraInfo: `พื้นที่ ${area} ตร.ม.`,
  };
}

export function calcColumnBeam(
  source: SourceKey,
  province: number,
  vol: number,
  prices: PriceMap,
): CalcResult {
  const items: BomItem[] = [];
  ["CEMENT_001", "SAND_001", "ROCK_001", "WATER_MIX_002"].forEach((id) => {
    if (!MATERIALS[id]) return;
    items.push(buildItem(prices, source, id, vol * MATERIALS[id].cons!));
  });
  const total = items.reduce((s, i) => s + i.total, 0);
  return {
    workName: "งานเสา-คาน คอนกรีต",
    source,
    province,
    items,
    total,
    unitCost: vol > 0 ? total / vol : 0,
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
  prices: PriceMap,
): CalcResult {
  const items: BomItem[] = [];
  let totalKg = 0;
  rows.forEach((r) => {
    if (!r.lengthM || r.lengthM <= 0) return;
    const m = MATERIALS[r.id];
    const kg = r.lengthM * (m.wpm ?? 0);
    totalKg += kg;
    const ton = kg / 1000;
    const price = prices[r.id] ?? 0;
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
  const wirePrice = prices.WIRE_001 ?? 0;
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
  const formPrice = prices.FORM_WOOD_001 ?? 0;
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
  const nailPrice = prices.NAIL_001 ?? 0;
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

/**
 * IDs each calculator depends on — used by pages to preload prices.
 */
export const WALL_TILE_DEPS = (tileId: string) => [
  tileId,
  "ADHESIVE_001",
  "GROUT_001",
  "PVC_TRIM_001",
  "WATER_MIX_001",
];
export const COLUMN_BEAM_DEPS = [
  "CEMENT_001",
  "SAND_001",
  "ROCK_001",
  "WATER_MIX_002",
];
export const REBAR_DEPS = (rebarIds: string[]) => [
  ...rebarIds,
  "WIRE_001",
  "FORM_WOOD_001",
  "NAIL_001",
];
