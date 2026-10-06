import { createHash } from "node:crypto";
import sharp, { type Metadata } from "sharp";

/** Maximum pixels accepted for any uploaded image (≈ 60 MP), to avoid decompression bombs. */
export const MAX_IMAGE_PIXELS = 60_000_000;

const FORMATS = { png: { mimeType: "image/png", extension: ".png" }, jpeg: { mimeType: "image/jpeg", extension: ".jpg" } } as const;

export type InspectedImage = { mimeType: string; extension: string; width: number; height: number };

export class UploadRejected extends Error {}

/**
 * Checks the real content (not the declared type or extension): decodes the image fully,
 * enforces PNG/JPEG and the pixel limit.
 */
export async function inspectImage(data: Buffer): Promise<InspectedImage> {
  let metadata: Metadata;
  try {
    const image = sharp(data, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "error" });
    metadata = await image.metadata();
    // Full decode: catches truncated or corrupted files that only have a valid header.
    await image.stats();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("pixel limit")) throw new UploadRejected("La imatge és massa gran (màxim 60 megapíxels).");
    throw new UploadRejected("El fitxer no és una imatge vàlida o està malmès.");
  }
  const format = metadata.format === "png" || metadata.format === "jpeg" ? FORMATS[metadata.format] : null;
  if (!format || !metadata.width || !metadata.height) throw new UploadRejected("Només s'accepten imatges PNG o JPG.");
  return { ...format, width: metadata.width, height: metadata.height };
}

export function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Keeps a readable, safe display name: no paths, control characters or odd symbols. */
export function sanitizeFileName(name: string, fallback = "fitxer"): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .normalize("NFC")
    .replace(/\p{Cc}/gu, "")
    .replace(/[^\p{L}\p{N} ._()-]/gu, "_")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+/, "")
    .trim()
    .slice(0, 120);
  return cleaned || fallback;
}
