"use client";

import { buttonStyles } from "@/components/ui/button-styles";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <section role="alert" className="flex w-full max-w-[480px] flex-col gap-4 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <h1 className="text-2xl font-semibold">No s&apos;ha pogut carregar la pàgina</h1>
        <p className="text-[15px] text-text-muted">
          Hi ha hagut un error al servidor. Torna-ho a provar i, si continua passant, avisa l&apos;administrador indicant aquest codi:
        </p>
        {error.digest && <p className="font-mono text-sm">{error.digest}</p>}
        <button type="button" onClick={reset} className={`${buttonStyles.primary} self-start`}>
          Tornar-ho a provar
        </button>
      </section>
    </main>
  );
}
