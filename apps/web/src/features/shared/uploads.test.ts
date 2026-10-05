import { describe, expect, it } from "vitest";
import { checkUploads, extensionOf } from "./uploads";

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);
const rules = { extensions: [".png", ".jpg"], maxBytes: 100, maxCount: 2 };

describe("checkUploads", () => {
  it("accepts allowed files and explains rejections in Catalan", () => {
    const result = checkUploads([file("a.PNG"), file("b.gif"), file("c.jpg", 500), file("d.jpg", 0)], 0, rules);
    expect(result.accepted.map((item) => item.name)).toEqual(["a.PNG"]);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toContain("no és un format acceptat");
  });

  it("enforces the maximum count", () => {
    const result = checkUploads([file("a.png"), file("b.png")], 1, rules);
    expect(result.accepted).toHaveLength(1);
    expect(result.errors[0]).toContain("màxim");
  });

  it("extracts extensions", () => {
    expect(extensionOf("Planta.Baixa.PDF")).toBe(".pdf");
    expect(extensionOf("sense-extensio")).toBe("");
  });
});
