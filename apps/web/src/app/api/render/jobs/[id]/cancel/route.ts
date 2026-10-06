import { getDb } from "@/lib/db";
import { ApiError, apiRoute, ownedProject, requireApiUser } from "@/server/api";

export const runtime = "nodejs";

export const POST = apiRoute<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const job = await getDb().renderJob.findUnique({ where: { id } });
  if (!job) throw new ApiError(404, "No s'ha trobat el treball.");
  await ownedProject(job.projectId, user.id);
  const { count } = await getDb().renderJob.updateMany({
    where: { id, status: { in: ["queued", "processing", "qc"] } },
    data: { status: "cancelled", finishedAt: new Date() },
  });
  return Response.json({ cancelled: count === 1 });
});
