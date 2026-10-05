import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { GenerateStep } from "@/features/cad/steps/GenerateStep";
import { CAD_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Format i generar" };

export default function Page() {
  return (
    <>
      <FlowHeader title="Format i generar" description="Última comprovació abans de crear el fitxer. El text és opcional." steps={CAD_STEPS} />
      <GenerateStep />
    </>
  );
}
