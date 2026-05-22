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

export interface MaterialSpec {
  brand?: string; // canonical brand keyword e.g. "ตราเสือ", "TPI", "SCG"
  size?: string; // canonical size token e.g. "50kg", "DB12", "12x12"
  grade?: string; // grade/standard e.g. "Type I", "SD40", "มอก.20-2559"
}

export interface SourceOverride {
  url?: string;
  searchTerm?: string;
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
  // --- Canonicalization (Option B) ---
  canonical?: MaterialSpec; // brand+size+grade we want to match across sources
  searchTerms?: string[]; // multi-keyword fallback for retail search
  sourceOverrides?: Partial<Record<SourceKey, SourceOverride>>;
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
