import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { UploadRejected, inspectImage, sanitizeFileName, sha256 } from "./images";

const solid = (format: "png" | "jpeg" | "gif", width = 40, height = 20) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 100, b: 50 } } })
    .toFormat(format)
    .toBuffer();

describe("inspectImage", () => {
  it("accepts PNG and JPEG by content", async () => {
    expect(await inspectImage(await solid("png"))).toEqual({ mimeType: "image/png", extension: ".png", width: 40, height: 20 });
    expect((await inspectImage(await solid("jpeg"))).mimeType).toBe("image/jpeg");
  });

  it("rejects other formats, garbage and truncated files", async () => {
    await expect(inspectImage(await solid("gif"))).rejects.toThrow(UploadRejected);
    await expect(inspectImage(Buffer.from("%PDF-1.7 not an image"))).rejects.toThrow("no és una imatge vàlida");
    const png = await solid("png", 400, 400);
    await expect(inspectImage(png.subarray(0, png.length / 2))).rejects.toThrow(UploadRejected);
  });

  it("enforces the pixel limit", async () => {
    // 70 MP of a single colour compresses to a small file but exceeds the limit when decoded.
    const huge = await sharp({ create: { width: 10000, height: 7000, channels: 3, background: { r: 0, g: 0, b: 0 } } }).png({ compressionLevel: 9 }).toBuffer();
    await expect(inspectImage(huge)).rejects.toThrow("massa gran");
  });
});

describe("sanitizeFileName", () => {
  it("strips paths and unsafe characters", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("C:\\Users\\x\\Façana nord <v2>.png")).toBe("Façana nord _v2_.png");
    expect(sanitizeFileName("...")).toBe("fitxer");
  });
});

it("hashes content", () => {
  expect(sha256(Buffer.from("a"))).toHaveLength(64);
});
