import { PageHeader } from "@/components/layout/PageHeader";
import type { Step } from "@/lib/navigation";
import { FlowStepper } from "./FlowStepper";

export function FlowHeader({ title, description, steps }: { title: string; description: string; steps: readonly Step[] }) {
  return (
    <PageHeader title={title} description={description}>
      <FlowStepper steps={steps} />
    </PageHeader>
  );
}
