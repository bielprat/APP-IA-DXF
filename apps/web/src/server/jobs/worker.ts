import "server-only";
import { runRenderJob } from "@/server/render/pipeline";
import { RENDER_QUEUE, getBoss } from "./queue";

const globalForWorker = globalThis as unknown as { renderWorker?: Promise<string> };

/** Starts the render worker in this process (once, also across dev hot reloads). */
export function startRenderWorker(): Promise<string> {
  globalForWorker.renderWorker ??= getBoss().then((boss) =>
    boss.work<{ jobId: string }>(RENDER_QUEUE, { batchSize: 1, pollingIntervalSeconds: 1 }, async ([job]) => {
      await runRenderJob(job.data.jobId);
    }),
  );
  return globalForWorker.renderWorker;
}
