/**
 * Starts the background render worker inside the Node.js server process.
 * Set RENDER_WORKER=off to run web instances without a worker (e.g. a separate worker deployment).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.RENDER_WORKER === "off") return;
  const { startRenderWorker } = await import("./server/jobs/worker");
  startRenderWorker().catch((error: unknown) => {
    console.error(JSON.stringify({ event: "worker_start_failed", message: error instanceof Error ? error.message : String(error) }));
  });
}
