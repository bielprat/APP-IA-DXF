import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { DraftResult, RenderResultView } from "@/features/render/steps/ResultStep";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { RENDER_STEPS } from "@/lib/navigation";
import { getRenderProjectView } from "@/server/render/projectView";

export const metadata: Metadata = { title: "Resultat" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const header = <FlowHeader title="Resultat" description="Llisca per comparar l'original amb la versió millorada." steps={RENDER_STEPS} />;
  if (id === "draft") {
    return (
      <>
        {header}
        <DraftResult />
      </>
    );
  }

  const user = await requireUser();
  const project = await getDb().project.findUnique({ where: { id }, select: { ownerId: true, type: true } });
  if (!project || project.ownerId !== user.id || project.type !== "render") notFound();
  const view = await getRenderProjectView(id);

  return (
    <>
      {header}
      <RenderResultView initial={view} />
    </>
  );
}
