// Orange buttons always carry black text (WCAG AA, prompt §2.1).
const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-sans text-base min-h-12 px-6 transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const buttonStyles = {
  primary: `${base} bg-brand-orange font-semibold text-brand-black hover:bg-[#d96f02]`,
  secondary: `${base} border border-border-strong bg-surface text-brand-black hover:bg-bg-page`,
  generate:
    "inline-flex w-full items-center justify-center rounded-xl bg-brand-orange min-h-16 px-8 text-lg font-semibold uppercase tracking-wide text-brand-black hover:bg-[#d96f02]",
} as const;
