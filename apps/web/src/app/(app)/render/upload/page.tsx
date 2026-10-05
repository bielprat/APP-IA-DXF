import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PhasePending } from "@/components/layout/PhasePending";
import { Stepper } from "@/components/layout/Stepper";
import { RENDER_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Pujar render" };

export default function RenderUploadPage() {
  return (
    <>
      <PageHeader
        title="Colomer-Rifà Render AI"
        description="Puja el render, selecciona què vols millorar i genera una versió fotorealista mantenint la fidelitat al projecte."
      >
        <Stepper steps={RENDER_STEPS} current={0} />
      </PageHeader>
      <PhasePending phase={1} />
    </>
  );
}
