"use client";

import { Icon, isIconName } from "./Icon";

type Props = { title: string; description?: string; icon?: string; selected: boolean; onSelect: () => void };

/** Large category card (icon + title + one line), used in "Què vols millorar?" and "Què modelar?". */
export function CategoryCard({ title, description, icon, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative flex min-h-[170px] w-full flex-col items-start gap-3.5 rounded-2xl border-2 p-5 text-left text-brand-black ${
        selected ? "border-brand-orange bg-tint-orange" : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      <span className={`flex size-[52px] items-center justify-center rounded-xl ${selected ? "bg-brand-orange" : "bg-bg-page"}`}>
        {isIconName(icon) && <Icon name={icon} size={28} />}
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-lg font-semibold">{title}</span>
        {description && <span className={`text-sm leading-snug ${selected ? "text-text-on-tint" : "text-text-muted"}`}>{description}</span>}
      </span>
      {selected && (
        <span aria-hidden="true" className="absolute top-3.5 right-3.5 flex size-7 items-center justify-center rounded-full bg-brand-black text-white">
          <Icon name="check" size={16} />
        </span>
      )}
    </button>
  );
}
