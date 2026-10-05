import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseFragmentDoc } from "./fragments-doc";
import { allGroups, renderCatalog } from "./index";
import { getFragment, hasFragment, promptFragments } from "./prompts";

const readDoc = (name: string) => readFileSync(new URL(`../../../docs/${name}`, import.meta.url), "utf8");
const docs = ["ESPECIFICACIO_RENDER.md", "PROMPT_ASSISTENT_RENDERS.md", "PROMPT_ASSISTENT_CAD.md"].map((name) => parseFragmentDoc(readDoc(name)));
const docFragments = new Map(docs.flatMap((doc) => doc.fragments.map((fragment) => [fragment.id, fragment.text] as const)));

describe("prompt fragments", () => {
  it("are transcribed literally from the specification documents (run `pnpm sync-fragments` otherwise)", () => {
    expect(new Map(promptFragments.map((fragment) => [fragment.id, fragment.text]))).toEqual(docFragments);
  });

  it("exist for every render option that reaches the prompt", () => {
    const groups = [
      ...renderCatalog.improvements.groups,
      ...renderCatalog.details.flatMap((category) => category.groups),
      ...renderCatalog.fidelity.groups,
      ...renderCatalog.references.groups,
      ...renderCatalog.corrections.groups,
    ];
    for (const option of groups.flatMap((group) => group.options)) expect(hasFragment(option.id), option.id).toBe(true);
  });

  it("are not part of the UI catalog that is sent to the browser", () => {
    expect(JSON.stringify(allGroups())).not.toContain("You are editing an architectural render");
    expect(JSON.stringify(allGroups())).not.toContain("Make the glazing");
  });

  it("include the base, control and project type fragments", () => {
    expect(getFragment("base.corporatiu")).toContain("Bonpreu, Esclat, Esclat Oil, Cupra and SEAT");
    expect(getFragment("control.final")).toContain("same framing and aspect ratio");
    expect(getFragment("tipologia.altres")).toBeTruthy();
    expect(() => getFragment("tipologia.inexistent")).toThrow();
  });

  it("are pending review until Colomer-Rifà approves the documents", () => {
    expect(docs.every((doc) => doc.status === "PENDENT_REVISIO")).toBe(true);
    expect(promptFragments.every((fragment) => fragment.status === "PENDENT_REVISIO")).toBe(true);
    expect(renderCatalog.fidelity.groups[0].options.every((option) => option.status === "PENDENT_REVISIO")).toBe(true);
  });
});

describe("parseFragmentDoc", () => {
  it("parses ids, titles, text and status", () => {
    const doc = parseFragmentDoc("> **Estat: REVISAT.**\n\n### `a.b` · Títol\n\n```text\nHello\n```\n");
    expect(doc).toEqual({ status: "ok", fragments: [{ id: "a.b", title: "Títol", text: "Hello" }] });
  });

  it("rejects duplicates and documents without status", () => {
    expect(() => parseFragmentDoc("### `a.b` · X\n\n```text\nA\n```\n")).toThrow();
    const dup = "**Estat: REVISAT.**\n### `a.b` · X\n\n```text\nA\n```\n### `a.b` · Y\n\n```text\nB\n```\n";
    expect(() => parseFragmentDoc(dup)).toThrow(/Duplicated/);
  });
});
