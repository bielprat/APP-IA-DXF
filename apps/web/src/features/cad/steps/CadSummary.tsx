"use client";

import { useCadFlow } from "../CadFlowProvider";
import { summarizeCad } from "../state";

export function CadSummary({ title = "El teu model" }: { title?: string }) {
  const { state } = useCadFlow();
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <dl className="flex flex-col gap-2 text-[15px]">
        {summarizeCad(state).map((line) => (
          <div key={line.label} className="flex flex-col">
            <dt className="text-sm text-text-muted">{line.label}</dt>
            <dd className="font-medium">{line.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
