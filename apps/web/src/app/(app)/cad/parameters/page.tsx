import type { Metadata } from "next";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { ParametersStep } from "@/features/cad/steps/ParametersStep";
import { CAD_STEPS } from "@/lib/navigation";

export const metadata: Metadata = { title: "Paràmetres" };

export default function Page() {
  return (
    <>
      <FlowHeader title="Com ha de dibuixar-ho la IA?" description="Tria colors, alçades, gruixos i detalls. El que no surti dels plànols es marcarà com a estimat." steps={CAD_STEPS} />
      <ParametersStep />
    </>
  );
}
