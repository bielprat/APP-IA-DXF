/** Honest placeholder for screens that are scheduled for a later implementation phase. */
export function PhasePending({ phase }: { phase: number }) {
  return (
    <section className="rounded-2xl border border-dashed border-brand-gray bg-surface-sunken p-8 text-text-muted">
      <p className="text-[15px]">Aquesta pantalla encara no està disponible. Es construeix a la fase {phase}.</p>
    </section>
  );
}
