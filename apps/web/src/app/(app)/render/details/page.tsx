import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { DetailsStep } from "@/features/render/steps/DetailsStep";
import { RENDER_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Detalls" };

export default function Page() {
  return (
    <>
      <FlowHeader title="Detalla les millores" description="Només apareixen les categories que has seleccionat. Tria entre miniatures; no cal escriure res." steps={RENDER_STEPS} />
      <DetailsStep />
    </>
  );
}
