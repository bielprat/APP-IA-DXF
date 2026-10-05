import { z } from "zod";

// `KEY=` in a .env file yields an empty string; treat it as "not set".
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), schema.optional());

const csv = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

export const envSchema = z
  .object({
    APP_ENV: z.enum(["local", "staging", "production"]).default("production"),
    DATABASE_URL: z.string().min(1),
    ALLOWED_EMAIL_DOMAINS: csv,
    ADMIN_EMAILS: csv,
    AUTH_DEV_LOGIN: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    AUTH_MICROSOFT_ENTRA_ID_ID: optional(z.string()),
    AUTH_MICROSOFT_ENTRA_ID_SECRET: optional(z.string()),
    AUTH_MICROSOFT_ENTRA_ID_ISSUER: optional(z.url()),
  })
  .superRefine((env, ctx) => {
    if (env.ALLOWED_EMAIL_DOMAINS.length === 0) {
      ctx.addIssue({ code: "custom", path: ["ALLOWED_EMAIL_DOMAINS"], message: "At least one domain is required" });
    }
    if (env.AUTH_DEV_LOGIN && env.APP_ENV !== "local") {
      ctx.addIssue({ code: "custom", path: ["AUTH_DEV_LOGIN"], message: "Dev login is only allowed when APP_ENV=local" });
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

export function isEntraConfigured(env: ServerEnv): boolean {
  return Boolean(env.AUTH_MICROSOFT_ENTRA_ID_ID && env.AUTH_MICROSOFT_ENTRA_ID_SECRET && env.AUTH_MICROSOFT_ENTRA_ID_ISSUER);
}
