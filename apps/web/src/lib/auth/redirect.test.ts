import { describe, expect, it } from "vitest";
import { safeCallbackPath } from "./redirect";

describe("safeCallbackPath", () => {
  it("keeps internal paths", () => {
    expect(safeCallbackPath("/render/upload")).toBe("/render/upload");
    expect(safeCallbackPath(["/projects?type=cad"])).toBe("/projects?type=cad");
  });

  it("rejects external, protocol-relative and auth paths", () => {
    expect(safeCallbackPath("https://evil.com")).toBe("/");
    expect(safeCallbackPath("//evil.com")).toBe("/");
    expect(safeCallbackPath("/\\evil.com")).toBe("/");
    expect(safeCallbackPath("/login")).toBe("/");
    expect(safeCallbackPath(undefined)).toBe("/");
  });
});
