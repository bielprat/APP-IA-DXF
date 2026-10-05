import Link from "next/link";
import type { Step } from "@/lib/navigation";

/** Rounded step chips shown at the top of each flow. The active step is orange. */
export function Stepper({ steps, current }: { steps: readonly Step[]; current: number }) {
  return (
    <nav aria-label="Passos">
      <ol className="flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const active = index === current;
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                aria-current={active ? "step" : undefined}
                className={`inline-flex min-h-11 items-center gap-2.5 rounded-full border py-0 pr-4 pl-2 text-sm text-brand-black ${
                  active ? "border-brand-orange bg-brand-orange font-semibold" : "border-border-chip bg-surface hover:bg-bg-page"
                }`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-[13px] font-semibold ${
                    active ? "bg-brand-black text-white" : "bg-tint-gray text-brand-black"
                  }`}
                >
                  {index + 1}
                </span>
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
