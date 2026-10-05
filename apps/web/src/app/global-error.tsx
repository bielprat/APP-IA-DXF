"use client";

// Last-resort boundary when the root layout itself fails; it must render its own <html>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ca">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F1F1F0", color: "#212121", padding: 32 }}>
        <h1>No s&apos;ha pogut carregar l&apos;aplicació</h1>
        <p>Torna-ho a provar. Si continua passant, avisa l&apos;administrador{error.digest ? ` (codi ${error.digest})` : ""}.</p>
        <button type="button" onClick={reset} style={{ minHeight: 48, padding: "0 24px", background: "#ED7902", color: "#212121", border: 0, borderRadius: 10, fontSize: 16 }}>
          Tornar-ho a provar
        </button>
      </body>
    </html>
  );
}
