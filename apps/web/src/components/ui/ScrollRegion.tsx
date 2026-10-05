/** Horizontally scrollable wrapper for wide tables; focusable so keyboard users can scroll it (WCAG 2.1.1). */
export function ScrollRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-lg">
      {children}
    </div>
  );
}
