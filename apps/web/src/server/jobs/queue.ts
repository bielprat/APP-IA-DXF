import "server-only";
import { PgBoss } from "pg-boss";
import { getEnv } from "@/lib/env";

export const RENDER_QUEUE = "render-job";

const globalForBoss = globalThis as unknown as { boss?: Promise<PgBoss> };

/** One pg-boss instance per server process (jobs live in the same PostgreSQL, schema "pgboss"). */
export function getBoss(): Promise<PgBoss> {
  globalForBoss.boss ??= (async () => {
    const boss = new PgBoss({ connectionString: getEnv().DATABASE_URL });
    boss.on("error", (error) => console.error(JSON.stringify({ event: "queue_error", message: error.message })));
    await boss.start();
    await boss.createQueue(RENDER_QUEUE);
    return boss;
  })();
  return globalForBoss.boss;
}

/**
 * Queues a render job. The singleton key makes enqueueing idempotent per job and attempt; the
 * pipeline itself skips jobs that are already finished.
 */
export async function enqueueRenderJob(jobId: string, attempt = 0): Promise<void> {
  const boss = await getBoss();
  await boss.send(RENDER_QUEUE, { jobId }, { singletonKey: `${jobId}:${attempt}`, retryLimit: 0, expireInSeconds: 15 * 60 });
}
