import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectsView } from "@/features/projects/ProjectsView";

export const metadata: Metadata = { title: "Projectes" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projectes" description="Projectes i versions de renders i models." />
      <ProjectsView />
    </>
  );
}
