/**
 * Parser for the specification documents in docs/ (ESPECIFICACIO_RENDER.md and the assistant prompts).
 * Each fragment is a heading with the id in backticks followed by a ```text block. Kept free of
 * imports and TypeScript-only syntax so `node` can run it directly from scripts/sync-fragments.ts.
 */

export type FragmentStatus = "ok" | "PENDENT_REVISIO";
export type DocFragment = { id: string; title: string; text: string };
export type FragmentDoc = { status: FragmentStatus; fragments: DocFragment[] };

const FRAGMENT = /^#{2,4} `([a-z0-9-]+\.[a-z0-9-]+)` · (.+)\n+```text\n([\s\S]*?)\n```/gm;
const STATUS = /\*\*Estat: (PENDENT_REVISIO|REVISAT)\.\*\*/;

export function parseFragmentDoc(markdown: string): FragmentDoc {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const statusMatch = STATUS.exec(normalized);
  if (!statusMatch) throw new Error("Document without «**Estat: PENDENT_REVISIO.**» or «**Estat: REVISAT.**»");
  const fragments: DocFragment[] = [];
  const seen = new Set<string>();
  for (const match of normalized.matchAll(FRAGMENT)) {
    const [, id, title, text] = match;
    if (seen.has(id)) throw new Error(`Duplicated fragment id ${id}`);
    if (!text.trim()) throw new Error(`Empty fragment ${id}`);
    seen.add(id);
    fragments.push({ id, title: title.trim(), text: text.trim() });
  }
  return { status: statusMatch[1] === "REVISAT" ? "ok" : "PENDENT_REVISIO", fragments };
}
