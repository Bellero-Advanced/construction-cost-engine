export type WorkType =
  | "wall_tile"
  | "column_beam"
  | "rebar"
  | "paint"
  | "brick"
  | "concrete";

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
  | "megahome"
  | "boonthavorn";

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
  brand?: string;
  size?: string;
  grade?: string;
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
  mocCode?: string; // รหัสมาตรฐานกระทรวงพาณิชย์
  work: WorkType;
  cons?: number;
  wpm?: number;
  useFor?: string;
  consPerTon?: number;
  consPerForm?: number;
  reuse?: number;
  canonical?: MaterialSpec;
  searchTerms?: string[];
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
