import type { RelativeRegion } from "@/server/render/protect";

export type ProviderInfo = { provider: string; model: string; mock: boolean };
export type Usage = { inputTokens?: number; outputTokens?: number; estimatedCostEur?: number };

export type RenderAnalysis = {
  /** One of the prompt-engine project types, or null when unknown. */
  projectType: string | null;
  confidence: number;
  /** Logos, signs and lettering that must stay untouched. */
  protectedRegions: RelativeRegion[];
};

export type QcStatus = "ok" | "deviation" | "unsure";
export type QcCheck = { id: string; label: string; status: QcStatus; detail?: string; region?: RelativeRegion };

/** Vision model used for analysis and quality control (§3.1). Never generates images. */
export interface VisionLLM {
  readonly info: ProviderInfo;
  analyzeRender(image: Buffer): Promise<{ analysis: RenderAnalysis; usage?: Usage }>;
  qualityCheck(base: Buffer, result: Buffer, options: { vegetation: boolean }): Promise<{ checks: QcCheck[]; usage?: Usage }>;
}

export type ImageEditRequest = {
  image: Buffer;
  prompt: string;
  /** Visual guides only, in the order referenced by the prompt ("Reference image N"). */
  references: Buffer[];
  /** Optional PNG mask: white = editable area. */
  mask?: Buffer;
};

/** Image editing provider (§3.1): base image + prompt + references → image. */
export interface ImageEditProvider {
  readonly info: ProviderInfo;
  edit(request: ImageEditRequest): Promise<{ image: Buffer; usage?: Usage }>;
}

/** Architecture QC items (§5.3.6), labelled in Catalan for the result screen. */
export const ARCHITECTURE_CHECKS = [
  ["geometria", "Geometria"],
  ["volumetria", "Volumetria"],
  ["finestres", "Finestres"],
  ["portes", "Portes"],
  ["pilars", "Pilars"],
  ["accessos", "Accessos"],
  ["coberta", "Coberta"],
  ["vialitat", "Vialitat"],
  ["aparcaments", "Aparcaments"],
  ["logos", "Logos"],
  ["retols", "Rètols"],
  ["perspectiva", "Perspectiva i enquadrament"],
] as const;

/** Vegetation QC items (§5.3.7). */
export const VEGETATION_CHECKS = [
  ["troncs", "Troncs deformats"],
  ["duplicats", "Arbres duplicats"],
  ["copes", "Copes artificials"],
  ["fullatge", "Fullatge borrós"],
  ["branques", "Branques impossibles"],
  ["fusionats", "Arbres fusionats amb edificis"],
  ["soroll", "Massa soroll"],
  ["fons", "Vegetació de fons massa definida"],
  ["gespa", "Gespa repetitiva"],
  ["tallats", "Arbres tallats"],
  ["posicio", "Canvis de posició no autoritzats"],
] as const;
