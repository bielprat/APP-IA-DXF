import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { ElementsStep } from "@/features/cad/steps/ElementsStep";
import { CAD_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Què modelar" };

export default function Page() {
  return (
    <>
      <FlowHeader title="Què vols modelar?" description="Selecciona els elements. Cada sistema constructiu anirà a la seva pròpia capa." steps={CAD_STEPS} />
      <ElementsStep />
    </>
  );
}
