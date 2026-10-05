// Copies the prompt fragments from docs/*.md into prompts/fragments.json (server-only data) and marks
// the review status of the UI options that have a fragment.
// Run with `pnpm --filter @cr/catalog sync-fragments` after editing a specification document.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { parseFragmentDoc } from "../src/fragments-doc.ts";

const root = new URL("../", import.meta.url);
const docs = ["ESPECIFICACIO_RENDER.md", "PROMPT_ASSISTENT_RENDERS.md", "PROMPT_ASSISTENT_CAD.md"];

type Fragment = { id: string; title: string; text: string; status: string; source: string };
const all = new Map<string, Fragment>();
for (const doc of docs) {
  const parsed = parseFragmentDoc(readFileSync(new URL(`../../docs/${doc}`, root), "utf8"));
  for (const fragment of parsed.fragments) {
    if (all.has(fragment.id)) throw new Error(`Fragment ${fragment.id} defined twice`);
    all.set(fragment.id, { ...fragment, status: parsed.status, source: `docs/${doc}` });
  }
}

const used = new Set<string>();
const renderDir = new URL("render/", root);
for (const file of readdirSync(renderDir).filter((name) => name.endsWith(".json"))) {
  const url = new URL(file, renderDir);
  const data = JSON.parse(readFileSync(url, "utf8"));
  for (const group of data.groups) {
    for (const option of group.options) {
      const fragment = all.get(option.id);
      if (!fragment) continue;
      used.add(option.id);
      // Label-level pending items stay pending; otherwise the document status applies.
      if (option.status !== "PENDENT_REVISIO" || fragment.status === "PENDENT_REVISIO") option.status = fragment.status;
    }
  }
  writeFileSync(url, `${JSON.stringify(data, null, 2)}\n`);
}

const fragments = [...all.values()];
writeFileSync(new URL("prompts/fragments.json", root), `${JSON.stringify({ fragments }, null, 2)}\n`);
console.log(`${fragments.length} fragments synchronised (${used.size} linked to UI options).`);
