import sharp, { type OverlayOptions } from "sharp";

/** Region in base-image pixels. */
export type PixelRegion = { left: number; top: number; width: number; height: number; label: string };
/** Region relative to the image (0–1), as drawn by the user or returned by the analysis. */
export type RelativeRegion = { x: number; y: number; width: number; height: number; label: string };

export type ProtectionResult = {
  image: Buffer;
  regions: { label: string; deviation: number; restored: boolean }[];
};

export function toPixelRegion(region: RelativeRegion, imageWidth: number, imageHeight: number): PixelRegion | null {
  const left = Math.max(0, Math.floor(region.x * imageWidth));
  const top = Math.max(0, Math.floor(region.y * imageHeight));
  const right = Math.min(imageWidth, Math.ceil((region.x + region.width) * imageWidth - 1e-6));
  const bottom = Math.min(imageHeight, Math.ceil((region.y + region.height) * imageHeight - 1e-6));
  if (right - left < 2 || bottom - top < 2) return null;
  return { left, top, width: right - left, height: bottom - top, label: region.label };
}

async function rawRegion(image: Buffer, region: PixelRegion): Promise<Buffer> {
  return sharp(image).extract(region).removeAlpha().raw().toBuffer();
}

/** Mean absolute difference per channel (0–255) between two RGB buffers of equal size. */
export function meanAbsoluteDifference(a: Buffer, b: Buffer): number {
  if (a.length !== b.length) throw new Error("Buffers of different size");
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) sum += Math.abs(a[index] - b[index]);
  return a.length === 0 ? 0 : sum / a.length;
}

/** Alpha mask: opaque inside, linear ramp to transparent over `feather` px at the edges. */
export function featherMask(width: number, height: number, feather: number): Buffer {
  const mask = Buffer.alloc(width * height);
  const ramp = Math.max(1, Math.min(feather, Math.floor(Math.min(width, height) / 2)));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const distance = Math.min(x, y, width - 1 - x, height - 1 - y);
      mask[y * width + x] = Math.round(255 * Math.min(1, (distance + 1) / ramp));
    }
  }
  return mask;
}

/**
 * Logo protection (§5.3.5): for every protected region, if the result deviates from the base image,
 * the original pixels are put back with a feathered edge. Both images must have the same size.
 */
export async function restoreProtectedRegions(
  base: Buffer,
  result: Buffer,
  regions: readonly PixelRegion[],
  options: { threshold?: number; feather?: number } = {},
): Promise<ProtectionResult> {
  const threshold = options.threshold ?? 4;
  const feather = options.feather ?? 6;
  const [baseMeta, resultMeta] = await Promise.all([sharp(base).metadata(), sharp(result).metadata()]);
  if (baseMeta.width !== resultMeta.width || baseMeta.height !== resultMeta.height) {
    throw new Error("Base and result must have the same size before restoring protected regions");
  }

  const report: ProtectionResult["regions"] = [];
  const overlays: OverlayOptions[] = [];
  for (const region of regions) {
    const [original, generated] = await Promise.all([rawRegion(base, region), rawRegion(result, region)]);
    const deviation = meanAbsoluteDifference(original, generated);
    const restored = deviation > threshold;
    report.push({ label: region.label, deviation: Math.round(deviation * 100) / 100, restored });
    if (!restored) continue;
    const alpha = featherMask(region.width, region.height, feather);
    const rgba = Buffer.alloc(region.width * region.height * 4);
    for (let pixel = 0; pixel < region.width * region.height; pixel += 1) {
      original.copy(rgba, pixel * 4, pixel * 3, pixel * 3 + 3);
      rgba[pixel * 4 + 3] = alpha[pixel];
    }
    overlays.push({ input: rgba, raw: { width: region.width, height: region.height, channels: 4 }, left: region.left, top: region.top });
  }

  const image = overlays.length === 0 ? result : await sharp(result).composite(overlays).png().toBuffer();
  return { image, regions: report };
}
