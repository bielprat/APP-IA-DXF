export type Role = "user" | "admin";

export function normalizeEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase();
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value;
}

/** Exact domain match: `user@colomer-rifa.cat` is allowed, `user@evil-colomer-rifa.cat` and subdomains are not. */
export function isEmailAllowed(email: string | null | undefined, allowedDomains: readonly string[]): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const domain = normalized.slice(normalized.lastIndexOf("@") + 1);
  return allowedDomains.some((allowed) => allowed.trim().toLowerCase() === domain);
}

/**
 * Bootstrap admins come from ADMIN_EMAILS and are always admin.
 * Everyone else keeps the role stored in the database (default "user").
 */
export function resolveRole(email: string, adminEmails: readonly string[], storedRole: Role | null): Role {
  if (adminEmails.includes(email.toLowerCase())) return "admin";
  return storedRole ?? "user";
}

/** Entra ID does not always send `email`; fall back to the UPN (`preferred_username`). */
export function emailFromEntraProfile(profile: Record<string, unknown> | undefined | null): string | null {
  if (!profile) return null;
  const candidates = [profile.email, profile.preferred_username, profile.upn];
  for (const candidate of candidates) {
    const email = normalizeEmail(typeof candidate === "string" ? candidate : null);
    if (email) return email;
  }
  return null;
}
