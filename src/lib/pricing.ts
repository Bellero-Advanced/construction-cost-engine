import { SOURCES } from "@/data/sources";
import { BASE_PRICES } from "@/data/prices";
import type { SourceKey } from "@/types";

export function getPrice(
  sourceKey: SourceKey | string,
  materialId: string,
  provinceId: number,
): number {
  const base = BASE_PRICES[materialId]?.[provinceId];
  if (!base) return 0;
  const src = SOURCES[sourceKey];
  if (!src) return base;
  const seed =
    (materialId.charCodeAt(0) + materialId.charCodeAt(materialId.length - 1)) %
    100;
  let variation = 1;
  if (sourceKey === "tpso") variation = 1;
  else if (sourceKey === "cgd") variation = 1 + ((seed % 5) - 2) * 0.005;
  else if (sourceKey === "homepro") variation = 1 + ((seed % 8) - 3) * 0.01;
  else if (sourceKey === "globalhouse") variation = 1 + ((seed % 6) - 3) * 0.01;
  else if (sourceKey === "thaiwatsadu")
    variation = 1 + ((seed % 7) - 3) * 0.008;
  else if (sourceKey === "bnb") variation = 1 + ((seed % 5) - 2) * 0.012;
  return Math.round(base * src.mult * variation * 100) / 100;
}
