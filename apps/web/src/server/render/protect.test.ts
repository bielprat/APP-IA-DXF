import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { featherMask, meanAbsoluteDifference, restoreProtectedRegions, toPixelRegion } from "./protect";

const W = 100;
const H = 60;
const solid = (r: number, g: number, b: number) => sharp({ create: { width: W, height: H, channels: 3, background: { r, g, b } } }).png().toBuffer();
const pixel = async (image: Buffer, x: number, y: number) => {
  const { data, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const offset = (y * info.width + x) * 3;
  return [data[offset], data[offset + 1], data[offset + 2]];
};

describe("restoreProtectedRegions", () => {
  it("restores the original pixels of a modified logo region with a feathered edge", async () => {
    const base = await solid(255, 0, 0);
    const result = await solid(0, 0, 255);
    const region = { left: 20, top: 10, width: 30, height: 20, label: "Logo Bonpreu" };
    const output = await restoreProtectedRegions(base, result, [region], { feather: 4 });
    expect(output.regions).toEqual([{ label: "Logo Bonpreu", deviation: 170, restored: true }]);
    expect(await pixel(output.image, 35, 20)).toEqual([255, 0, 0]); // centre restored
    expect(await pixel(output.image, 5, 5)).toEqual([0, 0, 255]); // outside untouched
    const edge = await pixel(output.image, 20, 20); // feathered border is a blend
    expect(edge[0]).toBeGreaterThan(0);
    expect(edge[0]).toBeLessThan(255);
  });

  it("leaves regions that did not change", async () => {
    const base = await solid(10, 20, 30);
    const output = await restoreProtectedRegions(base, base, [{ left: 0, top: 0, width: 10, height: 10, label: "Rètol" }]);
    expect(output.regions[0].restored).toBe(false);
    expect(output.image).toBe(base);
  });

  it("refuses images of different sizes", async () => {
    const other = await sharp({ create: { width: 50, height: 50, channels: 3, background: { r: 0, g: 0, b: 0 } } }).png().toBuffer();
    await expect(restoreProtectedRegions(await solid(0, 0, 0), other, [])).rejects.toThrow("same size");
  });
});

describe("helpers", () => {
  it("converts relative regions and clamps them to the image", () => {
    expect(toPixelRegion({ x: 0.1, y: 0.5, width: 0.2, height: 0.8, label: "x" }, 1000, 500)).toEqual({ left: 100, top: 250, width: 200, height: 250, label: "x" });
    expect(toPixelRegion({ x: 0.999, y: 0, width: 0.0001, height: 0.1, label: "x" }, 1000, 500)).toBeNull();
  });

  it("builds a mask that is opaque inside and ramps at the edges", () => {
    const mask = featherMask(10, 10, 3);
    expect(mask[5 * 10 + 5]).toBe(255);
    expect(mask[0]).toBeLessThan(255);
  });

  it("measures differences", () => {
    expect(meanAbsoluteDifference(Buffer.from([0, 10]), Buffer.from([10, 0]))).toBe(10);
  });
});
