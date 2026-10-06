import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { meanAbsoluteDifference } from "@/server/render/protect";
import { MockImageEditProvider, MockVisionLLM } from "./mock";

const base = await sharp({ create: { width: 320, height: 200, channels: 3, background: { r: 120, g: 130, b: 140 } } }).png().toBuffer();

describe("MockImageEditProvider", () => {
  it("keeps the size and visibly marks the output", async () => {
    const { image } = await new MockImageEditProvider().edit({ image: base, prompt: "x", references: [] });
    const meta = await sharp(image).metadata();
    expect([meta.width, meta.height]).toEqual([320, 200]);
    const raw = (buffer: Buffer) => sharp(buffer).removeAlpha().raw().toBuffer();
    expect(meanAbsoluteDifference(await raw(base), await raw(image))).toBeGreaterThan(10);
  });

  it("identifies itself as mock", () => {
    expect(new MockImageEditProvider().info.mock).toBe(true);
  });
});

describe("MockVisionLLM", () => {
  it("never claims a check passed", async () => {
    const { checks } = await new MockVisionLLM().qualityCheck(base, base, { vegetation: true });
    expect(checks.length).toBe(23);
    expect(checks.every((check) => check.status === "unsure")).toBe(true);
  });

  it("does not invent an analysis", async () => {
    expect((await new MockVisionLLM().analyzeRender()).analysis).toEqual({ projectType: null, confidence: 0, protectedRegions: [] });
  });
});
