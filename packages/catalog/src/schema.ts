import { z } from "zod";

export const optionStatus = z.enum(["ok", "PENDENT_REVISIO"]);

export const optionSchema = z.strictObject({
  /** `<category>.<slug>`, globally unique. Stored in jobs, so never rename an id once released. */
  id: z.string().regex(/^[a-z0-9-]+\.[a-z0-9-]+$/),
  label: z.string().min(1),
  description: z.string().optional(),
  /** CSS gradient for the 84 px thumbnail, or "neutral" for the striped placeholder. */
  thumbnail: z.string().optional(),
  /** Solid color sample (CAD wall colors). */
  swatch: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().optional(),
  /** Selecting it clears the rest of its group, and vice versa ("Mantenir original", "Cap"). */
  exclusive: z.boolean().default(false),
  recommended: z.boolean().default(false),
  exclusiveWith: z.array(z.string()).default([]),
  requires: z.array(z.string()).default([]),
  unlocks: z.array(z.string()).default([]),
  /** Literal text from docs/ESPECIFICACIO_RENDER.md, added in phase 2. */
  promptFragment: z.string().optional(),
  status: optionStatus,
  // Domain-specific metadata.
  detailsCategory: z.string().optional(),
  layer: z.string().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  short: z.string().optional(),
  technical: z.boolean().optional(),
});

export const groupSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9-]+\.[a-z0-9-]+$/),
    title: z.string().min(1),
    mode: z.enum(["single", "multi"]),
    default: z.array(z.string()),
    /** Minimum number of selected options. Defaults to 1 for single, 0 for multi. */
    min: z.number().int().min(0).optional(),
    presentation: z.enum(["cards", "chips"]).default("cards"),
    /** Mode-specific defaults, keyed by CAD mode option id. */
    defaultByMode: z.record(z.string(), z.array(z.string())).optional(),
    /** Alternative default when an element is selected in the CAD "Què modelar?" step. */
    defaultIfElement: z.strictObject({ element: z.string(), default: z.array(z.string()) }).optional(),
    options: z.array(optionSchema).min(1),
  })
  .transform((group) => ({ ...group, min: group.min ?? (group.mode === "single" ? 1 : 0) }));

export const categorySchema = z.strictObject({
  category: z.string(),
  label: z.string(),
  note: z.string().optional(),
  groups: z.array(groupSchema).min(1),
});

export const tabSchema = z.strictObject({
  id: z.string(),
  label: z.string(),
  note: z.string().optional(),
  groups: z.array(groupSchema).min(1),
});

export const tabbedCategorySchema = z.strictObject({
  category: z.string(),
  label: z.string(),
  tabs: z.array(tabSchema).min(1),
});

export const layerSchema = z.strictObject({
  name: z.string().regex(/^CR_[A-Z]+$/),
  label: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  grayscale: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  element: z.string(),
});

export const layersSchema = z.strictObject({ layers: z.array(layerSchema).min(1) });

export type CatalogOption = z.infer<typeof optionSchema>;
export type CatalogGroup = z.infer<typeof groupSchema>;
export type CatalogCategory = z.infer<typeof categorySchema>;
export type CatalogTab = z.infer<typeof tabSchema>;
export type CadLayer = z.infer<typeof layerSchema>;
