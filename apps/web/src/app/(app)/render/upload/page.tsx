import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { UploadStep } from "@/features/render/steps/UploadStep";
import { RENDER_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Pujar render" };

export default function Page() {
  return (
    <>
      <FlowHeader title="Colomer-Rifà Render AI" description="Puja el render, selecciona què vols millorar i genera una versió fotorealista mantenint la fidelitat al projecte." steps={RENDER_STEPS} />
      <UploadStep />
    </>
  );
}
