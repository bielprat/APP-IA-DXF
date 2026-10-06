import { apiRoute, ownedProject, requireApiUser } from "@/server/api";
import { getRenderProjectView } from "@/server/render/projectView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;
  await ownedProject(id, user.id);
  return Response.json(await getRenderProjectView(id), { headers: { "Cache-Control": "no-store" } });
});
