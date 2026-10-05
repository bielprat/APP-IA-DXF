import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { GenerateStep } from "@/features/render/steps/GenerateStep";
import { RENDER_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Fidelitat i generar" };

export default function Page() {
  return (
    <>
      <FlowHeader title="Fidelitat i referències" description="Última comprovació abans de generar. El text és opcional." steps={RENDER_STEPS} />
      <GenerateStep />
    </>
  );
}
