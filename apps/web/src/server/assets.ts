import "server-only";
import { randomUUID } from "node:crypto";
import type { AssetKind } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { inspectImage, sha256 } from "./images";
import { assetKey, getStorage } from "./storage";

/** Stores an image (PNG/JPEG, validated by content) and records it as an Asset of the project. */
export async function storeImageAsset(projectId: string, kind: AssetKind, fileName: string, data: Buffer) {
  const image = await inspectImage(data);
  const id = randomUUID().replace(/-/g, "");
  const storageKey = assetKey(projectId, id, image.extension);
  await getStorage().put(storageKey, data, image.mimeType);
  try {
    return await getDb().asset.create({
      data: {
        id,
        projectId,
        kind,
        fileName,
        mimeType: image.mimeType,
        sizeBytes: data.length,
        width: image.width,
        height: image.height,
        sha256: sha256(data),
        storageKey,
      },
    });
  } catch (error) {
    await getStorage().delete(storageKey);
    throw error;
  }
}

export async function readAsset(assetId: string): Promise<Buffer> {
  const asset = await getDb().asset.findUniqueOrThrow({ where: { id: assetId } });
  return getStorage().get(asset.storageKey);
}
