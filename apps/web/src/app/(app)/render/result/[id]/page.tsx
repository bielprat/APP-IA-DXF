import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { ResultStep } from "@/features/render/steps/ResultStep";
import { RENDER_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Resultat" };

// Until generation exists (phase 3) the only result is the draft of the current flow.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "draft") notFound();
  return (
    <>
      <FlowHeader title="Resultat" description="Llisca per comparar l'original amb la versió millorada." steps={RENDER_STEPS} />
      <ResultStep />
    </>
  );
}
