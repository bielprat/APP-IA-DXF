import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectsView } from "@/features/projects/ProjectsView";
import { requireUser } from "@/lib/auth/session";
import { listProjects } from "@/server/projects";

export const metadata: Metadata = { title: "Projectes" };

export default async function ProjectsPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Projectes" description="Projectes i versions de renders i models." />
      <ProjectsView rows={await listProjects(user.id)} />
    </>
  );
}
