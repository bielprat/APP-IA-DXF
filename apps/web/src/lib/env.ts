import "server-only";
import { envSchema, isEntraConfigured as isEntraConfiguredFor, type ServerEnv } from "./env-schema";

export type { ServerEnv };

let cached: ServerEnv | undefined;

/** Validated server environment. Lazy so that `next build` does not need runtime secrets. */
export function getEnv(): ServerEnv {
  cached ??= envSchema.parse(process.env);
  return cached;
}

export function isEntraConfigured(env: ServerEnv = getEnv()): boolean {
  return isEntraConfiguredFor(env);
}
