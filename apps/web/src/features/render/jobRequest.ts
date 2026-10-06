import { z } from "zod";

/** Protected or editable area, relative to the image (0–1). */
export const regionSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().gt(0).max(1),
    height: z.number().gt(0).max(1),
    label: z.string().trim().min(1).max(60),
  })
  .refine((region) => region.x + region.width <= 1.0001 && region.y + region.height <= 1.0001, "Region outside the image");

const id = z.string().min(1).max(40);
const optionIds = z.array(z.string().max(80)).max(30);

export const generateInputSchema = z.object({
  baseAssetId: id,
  references: z.array(z.object({ assetId: id, purpose: z.string().max(80).nullable(), take: optionIds })).max(10),
  vegetationReferences: z.array(z.object({ assetId: id, copy: optionIds })).max(5),
  improvements: optionIds,
  details: z.record(z.string().max(80), optionIds),
  fidelity: z.string().max(80),
  notes: z.string().max(5000),
  protectedRegions: z.array(regionSchema).max(30),
});

export const correctionInputSchema = z.object({
  sourceVersionId: id,
  corrections: optionIds,
  notes: z.string().max(5000),
  /** Required by «Millorar només aquesta zona»: only this area may change. */
  area: regionSchema.nullable(),
});

export const jobRequestSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("generate"), projectId: id, input: generateInputSchema }),
  z.object({ kind: z.literal("regenerate"), projectId: id, sourceVersionId: id }),
  z.object({ kind: z.literal("correction"), projectId: id, input: correctionInputSchema }),
  z.object({ kind: z.literal("restore"), projectId: id }),
]);

export type Region = z.infer<typeof regionSchema>;
export type GenerateInput = z.infer<typeof generateInputSchema>;
export type CorrectionInput = z.infer<typeof correctionInputSchema>;
export type JobRequest = z.infer<typeof jobRequestSchema>;

/** Stored in RenderJob.input for corrections (adds the original base for logo protection). */
export type StoredCorrectionInput = CorrectionInput & { originalAssetId: string };
export type StoredRestoreInput = { originalAssetId: string };
