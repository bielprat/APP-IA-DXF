import { jobRequestSchema } from "@/features/render/jobRequest";
import { apiRoute, requireApiUser } from "@/server/api";
import { createRenderJob } from "@/server/render/jobs";

export const runtime = "nodejs";

export const POST = apiRoute(async (request) => {
  const user = await requireApiUser();
  const job = await createRenderJob(user.id, jobRequestSchema.parse(await request.json()));
  return Response.json({ jobId: job.id, projectId: job.projectId }, { status: 201 });
});
