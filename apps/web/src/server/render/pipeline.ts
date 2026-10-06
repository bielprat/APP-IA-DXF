import "server-only";
import { buildCorrectionPrompt, buildRenderPrompt, planRenderPasses, type BuiltPrompt, type RenderPromptInput } from "@cr/prompt-engine";
import sharp from "sharp";
import type { Prisma } from "@/generated/prisma/client";
import type { GenerateInput, StoredCorrectionInput, StoredRestoreInput } from "@/features/render/jobRequest";
import { getDb } from "@/lib/db";
import { getImageEditProvider, getVisionLLM, type QcCheck, type RenderAnalysis } from "@/server/ai";
import { trackAiCall } from "@/server/ai/log";
import { readAsset, storeImageAsset } from "@/server/assets";
import { featherMask, restoreProtectedRegions, toPixelRegion, type RelativeRegion } from "./protect";

class JobCancelled extends Error {}

type JobContext = { jobId: string; userId: string; projectId: string };

async function assertNotCancelled(jobId: string) {
  const job = await getDb().renderJob.findUniqueOrThrow({ where: { id: jobId }, select: { status: true } });
  if (job.status === "cancelled") throw new JobCancelled();
}

async function setStatus(jobId: string, status: "processing" | "qc") {
  await assertNotCancelled(jobId);
  await getDb().renderJob.update({ where: { id: jobId }, data: { status } });
}

/** Providers may change the size; results are always brought back to the base size so logos can be compared. */
async function fitToBase(image: Buffer, width: number, height: number): Promise<{ image: Buffer; aspectChanged: boolean }> {
  const meta = await sharp(image).metadata();
  const aspectChanged = Math.abs((meta.width ?? width) / (meta.height ?? height) - width / height) > 0.01;
  if (meta.width === width && meta.height === height) return { image, aspectChanged: false };
  return { image: await sharp(image).resize(width, height, { fit: "fill" }).png().toBuffer(), aspectChanged };
}

async function savePrompt(jobId: string, built: BuiltPrompt) {
  await getDb().auditPrompt.create({
    data: {
      jobId,
      pass: built.pass,
      prompt: built.prompt,
      usedFragments: built.usedFragments as unknown as Prisma.InputJsonValue,
      warnings: built.warnings as unknown as Prisma.InputJsonValue,
      catalogVersion: built.catalogVersion,
      engineVersion: built.engineVersion,
    },
  });
}

async function editImage(context: JobContext, purpose: string, image: Buffer, built: BuiltPrompt, references: Buffer[], mask?: Buffer) {
  await savePrompt(context.jobId, built);
  const provider = getImageEditProvider();
  const { image: output } = await trackAiCall({ ...context, purpose, info: provider.info }, () =>
    provider.edit({ image, prompt: built.prompt, references, mask }),
  );
  return output;
}

async function analyze(context: JobContext, base: Buffer): Promise<RenderAnalysis> {
  const vision = getVisionLLM();
  const { analysis } = await trackAiCall({ ...context, purpose: "analysis", info: vision.info }, () => vision.analyzeRender(base));
  await getDb().renderJob.update({ where: { id: context.jobId }, data: { analysis: analysis as unknown as Prisma.InputJsonValue } });
  return analysis;
}

/** Combines the model QC with checks the app can measure itself (size, protected regions). */
async function qualityControl(
  context: JobContext,
  base: Buffer,
  result: Buffer,
  options: { vegetation: boolean; aspectChanged: boolean; protection: { label: string; restored: boolean }[]; manualRegions: number },
) {
  const vision = getVisionLLM();
  const { checks } = await trackAiCall({ ...context, purpose: "qc", info: vision.info }, () => vision.qualityCheck(base, result, { vegetation: options.vegetation }));
  const restored = options.protection.filter((region) => region.restored);
  const measured: QcCheck[] = [
    options.aspectChanged
      ? { id: "proporcions", label: "Proporcions de la imatge", status: "deviation", detail: "El proveïdor ha canviat les proporcions; s'ha reajustat a la mida original." }
      : { id: "proporcions", label: "Proporcions de la imatge", status: "ok", detail: "Mateixa mida i proporcions que l'original." },
  ];
  if (options.protection.length > 0) {
    measured.push({
      id: "zones-protegides",
      label: "Zones protegides (logos i rètols)",
      status: "ok",
      detail:
        restored.length > 0
          ? `S'han restaurat els píxels originals de ${restored.length} de ${options.protection.length} zones: ${restored.map((region) => region.label).join(", ")}.`
          : `Les ${options.protection.length} zones protegides no han canviat.`,
    });
  } else {
    measured.push({ id: "zones-protegides", label: "Zones protegides (logos i rètols)", status: "unsure", detail: "No s'ha marcat ni detectat cap logo o rètol." });
  }
  const all = [...measured, ...checks];
  const status = all.some((check) => check.status === "deviation") ? "warning" : all.some((check) => check.status === "unsure") ? "unverified" : "ok";
  await getDb().qualityReport.create({ data: { jobId: context.jobId, status, checks: all as unknown as Prisma.InputJsonValue } });
}

