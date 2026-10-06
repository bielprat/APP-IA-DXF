import { getDb } from "@/lib/db";
import { ApiError, apiRoute, ownedProject, requireApiUser } from "@/server/api";
import { enqueueRenderJob } from "@/server/jobs/queue";

export const runtime = "nodejs";

/** Retries a failed or cancelled job with the same input (idempotent per attempt). */
export const POST = apiRoute<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const db = getDb();
  const job = await db.renderJob.findUnique({ where: { id } });
  if (!job) throw new ApiError(404, "No s'ha trobat el treball.");
  await ownedProject(job.projectId, user.id);
  const active = await db.renderJob.count({ where: { projectId: job.projectId, status: { in: ["queued", "processing", "qc"] } } });
  if (active > 0) throw new ApiError(409, "Ja hi ha una generació en curs en aquest projecte.");
  const { count } = await db.renderJob.updateMany({
    where: { id, status: { in: ["failed", "cancelled"] } },
    data: { status: "queued", error: null, finishedAt: null },
  });
  if (count === 0) throw new ApiError(409, "Aquest treball no es pot reintentar.");
  await enqueueRenderJob(id, job.attempts);
  return Response.json({ retried: true });
});
