import "server-only";
import { getDb } from "@/lib/db";
import type { ProviderInfo, Usage } from "./types";

type CallMeta = { jobId: string; userId: string; purpose: string; info: ProviderInfo };

/**
 * Runs an AI call and records provider, model, duration, usage and status (§3.1).
 * Prompt text is never logged here; it goes to the admin-only AuditPrompt table.
 */
export async function trackAiCall<T extends { usage?: Usage }>(meta: CallMeta, call: () => Promise<T>): Promise<T> {
  const started = Date.now();
  let status = "ok";
  let error: string | undefined;
  let usage: Usage | undefined;
  try {
    const result = await call();
    usage = result.usage;
    return result;
  } catch (caught) {
    status = "error";
    error = caught instanceof Error ? caught.message.slice(0, 500) : "Unknown error";
    throw caught;
  } finally {
    const durationMs = Date.now() - started;
    await getDb().aiCallLog.create({
      data: {
        jobId: meta.jobId,
        userId: meta.userId,
        purpose: meta.purpose,
        provider: meta.info.provider,
        model: meta.info.model,
        status,
        error,
        durationMs,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        estimatedCostEur: usage?.estimatedCostEur,
      },
    });
    console.info(JSON.stringify({ event: "ai_call", purpose: meta.purpose, provider: meta.info.provider, model: meta.info.model, status, durationMs }));
  }
}
