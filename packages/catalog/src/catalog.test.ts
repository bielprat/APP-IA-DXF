import { describe, expect, it } from "vitest";
import { allCategories, allGroups, cadCatalog, detailsFor, getGroup, pendingReviewOptions, renderCatalog } from "./index";
import { isGroupValid, groupDefault } from "./selection";

describe("catalog integrity", () => {
  const groups = allGroups();
  const options = groups.flatMap((group) => group.options);

  it("has globally unique option and group ids", () => {
    expect(new Set(options.map((option) => option.id)).size).toBe(options.length);
    expect(new Set(groups.map((group) => group.id)).size).toBe(groups.length);
  });

  it("prefixes every id with its category", () => {
    for (const item of allCategories()) {
      for (const group of item.groups) {
        expect(group.id.startsWith(`${item.category}.`)).toBe(true);
        for (const option of group.options) expect(option.id.startsWith(`${item.category}.`)).toBe(true);
      }
    }
  });

  it("only references existing options", () => {
    const ids = new Set(options.map((option) => option.id));
    for (const option of options) {
      for (const ref of [...option.exclusiveWith, ...option.requires, ...option.unlocks]) expect(ids.has(ref)).toBe(true);
    }
    for (const group of groups) {
      const local = new Set(group.options.map((option) => option.id));
      for (const id of group.default) expect(local.has(id), `${group.id} default ${id}`).toBe(true);
      for (const value of Object.values(group.defaultByMode ?? {})) for (const id of value) expect(local.has(id)).toBe(true);
      for (const id of group.defaultIfElement?.default ?? []) expect(local.has(id)).toBe(true);
    }
  });

  it("has valid defaults (empty defaults only where the user must choose)", () => {
    for (const group of groups) {
      if (group.default.length > 0) expect(isGroupValid(group.default, group), group.id).toBe(true);
    }
  });

  it("matches the counts required by the specification", () => {
    expect(renderCatalog.improvements.groups[0].options).toHaveLength(8);
    expect(renderCatalog.corrections.groups[0].options).toHaveLength(12);
    expect(renderCatalog.fidelity.groups[0].options).toHaveLength(3);
    expect(cadCatalog.elements.groups[0].options).toHaveLength(8);
    expect(cadCatalog.parameters.tabs).toHaveLength(7);
    expect(cadCatalog.corrections.groups[0].options).toHaveLength(12);
    expect(cadCatalog.layers.map((layer) => layer.name)).toEqual([
      "CR_ESTRUCTURA", "CR_PARETS", "CR_FORJATS", "CR_COBERTA", "CR_OBERTURES", "CR_TOPOGRAFIA", "CR_URBANITZACIO", "CR_LOGOS",
    ]);
  });

  it("defaults to photorealism and maximum fidelity", () => {
    expect(renderCatalog.improvements.groups[0].default).toEqual(["millores.fotorealisme"]);
    expect(renderCatalog.fidelity.groups[0].default).toEqual(["fidelitat.maxima"]);
    expect(cadCatalog.format.groups.map((group) => group.default[0])).toEqual(["cad-format.dxf", "cad-format.solids", "cad-format.m", "cad-format.reals"]);
  });

  it("maps improvements with a details tab to their category", () => {
    expect(detailsFor("millores.vegetacio")?.category).toBe("vegetacio");
    expect(detailsFor("millores.fotorealisme")).toBeUndefined();
  });

  it("never offers urban geometry changes in Entorn", () => {
    const labels = getGroup("entorn.accions").options.map((option) => option.label.toLowerCase());
    for (const forbidden of ["parcel", "nou edifici", "vialitat nova", "afegir"]) {
      expect(labels.some((label) => label.includes(forbidden))).toBe(false);
    }
  });

  it("lists the provisional contents", () => {
    expect(pendingReviewOptions().map((option) => option.id)).toEqual(
      expect.arrayContaining(["biblioteca.clima-mediterrani", "projectes.aprovat"]),
    );
  });
});

describe("mode-dependent CAD defaults", () => {
  const height = getGroup("cad-parametres.alcada-planta");

  it("estimates only in the approximate mode", () => {
    expect(groupDefault(height, { mode: "cad-modes.aproximat" })).toEqual(["cad-parametres.alcada-estimar"]);
    expect(groupDefault(height, { mode: "cad-modes.precis" })).toEqual(["cad-parametres.alcada-plans"]);
  });

  it("asks for exterior details when that element is modelled", () => {
    const details = getGroup("cad-parametres.detalls");
    expect(groupDefault(details, { elements: [] })).toEqual(["cad-parametres.detalls-cap"]);
    expect(groupDefault(details, { elements: ["cad-elements.detalls"] })).toEqual([]);
    expect(isGroupValid([], details)).toBe(false);
  });
});
