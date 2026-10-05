"use client";

import { cadCatalog } from "@cr/catalog";
import { FlowFooter } from "@/components/flow/FlowFooter";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { useCadFlow } from "../CadFlowProvider";
import { effectiveElements, elementsBlockedReason } from "../state";

const ELEMENTS = cadCatalog.elements.groups[0];

export function ElementsStep() {
  const { state, dispatch } = useCadFlow();
  const selected = effectiveElements(state);
  const count = selected.length;

  return (
    <>
      <section aria-label="Elements" className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
        {ELEMENTS.options.map((option) => (
          <CategoryCard
            key={option.id}
            title={option.label}
            description={option.description}
            icon={option.icon}
            selected={selected.includes(option.id)}
            onSelect={() => dispatch({ type: "toggleElement", id: option.id })}
          />
        ))}
      </section>
      <FlowFooter
        status={count === 0 ? "Cap element" : count === 1 ? "1 element" : `${count} elements`}
        backHref="/cad/upload"
        nextHref="/cad/parameters"
        blockedReason={elementsBlockedReason(state)}
      />
    </>
  );
}
