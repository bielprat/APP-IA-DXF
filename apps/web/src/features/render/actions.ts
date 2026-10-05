"use server";

import { buildRenderPrompt, planRenderPasses, type PromptWarning } from "@cr/prompt-engine";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";

const ids = z.array(z.string().max(80)).max(30);

const inputSchema = z.object({
  projectType: z.string().max(40).nullable().optional(),
  improvements: ids,
  details: z.record(z.string().max(80), ids),
  fidelity: z.string().max(80),
  references: z.array(z.object({ purpose: z.string().max(80).nullable(), take: ids })).max(10),
  vegetationReferences: z.array(z.object({ copy: ids })).max(10),
  userNotes: z.string().max(5000).nullable().optional(),
});

/**
 * Builds the prompt on the server and returns only the warnings (e.g. options discarded by
 * «Màxima fidelitat»). The prompt itself never leaves the server.
 */
export async function previewRenderWarnings(raw: unknown): Promise<PromptWarning[]> {
  await requireUser();
  const input = inputSchema.parse(raw);
  const seen = new Set<string>();
  const warnings: PromptWarning[] = [];
  for (const pass of planRenderPasses(input)) {
    for (const warning of buildRenderPrompt(input, pass).warnings) {
      const key = `${warning.code}:${warning.optionId ?? warning.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        warnings.push(warning);
      }
    }
  }
  return warnings;
}
