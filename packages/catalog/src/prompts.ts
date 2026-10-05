/**
 * Prompt texts (from docs/*.md via `pnpm sync-fragments`). Server-side only: never import this
 * entry from client components, so prompts never reach the browser (prompt §10).
 */
import fragmentsJson from "../prompts/fragments.json";
import { promptFragmentsSchema, type PromptFragment } from "./schema";

export const promptFragments: readonly PromptFragment[] = promptFragmentsSchema.parse(fragmentsJson).fragments;

const index = new Map(promptFragments.map((fragment) => [fragment.id, fragment]));

/** Text of a fragment: a UI option id (e.g. "vidres.mes-foscos") or a standalone id (e.g. "control.final"). */
export function getFragment(id: string): string {
  const fragment = index.get(id);
  if (!fragment) throw new Error(`Unknown prompt fragment ${id}`);
  return fragment.text;
}

export function hasFragment(id: string): boolean {
  return index.has(id);
}
