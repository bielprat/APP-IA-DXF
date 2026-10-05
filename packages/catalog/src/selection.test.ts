import { describe, expect, it } from "vitest";
import { getGroup } from "./index";
import { isGroupValid, resolveGroup, toggleOption } from "./selection";

describe("toggleOption", () => {
  const vegetation = getGroup("vegetacio.accions");
  const glass = getGroup("vidres.accio");

  it("replaces the choice in single groups", () => {
    expect(toggleOption(["vidres.mantenir"], glass, "vidres.mes-foscos")).toEqual(["vidres.mes-foscos"]);
    expect(toggleOption(["vidres.mes-foscos"], glass, "vidres.mes-foscos")).toEqual(["vidres.mes-foscos"]);
  });

  it("toggles in multi groups", () => {
    const one = toggleOption(["vegetacio.millorar-existent"], vegetation, "vegetacio.arbres");
    expect(one).toEqual(["vegetacio.millorar-existent", "vegetacio.arbres"]);
    expect(toggleOption(one, vegetation, "vegetacio.arbres")).toEqual(["vegetacio.millorar-existent"]);
  });

  it("makes «Mantenir original» exclusive in both directions", () => {
    expect(toggleOption(["vegetacio.arbres", "vegetacio.gespa"], vegetation, "vegetacio.mantenir")).toEqual(["vegetacio.mantenir"]);
    expect(toggleOption(["vegetacio.mantenir"], vegetation, "vegetacio.gespa")).toEqual(["vegetacio.gespa"]);
  });

  it("makes «Cap» exclusive in CAD details", () => {
    const details = getGroup("cad-parametres.detalls");
    expect(toggleOption(["cad-parametres.marquesines"], details, "cad-parametres.detalls-cap")).toEqual(["cad-parametres.detalls-cap"]);
    expect(toggleOption(["cad-parametres.detalls-cap"], details, "cad-parametres.baranes")).toEqual(["cad-parametres.baranes"]);
  });

  it("rejects unknown options", () => {
    expect(() => toggleOption([], glass, "vegetacio.arbres")).toThrow();
  });
});

describe("isGroupValid", () => {
  const vegetation = getGroup("vegetacio.accions");

  it("enforces minimums and exclusivity", () => {
    expect(isGroupValid([], vegetation)).toBe(false);
    expect(isGroupValid(["vegetacio.mantenir"], vegetation)).toBe(true);
    expect(isGroupValid(["vegetacio.mantenir", "vegetacio.arbres"], vegetation)).toBe(false);
    expect(isGroupValid(["vegetacio.arbres", "vegetacio.arbres"], vegetation)).toBe(false);
    expect(isGroupValid(["vidres.mantenir"], vegetation)).toBe(false);
  });
});

describe("resolveGroup", () => {
  it("prefers the user's choice over the default", () => {
    const glass = getGroup("vidres.accio");
    expect(resolveGroup({}, glass)).toEqual(["vidres.mantenir"]);
    expect(resolveGroup({ "vidres.accio": ["vidres.mes-neutre"] }, glass)).toEqual(["vidres.mes-neutre"]);
  });
});
