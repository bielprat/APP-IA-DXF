import sharp from "sharp";
import { ARCHITECTURE_CHECKS, VEGETATION_CHECKS, type ImageEditProvider, type ImageEditRequest, type QcCheck, type VisionLLM } from "./types";

const MOCK_DETAIL = "Proveïdor de proves (mock): no s'ha comprovat.";

/**
 * Test vision provider. It does not analyse anything: no project type, no protected regions,
 * and every QC item is "unsure" so the interface never shows an unverified result as correct.
 */
export class MockVisionLLM implements VisionLLM {
  readonly info = { provider: "mock", model: "mock-vision", mock: true };

  async analyzeRender() {
    return { analysis: { projectType: null, confidence: 0, protectedRegions: [] } };
  }

  async qualityCheck(_base: Buffer, _result: Buffer, options: { vegetation: boolean }) {
    const items = options.vegetation ? [...ARCHITECTURE_CHECKS, ...VEGETATION_CHECKS] : ARCHITECTURE_CHECKS;
    const checks: QcCheck[] = items.map(([id, label]) => ({ id, label, status: "unsure", detail: MOCK_DETAIL }));
    return { checks };
  }
}

/** Diagonal hazard stripes and frame so a mock output can never be mistaken for a real result. */
function mockOverlay(width: number, height: number): Buffer {
  const border = Math.min(Math.max(12, Math.round(Math.min(width, height) * 0.04)), Math.floor(Math.min(width, height) / 4));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <pattern id="hazard" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="24" height="48" fill="#ED7902"/><rect x="24" width="24" height="48" fill="#212121"/>
    </pattern>
    <pattern id="hatch" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <rect width="8" height="64" fill="#ED7902" fill-opacity="0.35"/>
    </pattern>
    <mask id="frame"><rect width="${width}" height="${height}" fill="white"/><rect x="${border}" y="${border}" width="${width - 2 * border}" height="${height - 2 * border}" fill="black"/></mask>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#hatch)"/>
  <rect width="${width}" height="${height}" fill="url(#hazard)" mask="url(#frame)"/>
</svg>`;
  return Buffer.from(svg);
}

/**
 * Test image provider. Returns the input image (same size) with a visible striped frame and hatching.
 * It never imitates an AI result; the result screen also labels it as "mock".
 */
export class MockImageEditProvider implements ImageEditProvider {
  readonly info = { provider: "mock", model: "mock-image-edit", mock: true };

  async edit(request: ImageEditRequest) {
    const { width = 1, height = 1 } = await sharp(request.image).metadata();
    const image = await sharp(request.image)
      .composite([{ input: mockOverlay(width, height), top: 0, left: 0 }])
      .png()
      .toBuffer();
    return { image };
  }
}
