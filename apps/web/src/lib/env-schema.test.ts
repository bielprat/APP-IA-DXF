import { describe, expect, it } from "vitest";
import { envSchema, isEntraConfigured } from "./env-schema";

const base = { DATABASE_URL: "postgresql://x", ALLOWED_EMAIL_DOMAINS: "colomer-rifa.cat" };

describe("envSchema", () => {
  it("treats empty values from .env as unset", () => {
    const env = envSchema.parse({
      ...base,
      AUTH_MICROSOFT_ENTRA_ID_ID: "",
      AUTH_MICROSOFT_ENTRA_ID_SECRET: " ",
      AUTH_MICROSOFT_ENTRA_ID_ISSUER: "",
    });
    expect(env.AUTH_MICROSOFT_ENTRA_ID_ISSUER).toBeUndefined();
    expect(isEntraConfigured(env)).toBe(false);
  });

  it("parses domain and admin lists", () => {
    const env = envSchema.parse({ ...base, ALLOWED_EMAIL_DOMAINS: " Colomer-Rifa.cat , ", ADMIN_EMAILS: "A@colomer-rifa.cat" });
    expect(env.ALLOWED_EMAIL_DOMAINS).toEqual(["colomer-rifa.cat"]);
    expect(env.ADMIN_EMAILS).toEqual(["a@colomer-rifa.cat"]);
  });

  it("detects a complete Entra configuration", () => {
    const env = envSchema.parse({
      ...base,
      AUTH_MICROSOFT_ENTRA_ID_ID: "id",
      AUTH_MICROSOFT_ENTRA_ID_SECRET: "secret",
      AUTH_MICROSOFT_ENTRA_ID_ISSUER: "https://login.microsoftonline.com/tenant/v2.0",
    });
    expect(isEntraConfigured(env)).toBe(true);
  });

  it("requires at least one allowed domain", () => {
    expect(() => envSchema.parse({ ...base, ALLOWED_EMAIL_DOMAINS: "" })).toThrow();
  });

  it("defaults to production and refuses dev login outside local", () => {
    expect(envSchema.parse(base).APP_ENV).toBe("production");
    expect(() => envSchema.parse({ ...base, AUTH_DEV_LOGIN: "true" })).toThrow(/APP_ENV=local/);
    expect(() => envSchema.parse({ ...base, AUTH_DEV_LOGIN: "true", APP_ENV: "staging" })).toThrow();
    expect(envSchema.parse({ ...base, AUTH_DEV_LOGIN: "true", APP_ENV: "local" }).AUTH_DEV_LOGIN).toBe(true);
  });
});
