import { getDb } from "@/lib/db";
import { ApiError, apiRoute, ownedProject, requireApiUser } from "@/server/api";

export const runtime = "nodejs";

export const POST = apiRoute<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const db = getDb();
  const version = await db.renderVersion.findUnique({ where: { id } });
  if (!version) throw new ApiError(404, "No s'ha trobat la versió.");
  await ownedProject(version.projectId, user.id);
  await db.$transaction([
    db.renderVersion.update({ where: { id }, data: { approvedAt: version.approvedAt ?? new Date(), approvedById: version.approvedById ?? user.id } }),
    db.project.update({ where: { id: version.projectId }, data: { status: "approved" } }),
  ]);
  return Response.json({ approved: true });
});
