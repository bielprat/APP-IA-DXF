"use client";

import { renderCatalog } from "@cr/catalog";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { useRenderFlow } from "../RenderFlowProvider";
import { improveBlockedReason } from "../state";

const OPTIONS = renderCatalog.improvements.groups[0].options;

export function ImproveStep() {
  const { state, dispatch } = useRenderFlow();
  const count = state.improvements.length;

  return (
    <>
      <section aria-label="Categories" className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
        {OPTIONS.map((option) => (
          <CategoryCard
            key={option.id}
            title={option.label}
            description={option.description}
            icon={option.icon}
            selected={state.improvements.includes(option.id)}
            onSelect={() => dispatch({ type: "toggleImprovement", id: option.id })}
          />
        ))}
      </section>
      <FlowFooter
        status={count === 0 ? "Cap selecció" : count === 1 ? "1 selecció" : `${count} seleccions`}
        backHref="/render/upload"
        nextHref="/render/details"
        blockedReason={improveBlockedReason(state)}
      />
    </>
  );
}
