import { describe, expect, it } from "vitest";
import { emailFromEntraProfile, isEmailAllowed, normalizeEmail, resolveRole } from "./access";

const domains = ["colomer-rifa.cat"];

describe("isEmailAllowed", () => {
  it("accepts the company domain, case-insensitively", () => {
    expect(isEmailAllowed("anna@colomer-rifa.cat", domains)).toBe(true);
    expect(isEmailAllowed("  Anna@Colomer-Rifa.CAT ", domains)).toBe(true);
  });

  it("rejects other domains, look-alikes and subdomains", () => {
    expect(isEmailAllowed("anna@gmail.com", domains)).toBe(false);
    expect(isEmailAllowed("anna@evil-colomer-rifa.cat", domains)).toBe(false);
    expect(isEmailAllowed("anna@mail.colomer-rifa.cat", domains)).toBe(false);
    expect(isEmailAllowed("anna@colomer-rifa.cat.evil.com", domains)).toBe(false);
  });

  it("rejects empty or malformed values", () => {
    expect(isEmailAllowed(undefined, domains)).toBe(false);
    expect(isEmailAllowed("", domains)).toBe(false);
    expect(isEmailAllowed("colomer-rifa.cat", domains)).toBe(false);
    expect(isEmailAllowed("a@colomer-rifa.cat", [])).toBe(false);
  });
});

describe("resolveRole", () => {
  it("promotes bootstrap admins", () => {
    expect(resolveRole("cap@colomer-rifa.cat", ["cap@colomer-rifa.cat"], "user")).toBe("admin");
  });

  it("keeps the stored role otherwise and defaults to user", () => {
    expect(resolveRole("anna@colomer-rifa.cat", [], "admin")).toBe("admin");
    expect(resolveRole("anna@colomer-rifa.cat", [], null)).toBe("user");
  });
});

describe("emailFromEntraProfile", () => {
  it("prefers email and falls back to preferred_username", () => {
    expect(emailFromEntraProfile({ email: "A@colomer-rifa.cat", preferred_username: "b@x.com" })).toBe("a@colomer-rifa.cat");
    expect(emailFromEntraProfile({ preferred_username: "B@colomer-rifa.cat" })).toBe("b@colomer-rifa.cat");
    expect(emailFromEntraProfile({ preferred_username: "not-an-email" })).toBeNull();
    expect(emailFromEntraProfile(null)).toBeNull();
  });

  it("normalizes", () => {
    expect(normalizeEmail(" X@Y.CAT ")).toBe("x@y.cat");
  });
});
