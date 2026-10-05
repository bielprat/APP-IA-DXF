export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[28px] font-semibold tracking-[-0.01em] md:text-[32px]">{title}</h1>
        {description && <p className="max-w-[720px] text-[17px] text-text-muted">{description}</p>}
      </div>
      {children}
    </header>
  );
}
