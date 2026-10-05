import { describe, expect, it } from "vitest";
import { loginErrorMessage } from "./messages";

describe("loginErrorMessage", () => {
  it("returns nothing without an error", () => {
    expect(loginErrorMessage(undefined, ["colomer-rifa.cat"])).toBeNull();
  });

  it("names the allowed domain when access is denied", () => {
    expect(loginErrorMessage("AccessDenied", ["colomer-rifa.cat"])).toContain("@colomer-rifa.cat");
    expect(loginErrorMessage("CredentialsSignin", ["colomer-rifa.cat"])).toContain("@colomer-rifa.cat");
  });

  it("falls back to a generic message", () => {
    expect(loginErrorMessage("Whatever", [])).toBe("No s'ha pogut iniciar la sessió. Torna-ho a provar.");
  });
});
