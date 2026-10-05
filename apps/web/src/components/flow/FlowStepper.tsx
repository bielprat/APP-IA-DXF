"use client";

import { usePathname } from "next/navigation";
import { Stepper } from "@/components/layout/Stepper";
import { currentStepIndex, type Step } from "@/lib/navigation";

export function FlowStepper({ steps }: { steps: readonly Step[] }) {
  return <Stepper steps={steps} current={currentStepIndex(steps, usePathname())} />;
}
