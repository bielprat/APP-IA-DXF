export function Panel({ children, className = "", ...rest }: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) {
  return (
    <section {...rest} className={`flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 md:p-6 ${className}`}>
      {children}
    </section>
  );
}
