/**
 * Unit converter for construction materials.
 * Thesis chapter 2: "Unit Standardization" — convert between sale unit and work unit.
 */

export type UnitKey =
  | "ตัน"
  | "กก"
  | "กรัม"
  | "ลบ.ม."
  | "ลิตร"
  | "ตร.ม."
  | "ตร.ซม."
  | "เมตร"
  | "ซม."
  | "ถุง50กก"
  | "ถุง20กก"
  | "ถุง1กก"
  | "แกลลอน"
  | "ลิตรสี"
  | "เส้น12ม"
  | "เส้น10ม";

// Conversion factors to SI base: กก, ลบ.ม., ตร.ม., เมตร
const TO_KG: Partial<Record<UnitKey, number>> = {
  ตัน: 1000,
  กก: 1,
  กรัม: 0.001,
  ถุง50กก: 50,
  ถุง20กก: 20,
  ถุง1กก: 1,
};

const TO_LBM: Partial<Record<UnitKey, number>> = {
  "ลบ.ม.": 1,
  ลิตร: 0.001,
  แกลลอน: 0.003785,
  ลิตรสี: 0.001,
};

const TO_M: Partial<Record<UnitKey, number>> = {
  เมตร: 1,
  "ซม.": 0.01,
};

// Rebar: price per เส้น → price per ตัน using wpm (kg/m)
export function rebarPerTon(
  pricePerBar: number,
  lengthM: number,
  wpmKgPerM: number,
): number {
  const kgPerBar = lengthM * wpmKgPerM;
  const barsPerTon = 1000 / kgPerBar;
  return pricePerBar * barsPerTon;
}

// Generic: convert price from one unit to another
export function convertPrice(
  price: number,
  fromUnit: UnitKey,
  toUnit: UnitKey,
): number | null {
  // kg domain
  const fromKg = TO_KG[fromUnit];
  const toKg = TO_KG[toUnit];
  if (fromKg != null && toKg != null) return (price / fromKg) * toKg;

  // volume domain
  const fromVol = TO_LBM[fromUnit];
  const toVol = TO_LBM[toUnit];
  if (fromVol != null && toVol != null) return (price / fromVol) * toVol;

  // length domain
  const fromM = TO_M[fromUnit];
  const toM = TO_M[toUnit];
  if (fromM != null && toM != null) return (price / fromM) * toM;

  return null; // cross-domain conversion not supported
}

// Convenience: ราคา/ตัน → ราคา/กก
export function tonToKg(pricePerTon: number): number {
  return pricePerTon / 1000;
}

// Convenience: ราคา/ถุง50กก → ราคา/กก
export function bagToKg(pricePerBag: number, bagKg = 50): number {
  return pricePerBag / bagKg;
}
