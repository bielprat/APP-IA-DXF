import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { ImproveStep } from "@/features/render/steps/ImproveStep";
import { RENDER_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Què vols millorar?" };

export default function Page() {
  return (
    <>
      <FlowHeader title="Què vols millorar?" description="Selecciona una o diverses opcions. Pots canviar-ho després." steps={RENDER_STEPS} />
      <ImproveStep />
    </>
  );
}
