/** Shape returned by GET /api/render/projects/[id] (shared by server and client). */

export type QcCheckView = { id: string; label: string; status: "ok" | "deviation" | "unsure"; detail?: string };

export type VersionView = {
  id: string;
  number: number;
  kind: "generate" | "correction" | "restore";
  url: string;
  approved: boolean;
  createdAt: string;
  parentNumber: number | null;
  provider: string | null;
  mock: boolean;
  qc: { status: "ok" | "warning" | "unverified"; checks: QcCheckView[] } | null;
  summary: string[];
};

export type JobView = {
  id: string;
  kind: "generate" | "correction" | "restore";
  status: "queued" | "processing" | "qc" | "ready" | "failed" | "cancelled";
  error: string | null;
  createdAt: string;
};

export type RenderProjectView = {
  id: string;
  name: string;
  status: "in_progress" | "approved" | "delivered";
  original: { url: string; width: number | null; height: number | null } | null;
  versions: VersionView[];
  latestJob: JobView | null;
};

export const ACTIVE_JOB_STATUSES: readonly JobView["status"][] = ["queued", "processing", "qc"];

export const JOB_STATUS_LABELS: Record<JobView["status"], string> = {
  queued: "A la cua",
  processing: "Processant",
  qc: "Control de qualitat",
  ready: "Llest",
  failed: "No s'ha pogut generar",
  cancelled: "Cancel·lat",
};
