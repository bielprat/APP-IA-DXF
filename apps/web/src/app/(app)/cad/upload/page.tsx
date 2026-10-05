import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PhasePending } from "@/components/layout/PhasePending";
import { Stepper } from "@/components/layout/Stepper";
import { CAD_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Pujar fonts" };

export default function CadUploadPage() {
  return (
    <>
      <PageHeader
        title="Modelatge 3D per a CAD"
        description="Puja plànols, topografia, croquis o imatges i genera un DXF 3D editable organitzat per capes i colors."
      >
        <Stepper steps={CAD_STEPS} current={0} />
      </PageHeader>
      <PhasePending phase={1} />
    </>
  );
}
