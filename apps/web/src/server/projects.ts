import "server-only";
import { getDb } from "@/lib/db";

export type ProjectRow = {
  id: string;
  name: string;
  type: "render" | "cad";
  status: "in_progress" | "approved" | "delivered";
  latestVersion: number | null;
  updatedAt: string;
  href: string;
};

/** Projects of one user, most recent first (§8: users only see their own projects). */
export async function listProjects(ownerId: string, take?: number): Promise<ProjectRow[]> {
  const projects = await getDb().project.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    take,
    include: { renderVersions: { orderBy: { number: "desc" }, take: 1, select: { number: true } } },
  });
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    type: project.type,
    status: project.status,
    latestVersion: project.renderVersions[0]?.number ?? null,
    updatedAt: project.updatedAt.toISOString(),
    href: project.type === "render" ? `/render/result/${project.id}` : `/cad/result/${project.id}`,
  }));
}
