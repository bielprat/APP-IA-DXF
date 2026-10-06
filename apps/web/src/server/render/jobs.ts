import "server-only";
import { CATALOG_VERSION } from "@cr/catalog";
import { ENGINE_VERSION } from "@cr/prompt-engine";
import type { Prisma } from "@/generated/prisma/client";
import type { GenerateInput, JobRequest, StoredCorrectionInput, StoredRestoreInput } from "@/features/render/jobRequest";
import { getDb } from "@/lib/db";
import { ApiError, ownedProject } from "@/server/api";
import { enqueueRenderJob } from "@/server/jobs/queue";

const ACTIVE = ["queued", "processing", "qc"] as const;

/** Input of the project's latest generation: original image, choices and protected regions. */
async function latestGenerateInput(projectId: string): Promise<GenerateInput> {
  const job = await getDb().renderJob.findFirst({ where: { projectId, kind: "generate" }, orderBy: { createdAt: "desc" } });
  if (!job) throw new ApiError(409, "Aquest projecte encara no té cap generació.");
  return job.input as unknown as GenerateInput;
}

async function assertOwnAssets(projectId: string, assetIds: string[]) {
  const unique = [...new Set(assetIds)];
  const count = await getDb().asset.count({ where: { id: { in: unique }, projectId, kind: "render_input" } });
  if (count !== unique.length) throw new ApiError(400, "Alguna imatge no pertany a aquest projecte.");
}

async function versionOf(projectId: string, versionId: string) {
  const version = await getDb().renderVersion.findUnique({ where: { id: versionId }, include: { job: true } });
  if (!version || version.projectId !== projectId) throw new ApiError(404, "No s'ha trobat la versió.");
  return version;
}

/** Validates ownership, stores the job and queues it. Only one active job per project. */
export async function createRenderJob(userId: string, request: JobRequest) {
  const db = getDb();
  await ownedProject(request.projectId, userId);
  const active = await db.renderJob.count({ where: { projectId: request.projectId, status: { in: [...ACTIVE] } } });
  if (active > 0) throw new ApiError(409, "Ja hi ha una generació en curs en aquest projecte.");

  let kind: "generate" | "correction" | "restore";
  let input: GenerateInput | StoredCorrectionInput | StoredRestoreInput;
  let sourceVersionId: string | null = null;

  switch (request.kind) {
    case "generate":
      await assertOwnAssets(request.projectId, [
        request.input.baseAssetId,
        ...request.input.references.map((reference) => reference.assetId),
        ...request.input.vegetationReferences.map((reference) => reference.assetId),
      ]);
      if (request.input.improvements.length === 0) throw new ApiError(400, "Tria almenys una millora.");
      kind = "generate";
      input = request.input;
      break;
    case "regenerate": {
      const version = await versionOf(request.projectId, request.sourceVersionId);
      kind = "generate";
      input = version.job.kind === "generate" ? (version.job.input as unknown as GenerateInput) : await latestGenerateInput(request.projectId);
      break;
    }
    case "correction": {
      const version = await versionOf(request.projectId, request.input.sourceVersionId);
      const original = await latestGenerateInput(request.projectId);
      const hasZone = request.input.corrections.includes("correccions.nomes-aquesta-zona");
      if (hasZone && !request.input.area) throw new ApiError(400, "Marca la zona que vols millorar.");
      if (request.input.corrections.length === 0 && !request.input.notes.trim()) throw new ApiError(400, "Tria almenys una correcció.");
      kind = "correction";
      sourceVersionId = version.id;
      input = { ...request.input, area: hasZone ? request.input.area : null, originalAssetId: original.baseAssetId };
      break;
    }
    case "restore":
      kind = "restore";
      input = { originalAssetId: (await latestGenerateInput(request.projectId)).baseAssetId };
      break;
  }

  const job = await db.renderJob.create({
    data: {
      projectId: request.projectId,
      createdById: userId,
      kind,
      input: input as unknown as Prisma.InputJsonValue,
      sourceVersionId,
      catalogVersion: CATALOG_VERSION,
      engineVersion: ENGINE_VERSION,
    },
  });
  try {
    await enqueueRenderJob(job.id);
  } catch (error) {
    await db.renderJob.update({ where: { id: job.id }, data: { status: "failed", error: "No s'ha pogut posar a la cua. Torna-ho a provar." } });
    throw error;
  }
  return job;
}
