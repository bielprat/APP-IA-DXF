"use client";

import { isGroupValid, toggleOption, type CatalogGroup } from "@cr/catalog";
import { useId } from "react";
import { ChipButton } from "./ChipButton";
import { OptionCard } from "./OptionCard";

type Props = {
  group: CatalogGroup;
  selected: readonly string[];
  onChange: (next: string[]) => void;
  /** Overrides the catalog title (e.g. hidden when a tab already names the group). */
  title?: string;
  minCardWidth?: number;
  headingLevel?: "h2" | "h3";
};

export function OptionGroup({ group, selected, onChange, title, minCardWidth = 170, headingLevel = "h3" }: Props) {
  const headingId = useId();
  const Heading = headingLevel;
  const valid = isGroupValid(selected, group);
  const pick = (id: string) => onChange(toggleOption(selected, group, id));

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Heading id={headingId} className="text-base font-semibold">
          {title ?? group.title}
        </Heading>
        {group.mode === "multi" && <span className="text-sm text-text-muted">Pots triar-ne diverses</span>}
      </div>
      <div
        role="group"
        aria-labelledby={headingId}
        className={group.presentation === "chips" ? "flex flex-wrap gap-2" : "grid gap-3"}
        style={group.presentation === "chips" ? undefined : { gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
      >
        {group.options.map((option) =>
          group.presentation === "chips" ? (
            <ChipButton key={option.id} label={option.label} selected={selected.includes(option.id)} onClick={() => pick(option.id)} />
          ) : (
            <OptionCard key={option.id} option={option} selected={selected.includes(option.id)} onSelect={() => pick(option.id)} />
          ),
        )}
      </div>
      {!valid && (
        <p className="text-sm font-medium" role="status">
          Tria almenys una opció.
        </p>
      )}
    </section>
  );
}
