import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { UploadStep } from "@/features/cad/steps/UploadStep";
import { CAD_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Pujar fonts" };

export default function Page() {
  return (
    <>
      <FlowHeader title="Modelatge 3D per a CAD" description="Puja plànols o imatges i prepararem un DXF 3D editable per a Allplan i AutoCAD." steps={CAD_STEPS} />
      <UploadStep />
    </>
  );
}
