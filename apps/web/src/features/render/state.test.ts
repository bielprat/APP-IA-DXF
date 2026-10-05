import { describe, expect, it } from "vitest";
import {
  ROLE_BASE,
  ROLE_PERSPECTIVE,
  ROLE_REFERENCE,
  baseImage,
  detailTabs,
  detailsBlockedReason,
  generateBlockedReason,
  initialRenderState,
  invalidDetailTabs,
  renderReducer,
  restoreRenderState,
  summarizeRender,
  toPromptInput,
  uploadBlockedReason,
  type RenderAction,
  type RenderFlowState,
} from "./state";

const img = (id: string) => ({ id, name: `${id}.jpg`, size: 10, url: `blob:${id}` });
const run = (...actions: RenderAction[]) => actions.reduce(renderReducer, initialRenderState);

describe("images", () => {
  it("makes the first upload the base image and the rest references", () => {
    const state = run({ type: "addImages", images: [img("a"), img("b")] }, { type: "addImages", images: [img("c")] });
    expect(state.images.map((image) => image.role)).toEqual([ROLE_BASE, ROLE_REFERENCE, ROLE_REFERENCE]);
  });

  it("keeps a single base image", () => {
    const state = run({ type: "addImages", images: [img("a"), img("b")] }, { type: "setRole", id: "b", role: ROLE_BASE });
    expect(state.images.filter((image) => image.role === ROLE_BASE).map((image) => image.id)).toEqual(["b"]);
    expect(baseImage(state)?.id).toBe("b");
  });

  it("presets the purpose of other perspectives", () => {
    const state = run({ type: "addImages", images: [img("a"), img("b")] }, { type: "setRole", id: "b", role: ROLE_PERSPECTIVE });
    expect(state.images[1].purpose).toBe("referencies.per-perspectiva");
  });

  it("blocks the upload step until there is a base image", () => {
    expect(uploadBlockedReason(initialRenderState)).not.toBeNull();
    const state = run({ type: "addImages", images: [img("a")] }, { type: "removeImage", id: "a" });
    expect(uploadBlockedReason(state)).not.toBeNull();
    expect(uploadBlockedReason(run({ type: "addImages", images: [img("a")] }))).toBeNull();
  });
});

describe("details", () => {
  it("shows tabs only for selected categories with details", () => {
    expect(detailTabs(initialRenderState)).toEqual([]);
    const state = run(
      { type: "toggleImprovement", id: "millores.illuminacio" },
      { type: "toggleImprovement", id: "millores.vegetacio" },
      { type: "toggleImprovement", id: "millores.interiors" },
    );
    expect(detailTabs(state).map((tab) => tab.category)).toEqual(["illuminacio", "vegetacio"]);
  });

  it("requires a vegetation action and what to copy from a vegetation reference", () => {
    let state = run({ type: "toggleImprovement", id: "millores.vegetacio" });
    expect(invalidDetailTabs(state)).toEqual([]);
    state = renderReducer(state, { type: "setDetail", groupId: "vegetacio.accions", selected: [] });
    expect(invalidDetailTabs(state)).toEqual(["vegetacio"]);
    state = renderReducer(state, { type: "setDetail", groupId: "vegetacio.accions", selected: ["vegetacio.arbres"] });
    state = renderReducer(state, { type: "addVegetationReference", image: img("v") });
    expect(detailsBlockedReason(state)).not.toBeNull();
    state = renderReducer(state, { type: "setVegetationCopy", id: "v", copy: ["vegetacio.copiar-densitat"] });
    expect(detailsBlockedReason(state)).toBeNull();
  });
});

describe("generate", () => {
  const ready = (): RenderFlowState => run({ type: "addImages", images: [img("a"), img("b")] });

  it("defaults to maximum fidelity", () => {
    expect(initialRenderState.fidelity).toBe("fidelitat.maxima");
  });

  it("asks what each reference is for", () => {
    let state = ready();
    expect(generateBlockedReason(state)).toContain("b.jpg");
    state = renderReducer(state, { type: "setPurpose", id: "b", purpose: "referencies.per-materials" });
    expect(generateBlockedReason(state)).toBeNull();
    state = renderReducer(state, { type: "setTake", id: "b", take: [] });
    expect(generateBlockedReason(state)).toContain("aprofitar");
  });

  it("summarizes the configuration", () => {
    const state = run(
      { type: "toggleImprovement", id: "millores.illuminacio" },
      { type: "setDetail", groupId: "illuminacio.moment", selected: ["illuminacio.16h"] },
    );
    expect(summarizeRender(state)).toEqual(["Fotorealisme general", "Il·luminació · 16:00 h"]);
  });
});

describe("restoreRenderState", () => {
  it("drops unknown ids and invalid values", () => {
    const restored = restoreRenderState({
      improvements: ["millores.vidres", "millores.inexistent", 3],
      fidelity: "vidres.mantenir",
      details: { "vidres.accio": ["vidres.mes-neutre", "x.y"], "grup.inexistent": ["a.b"] },
      notes: "x".repeat(2000),
    });
    expect(restored.improvements).toEqual(["millores.vidres"]);
    expect(restored.fidelity).toBeUndefined();
    expect(restored.details).toEqual({ "vidres.accio": ["vidres.mes-neutre"] });
    expect(restored.notes).toHaveLength(1000);
    expect(restoreRenderState(null)).toEqual({});
  });
});

describe("toPromptInput", () => {
  it("passes only the selected categories, with defaults resolved, and orders images like the attachments", () => {
    let state = run(
      { type: "addImages", images: [img("a"), img("b")] },
      { type: "setPurpose", id: "b", purpose: "referencies.per-materials" },
      { type: "toggleImprovement", id: "millores.vidres" },
      { type: "toggleImprovement", id: "millores.vegetacio" },
      { type: "addVegetationReference", image: img("v") },
      { type: "setVegetationCopy", id: "v", copy: ["vegetacio.copiar-color"] },
      { type: "setNotes", notes: "Més cel." },
    );
    state = renderReducer(state, { type: "setDetail", groupId: "materials.accions", selected: ["materials.fusta"] });
    const input = toPromptInput(state, "comercial");
    expect(input.details).toEqual({
      "vidres.accio": ["vidres.mantenir"],
      "vegetacio.accions": ["vegetacio.millorar-existent"],
      "vegetacio.estil": ["vegetacio.estil-original"],
    });
    expect(input.references).toEqual([{ purpose: "referencies.per-materials", take: ["referencies.guia-visual"] }]);
    expect(input.vegetationReferences).toEqual([{ copy: ["vegetacio.copiar-color"] }]);
    expect(input.userNotes).toBe("Més cel.");
    expect(input.projectType).toBe("comercial");
  });
});
