"use client";

import type { CatalogGroup, Selection } from "@cr/catalog";
import { OptionGroup } from "./OptionGroup";

/** Multi-select chip filters driven by catalog groups. */
export function FilterBar({ groups, value, onChange }: { groups: readonly CatalogGroup[]; value: Selection; onChange: (next: Selection) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <OptionGroup key={group.id} group={group} selected={value[group.id] ?? []} onChange={(selected) => onChange({ ...value, [group.id]: selected })} />
      ))}
    </div>
  );
}
