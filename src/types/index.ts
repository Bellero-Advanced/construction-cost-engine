export type WorkType = "wall_tile" | "column_beam" | "rebar";

export type SourceKey =
  | "tpso"
  | "cgd"
  | "homepro"
  | "globalhouse"
  | "thaiwatsadu"
  | "bnb"
  | "dit"
  | "scghome"
  | "dohome"
  | "megahome";

export type SourceType = "Government" | "Modern Trade";

export interface Source {
  key: SourceKey;
  name: string;
  short: string;
  type: SourceType;
  color: string;
  mult: number;
  url: string;
  desc: string;
  badge: string;
  coverage: string;
  updateFreq: string;
}

export interface Province {
  id: number;
  name: string;
  region: string;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  cat: string;
  spec: string;
  work: WorkType;
  cons?: number; // consumption per work-unit
  wpm?: number; // weight per meter (for rebar, ตัน/ม.? actually kg/m)
  useFor?: string;
  consPerTon?: number; // for wire
  consPerForm?: number; // for nails
  reuse?: number; // for formwork
}

export interface BomItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  useFor?: string;
}

export interface CalcResult {
  workName: string;
  source: SourceKey;
  province: number;
  items: BomItem[];
  total: number;
  unitCost: number;
  unitLabel: string;
  extraInfo: string;
}