async function createVersion(context: JobContext, kind: "generate" | "correction" | "restore", assetId: string, parentVersionId: string | null) {
  const db = getDb();
  await db.$transaction(async (tx) => {
    const last = await tx.renderVersion.aggregate({ where: { projectId: context.projectId }, _max: { number: true } });
    await tx.renderVersion.create({
      data: { projectId: context.projectId, jobId: context.jobId, number: (last._max.number ?? 0) + 1, kind, assetId, parentVersionId },
    });
    await tx.renderJob.update({ where: { id: context.jobId }, data: { status: "ready", finishedAt: new Date() } });
    await tx.project.update({ where: { id: context.projectId }, data: { updatedAt: new Date() } });
  });
}

function relativeRegions(analysis: RenderAnalysis | null, manual: readonly RelativeRegion[]): RelativeRegion[] {
  return [...(analysis?.protectedRegions ?? []), ...manual];
}

async function runGenerate(context: JobContext, input: GenerateInput) {
  const base = await readAsset(input.baseAssetId);
  const { width = 1, height = 1 } = await sharp(base).metadata();
  const references = await Promise.all([...input.references, ...input.vegetationReferences].map((reference) => readAsset(reference.assetId)));

  const analysis = await analyze(context, base);
  await assertNotCancelled(context.jobId);

  const promptInput: RenderPromptInput = {
    projectType: analysis.projectType,
    improvements: input.improvements,
    details: input.details,
    fidelity: input.fidelity,
    references: input.references.map(({ purpose, take }) => ({ purpose, take })),
    vegetationReferences: input.vegetationReferences.map(({ copy }) => ({ copy })),
    userNotes: input.notes,
  };
  const passes = planRenderPasses(promptInput);
  let current = base;
  let aspectChanged = false;
  for (const pass of passes) {
    const output = await editImage(context, `image-edit:${pass}`, current, buildRenderPrompt(promptInput, pass), references);
    const fitted = await fitToBase(output, width, height);
    current = fitted.image;
    aspectChanged ||= fitted.aspectChanged;
    await assertNotCancelled(context.jobId);
  }

  const regions = relativeRegions(analysis, input.protectedRegions)
    .map((region) => toPixelRegion(region, width, height))
    .filter((region) => region !== null);
  const protection = await restoreProtectedRegions(base, current, regions);

  await setStatus(context.jobId, "qc");
  await qualityControl(context, base, protection.image, {
    vegetation: passes.includes("vegetation"),
    aspectChanged,
    protection: protection.regions,
    manualRegions: input.protectedRegions.length,
  });
  const asset = await storeImageAsset(context.projectId, "render_output", "resultat.png", protection.image);
  await createVersion(context, "generate", asset.id, null);
}

async function maskFor(area: RelativeRegion, width: number, height: number): Promise<{ mask: Buffer; overlay: (source: Buffer, edited: Buffer) => Promise<Buffer> }> {
  const region = toPixelRegion(area, width, height);
  if (!region) throw new Error("La zona marcada és massa petita.");
  const mask = await sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } })
    .composite([{ input: { create: { width: region.width, height: region.height, channels: 3, background: { r: 255, g: 255, b: 255 } } }, left: region.left, top: region.top }])
    .png()
    .toBuffer();
  // Only the marked area may change: paste the edited area onto the source with a feathered edge.
  const overlay = async (source: Buffer, edited: Buffer) => {
    const crop = await sharp(edited).extract(region).removeAlpha().raw().toBuffer();
    const alpha = featherMask(region.width, region.height, 8);
    const rgba = Buffer.alloc(region.width * region.height * 4);
    for (let pixel = 0; pixel < region.width * region.height; pixel += 1) {
      crop.copy(rgba, pixel * 4, pixel * 3, pixel * 3 + 3);
      rgba[pixel * 4 + 3] = alpha[pixel];
    }
    return sharp(source)
      .composite([{ input: rgba, raw: { width: region.width, height: region.height, channels: 4 }, left: region.left, top: region.top }])
      .png()
      .toBuffer();
  };
  return { mask, overlay };
}

