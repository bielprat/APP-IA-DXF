"use client";

import type { CatalogOption } from "@cr/catalog";
import { Icon } from "./Icon";
import { Thumb } from "./Thumb";

type Props = {
  option: CatalogOption;
  selected: boolean;
  onSelect: () => void;
  showThumbnail?: boolean;
};

/** Selectable card (prompt §2.1): 2 px border, orange + tint + check badge when selected. */
export function OptionCard({ option, selected, onSelect, showThumbnail = true }: Props) {
  const hasThumb = showThumbnail && (option.thumbnail || option.swatch);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative flex h-full w-full flex-col items-stretch gap-2.5 rounded-2xl border-2 p-3 text-left text-brand-black transition-colors ${
        selected ? "border-brand-orange bg-tint-orange" : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      {hasThumb && <Thumb thumbnail={option.thumbnail} swatch={option.swatch} />}
      <span className="flex flex-col gap-1 pr-8">
        <span className="text-[15px] leading-snug font-semibold">{option.label}</span>
        {option.recommended && (
          <span className="w-fit rounded-full bg-brand-black px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">
            Recomanat
          </span>
        )}
        {option.description && <span className="text-sm leading-snug text-text-on-tint">{option.description}</span>}
      </span>
      {selected && (
        <span
          aria-hidden="true"
          className={`absolute right-3 flex size-7 items-center justify-center rounded-full bg-brand-black text-white ${hasThumb ? "top-[100px]" : "top-3"}`}
        >
          <Icon name="check" size={16} />
        </span>
      )}
    </button>
  );
}
