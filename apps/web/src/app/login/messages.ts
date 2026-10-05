/** Maps Auth.js error codes to Catalan messages without exposing technical details. */
export function loginErrorMessage(code: string | undefined, allowedDomains: readonly string[]): string | null {
  if (!code) return null;
  const domains = allowedDomains.map((domain) => `@${domain}`).join(", ");
  switch (code) {
    case "AccessDenied":
    case "CredentialsSignin":
      return `Aquest compte no té accés. Només s'hi pot entrar amb una adreça ${domains} activa.`;
    case "Configuration":
      return "L'inici de sessió no està configurat correctament. Avisa l'administrador.";
    default:
      return "No s'ha pogut iniciar la sessió. Torna-ho a provar.";
  }
}
