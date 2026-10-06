import "server-only";
import { MockImageEditProvider, MockVisionLLM } from "./mock";
import type { ImageEditProvider, VisionLLM } from "./types";

export * from "./types";

let vision: VisionLLM | undefined;
let imageEdit: ImageEditProvider | undefined;

/**
 * Providers are chosen by environment (§3.1) and never imported by business code directly.
 * Real providers (Anthropic, OpenAI, Gemini) are added once the company chooses and provides keys.
 */
export function getVisionLLM(): VisionLLM {
  if (!vision) {
    const name = process.env.VISION_PROVIDER ?? "mock";
    if (name !== "mock") throw new Error(`VISION_PROVIDER «${name}» encara no està disponible.`);
    vision = new MockVisionLLM();
  }
  return vision;
}

export function getImageEditProvider(): ImageEditProvider {
  if (!imageEdit) {
    const name = process.env.IMAGE_PROVIDER ?? "mock";
    if (name !== "mock") throw new Error(`IMAGE_PROVIDER «${name}» encara no està disponible.`);
    imageEdit = new MockImageEditProvider();
  }
  return imageEdit;
}