async function runCorrection(context: JobContext, input: StoredCorrectionInput) {
  const db = getDb();
  const source = await db.renderVersion.findUniqueOrThrow({ where: { id: input.sourceVersionId } });
  const [current, original] = await Promise.all([readAsset(source.assetId), readAsset(input.originalAssetId)]);
  const { width = 1, height = 1 } = await sharp(original).metadata();

  // Reuse the analysis of the project's latest generation instead of paying for it again.
  const previous = await db.renderJob.findFirst({ where: { projectId: context.projectId, kind: "generate", status: "ready" }, orderBy: { createdAt: "desc" } });
  const analysis = (previous?.analysis as RenderAnalysis | null) ?? (await analyze(context, original));
  const manual = previous ? ((previous.input as GenerateInput).protectedRegions ?? []) : [];

  const built = buildCorrectionPrompt({ projectType: analysis.projectType, corrections: input.corrections, hasMask: input.area !== null, userNotes: input.notes });
  const area = input.area ? await maskFor(input.area, width, height) : null;
  const output = await editImage(context, "image-edit:correction", current, built, [], area?.mask);
  const fitted = await fitToBase(output, width, height);
  const scoped = area ? await area.overlay(current, fitted.image) : fitted.image;

  const regions = relativeRegions(analysis, manual)
    .map((region) => toPixelRegion(region, width, height))
    .filter((region) => region !== null);
  const protection = await restoreProtectedRegions(original, scoped, regions);

  await setStatus(context.jobId, "qc");
  await qualityControl(context, original, protection.image, {
    vegetation: input.corrections.some((id) => id.includes("vegetacio") || id.includes("arbres")),
    aspectChanged: fitted.aspectChanged,
    protection: protection.regions,
    manualRegions: manual.length,
  });
  const asset = await storeImageAsset(context.projectId, "render_output", "correccio.png", protection.image);
  await createVersion(context, "correction", asset.id, source.id);
}

/** «Tornar a l'original»: a new version that points at the original image, without any AI cost. */
async function runRestore(context: JobContext, input: StoredRestoreInput) {
  await getDb().qualityReport.create({
    data: { jobId: context.jobId, status: "ok", checks: [{ id: "original", label: "Imatge original", status: "ok", detail: "S'ha restaurat la imatge original sense cap crida d'IA." }] },
  });
  await createVersion(context, "restore", input.originalAssetId, null);
}

const FAILURE_MESSAGE = "No s'ha pogut generar la imatge.";

/** Runs a render job end to end. Idempotent: finished, failed or cancelled jobs are left untouched. */
export async function runRenderJob(jobId: string): Promise<void> {
  const db = getDb();
  const job = await db.renderJob.findUnique({ where: { id: jobId } });
  if (!job || job.status === "ready" || job.status === "cancelled") return;

  const image = getImageEditProvider().info;
  const vision = getVisionLLM().info;
  await db.renderJob.update({
    where: { id: jobId },
    data: {
      status: "processing",
      startedAt: new Date(),
      error: null,
      attempts: { increment: 1 },
      imageProvider: job.kind === "restore" ? null : image.provider,
      imageModel: job.kind === "restore" ? null : image.model,
      visionProvider: job.kind === "restore" ? null : vision.provider,
      visionModel: job.kind === "restore" ? null : vision.model,
    },
  });
  // A retried job starts clean: drop partial reports of a previous attempt.
  await db.qualityReport.deleteMany({ where: { jobId } });

  const context: JobContext = { jobId, userId: job.createdById, projectId: job.projectId };
  try {
    if (job.kind === "generate") await runGenerate(context, job.input as unknown as GenerateInput);
    else if (job.kind === "correction") await runCorrection(context, job.input as unknown as StoredCorrectionInput);
    else await runRestore(context, job.input as unknown as StoredRestoreInput);
  } catch (error) {
    if (error instanceof JobCancelled) return;
    const reason = error instanceof Error ? error.message : "Error desconegut";
    console.error(JSON.stringify({ event: "render_job_failed", jobId, reason: reason.slice(0, 300) }));
    await db.renderJob.update({
      where: { id: jobId },
      data: { status: "failed", finishedAt: new Date(), error: `${FAILURE_MESSAGE} ${reason}`.slice(0, 500) },
    });
  }
}
