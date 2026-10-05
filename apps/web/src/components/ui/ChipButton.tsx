"use client";

export function ChipButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-4 text-sm text-brand-black ${
        selected ? "border-brand-orange bg-brand-orange font-semibold" : "border-border-chip bg-surface hover:bg-bg-page"
      }`}
    >
      {label}
    </button>
  );
}
