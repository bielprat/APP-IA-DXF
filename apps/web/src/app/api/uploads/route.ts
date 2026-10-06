import { z } from "zod";
import { getDb } from "@/lib/db";
import { ApiError, apiRoute, ownedProject, requireApiUser } from "@/server/api";
import { storeImageAsset } from "@/server/assets";
import { sanitizeFileName } from "@/server/images";

export const runtime = "nodejs";

const MAX_BYTES = 40 * 1024 * 1024;
const fieldsSchema = z.object({ projectId: z.string().min(1).max(40).nullable() });

/** Uploads one render image. Creates the project on the first upload. */
export const POST = apiRoute(async (request) => {
  const user = await requireApiUser();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "No s'ha rebut cap fitxer.");
  if (file.size === 0) throw new ApiError(422, "El fitxer és buit.");
  if (file.size > MAX_BYTES) throw new ApiError(413, "El fitxer supera la mida màxima de 40 MB.");
  const { projectId } = fieldsSchema.parse({ projectId: form.get("projectId") });

  const fileName = sanitizeFileName(file.name, "render.png");
  const data = Buffer.from(await file.arrayBuffer());
  const project = projectId
    ? await ownedProject(projectId, user.id)
    : await getDb().project.create({ data: { ownerId: user.id, type: "render", name: fileName.replace(/\.[^.]+$/, "") || "Render" } });

  const asset = await storeImageAsset(project.id, "render_input", fileName, data);
  return Response.json({
    projectId: project.id,
    asset: { id: asset.id, fileName: asset.fileName, width: asset.width, height: asset.height, url: `/api/assets/${asset.id}` },
  });
});
