import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { ResultStep } from "@/features/cad/steps/ResultStep";
import { CAD_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Model generat" };

// Until the CAD service is connected (phase 5) the only result is the draft of the current flow.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "draft") notFound();
  return (
    <>
      <FlowHeader title="Model generat" description="Revisa les capes i descarrega el fitxer. Pots amagar capes per comprovar-les." steps={CAD_STEPS} />
      <ResultStep />
    </>
  );
}
