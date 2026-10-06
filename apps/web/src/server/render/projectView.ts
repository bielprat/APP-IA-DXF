import "server-only";
import { getOption } from "@cr/catalog";
import type { GenerateInput, StoredCorrectionInput } from "@/features/render/jobRequest";
import type { QcCheckView, RenderProjectView } from "@/features/render/projectView";
import { getDb } from "@/lib/db";

const label = (id: string) => {
  try {
    return getOption(id).label;
  } catch {
    return id;
  }
};

/** «Configuració aplicada»: labels only, never prompt text. */
function describe(kind: string, input: unknown): string[] {
  if (kind === "restore") return ["Imatge original, sense IA"];
  if (kind === "correction") {
    const correction = input as StoredCorrectionInput;
    const lines = correction.corrections.map((id) => `Correcció · ${label(id)}`);
    if (correction.notes.trim()) lines.push("Amb indicacions addicionals");
    return lines;
  }
  const generate = input as GenerateInput;
  const lines = generate.improvements.map((id) => {
    const category = getOption(id).detailsCategory;
    const chosen = Object.entries(generate.details)
      .filter(([groupId]) => category && groupId.startsWith(`${category}.`) && groupId !== "vegetacio.copiar")
      .flatMap(([, ids]) => ids.map(label));
    return chosen.length > 0 ? `${label(id)} · ${chosen.join(", ")}` : label(id);
  });
  lines.push(`Fidelitat: ${label(generate.fidelity)}`);
  if (generate.protectedRegions.length > 0) lines.push(`${generate.protectedRegions.length} zones protegides marcades`);
  return lines;
}

export async function getRenderProjectView(projectId: string): Promise<RenderProjectView> {
  const db = getDb();
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      renderVersions: { orderBy: { number: "asc" }, include: { job: { include: { qualityReport: true } } } },
      renderJobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const firstGenerate = await db.renderJob.findFirst({ where: { projectId, kind: "generate" }, orderBy: { createdAt: "asc" } });
  const originalAsset = firstGenerate ? await db.asset.findUnique({ where: { id: (firstGenerate.input as unknown as GenerateInput).baseAssetId } }) : null;
  const numbers = new Map(project.renderVersions.map((version) => [version.id, version.number]));
  const latest = project.renderJobs[0];

  return {
    id: project.id,
    name: project.name,
    status: project.status,
    original: originalAsset ? { url: `/api/assets/${originalAsset.id}`, width: originalAsset.width, height: originalAsset.height } : null,
    versions: project.renderVersions.map((version) => ({
      id: version.id,
      number: version.number,
      kind: version.kind,
      url: `/api/assets/${version.assetId}`,
      approved: version.approvedAt !== null,
      createdAt: version.createdAt.toISOString(),
      parentNumber: version.parentVersionId ? (numbers.get(version.parentVersionId) ?? null) : null,
      provider: version.job.imageProvider,
      mock: version.job.imageProvider === "mock",
      qc: version.job.qualityReport
        ? { status: version.job.qualityReport.status as "ok" | "warning" | "unverified", checks: version.job.qualityReport.checks as unknown as QcCheckView[] }
        : null,
      summary: describe(version.job.kind, version.job.input),
    })),
    latestJob: latest
      ? { id: latest.id, kind: latest.kind, status: latest.status, error: latest.error, createdAt: latest.createdAt.toISOString() }
      : null,
  };
}
