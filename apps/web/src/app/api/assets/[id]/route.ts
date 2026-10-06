import { getDb } from "@/lib/db";
import { ApiError, apiRoute, requireApiUser } from "@/server/api";
import { sanitizeFileName } from "@/server/images";
import { getStorage } from "@/server/storage";

export const runtime = "nodejs";

/** Serves a stored file only to the owner of its project (§3, §8). */
export const GET = apiRoute<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const asset = await getDb().asset.findUnique({ where: { id }, include: { project: { select: { ownerId: true } } } });
  if (!asset || asset.project.ownerId !== user.id) throw new ApiError(404, "No s'ha trobat el fitxer.");

  const data = await getStorage().get(asset.storageKey);
  const download = new URL(request.url).searchParams.get("download");
  const headers: Record<string, string> = {
    "Content-Type": asset.mimeType,
    "Content-Length": String(data.length),
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
  if (download !== null) {
    const name = sanitizeFileName(download || asset.fileName, asset.fileName);
    headers["Content-Disposition"] = `attachment; filename="${name.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`;
  }
  return new Response(new Uint8Array(data), { headers });
});
