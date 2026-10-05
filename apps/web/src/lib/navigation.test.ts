import { describe, expect, it } from "vitest";
import { CAD_STEPS, MAIN_NAV, RENDER_STEPS, currentStepIndex, isNavItemActive, visibleNavItems } from "./navigation";

const byLabel = (label: string) => MAIN_NAV.find((item) => item.label === label)!;

describe("visibleNavItems", () => {
  it("hides the vegetation library from regular users", () => {
    expect(visibleNavItems("user").map((item) => item.label)).not.toContain("Biblioteca de vegetació");
    expect(visibleNavItems("admin").map((item) => item.label)).toContain("Biblioteca de vegetació");
  });
});

describe("isNavItemActive", () => {
  it("matches Inici only on the root", () => {
    expect(isNavItemActive(byLabel("Inici"), "/")).toBe(true);
    expect(isNavItemActive(byLabel("Inici"), "/render/upload")).toBe(false);
  });

  it("matches a whole flow by prefix without false positives", () => {
    const render = byLabel("Millora de renders");
    expect(isNavItemActive(render, "/render/details")).toBe(true);
    expect(isNavItemActive(render, "/render")).toBe(true);
    expect(isNavItemActive(render, "/renderer")).toBe(false);
  });
});

describe("currentStepIndex", () => {
  it("finds static and dynamic steps", () => {
    expect(currentStepIndex(RENDER_STEPS, "/render/details")).toBe(2);
    expect(currentStepIndex(RENDER_STEPS, "/render/result/abc123")).toBe(4);
    expect(currentStepIndex(CAD_STEPS, "/cad/result/draft")).toBe(4);
    expect(currentStepIndex(CAD_STEPS, "/cad/upload")).toBe(0);
  });
});
