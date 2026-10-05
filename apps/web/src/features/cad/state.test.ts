import { describe, expect, it } from "vitest";
import {
  MODE_PRECISE,
  MODE_REVIEW,
  cadReducer,
  deliveryFileName,
  dimensionRows,
  effectiveElements,
  generateBlockedReason,
  guessSourceType,
  hasTechnicalSources,
  initialCadState,
  invalidParamTabs,
  layersFor,
  paramSelection,
  restoreCadState,
  uploadBlockedReason,
  type CadAction,
} from "./state";

const run = (...actions: CadAction[]) => actions.reduce(cadReducer, initialCadState);
const file = (id: string, name: string) => ({ id, name, size: 10 });

describe("sources", () => {
  it("pre-fills the file type from the extension", () => {
    expect(guessSourceType("façana.JPG")).toBe("cad-fonts.imatge");
    expect(guessSourceType("planta.pdf")).toBe("cad-fonts.planol-2d");
    expect(guessSourceType("x.txt")).toBeNull();
  });

  it("detects whether there are plans or dimensions", () => {
    const images = run({ type: "addFiles", files: [file("a", "foto.jpg")] });
    expect(hasTechnicalSources(images)).toBe(false);
    const plans = cadReducer(images, { type: "setSourceType", id: "a", sourceType: "cad-fonts.alcat" });
    expect(hasTechnicalSources(plans)).toBe(true);
  });

  it("requires at least one typed file", () => {
    expect(uploadBlockedReason(initialCadState)).not.toBeNull();
    expect(uploadBlockedReason(run({ type: "addFiles", files: [file("a", "planta.dxf")] }))).toBeNull();
  });
});

describe("parameters", () => {
  it("does not estimate by default when modelling from plans", () => {
    expect(paramSelection(initialCadState, "cad-parametres.alcada-planta")).toEqual(["cad-parametres.alcada-estimar"]);
    const precise = run({ type: "setMode", mode: MODE_PRECISE });
    expect(paramSelection(precise, "cad-parametres.alcada-planta")).toEqual(["cad-parametres.alcada-plans"]);
    expect(paramSelection(precise, "cad-parametres.gruix-murs")).toEqual(["cad-parametres.murs-plans"]);
  });

  it("asks which exterior details to model when that element is selected", () => {
    const state = run({ type: "toggleElement", id: "cad-elements.detalls" });
    expect(effectiveElements(state)).toContain("cad-elements.detalls");
    expect(invalidParamTabs(state)).toEqual(["detalls"]);
    const fixed = cadReducer(state, { type: "setParam", groupId: "cad-parametres.detalls", selected: ["cad-parametres.baranes"] });
    expect(invalidParamTabs(fixed)).toEqual([]);
  });

  it("skips parameters in review mode", () => {
    const state = run(
      { type: "setMode", mode: MODE_REVIEW },
      { type: "addFiles", files: [file("a", "planta.pdf")] },
      { type: "toggleElement", id: "cad-elements.detalls" },
    );
    expect(generateBlockedReason(state)).toBeNull();
  });
});

describe("result helpers", () => {
  it("lists only the layers of the selected systems with the chosen colors", () => {
    const state = run({ type: "setParam", groupId: "cad-parametres.color-parets", selected: ["cad-parametres.parets-taronja"] });
    const layers = layersFor(state);
    expect(layers.map((layer) => layer.name)).toEqual(["CR_PARETS", "CR_FORJATS", "CR_COBERTA", "CR_OBERTURES"]);
    expect(layers[0].displayColor).toBe("#ED7902");
    const gray = cadReducer(state, { type: "setParam", groupId: "cad-parametres.esquema", selected: ["cad-parametres.esquema-grisos"] });
    expect(layersFor(gray).find((layer) => layer.name === "CR_COBERTA")?.displayColor).toBe("#5A5D5C");
  });

  it("adds topography layers when the environment is modelled", () => {
    const state = run({ type: "setParam", groupId: "cad-parametres.entorn", selected: ["cad-parametres.entorn-topografia"] });
    expect(layersFor(state).map((layer) => layer.name)).toContain("CR_TOPOGRAFIA");
  });

  it("labels where each dimension comes from", () => {
    const state = run({ type: "setParam", groupId: "cad-parametres.alcada-planta", selected: ["cad-parametres.alcada-350"] });
    expect(dimensionRows(state)[0]).toEqual({ element: "Alçada de planta", value: "3,50 m", origin: "Triat per l'usuari" });
    expect(dimensionRows(state)[2].origin).toBe("Estimat");
    expect(dimensionRows(run({ type: "setMode", mode: MODE_PRECISE }))[0].origin).toBe("Cota del plànol");
  });

  it("derives a safe delivery file name", () => {
    expect(deliveryFileName(run({ type: "addFiles", files: [file("a", "Planta Baixa – Façana.pdf")] }))).toBe("planta-baixa-facana-3d.dxf");
    expect(deliveryFileName(initialCadState)).toBe("model-3d.dxf");
  });
});

describe("restoreCadState", () => {
  it("keeps only known ids", () => {
    const restored = restoreCadState({ mode: "cad-modes.precis", elements: ["cad-elements.coberta", "nope"], params: { "cad-parametres.parapet": ["cad-parametres.parapet-100", "x"] } });
    expect(restored.mode).toBe("cad-modes.precis");
    expect(restored.elements).toEqual(["cad-elements.coberta"]);
    expect(restored.params).toEqual({ "cad-parametres.parapet": ["cad-parametres.parapet-100"] });
  });
});
