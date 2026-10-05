import NextAuth, { type NextAuthConfig } from "next-auth";
import type {} from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { emailFromEntraProfile, isEmailAllowed, normalizeEmail, resolveRole, type Role } from "@/lib/auth/access";
import { getDb } from "@/lib/db";
import { getEnv, isEntraConfigured } from "@/lib/env";

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name?: string | null; role: Role };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
  }
}

export const DEV_LOGIN_PROVIDER_ID = "dev-login";

/** Creates or updates the user on every sign-in and returns it, or null if access must be denied. */
async function syncUser(email: string, name: string | null | undefined) {
  const env = getEnv();
  const db = getDb();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing && !existing.active) return null;
  const role = resolveRole(email, env.ADMIN_EMAILS, existing?.role ?? null);
  return db.user.upsert({
    where: { email },
    create: { email, name: name ?? null, role, lastLoginAt: new Date() },
    update: { name: name ?? existing?.name ?? null, role, lastLoginAt: new Date() },
  });
}

function buildConfig(): NextAuthConfig {
  const env = getEnv();
  const providers: NextAuthConfig["providers"] = [];

  if (isEntraConfigured(env)) {
    providers.push(
      MicrosoftEntraID({
        clientId: env.AUTH_MICROSOFT_ENTRA_ID_ID,
        clientSecret: env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
        issuer: env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      }),
    );
  }

  // Local-only shortcut for development and E2E tests. env.ts refuses it outside APP_ENV=local.
  if (env.AUTH_DEV_LOGIN) {
    providers.push(
      Credentials({
        id: DEV_LOGIN_PROVIDER_ID,
        name: "Accés de desenvolupament",
        credentials: { email: { label: "Correu", type: "email" } },
        authorize(credentials) {
          const email = normalizeEmail(typeof credentials?.email === "string" ? credentials.email : null);
          if (!email || !isEmailAllowed(email, env.ALLOWED_EMAIL_DOMAINS)) return null;
          return { id: email, email, name: email.split("@")[0] };
        },
      }),
    );
  }

  return {
    providers,
    session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
    pages: { signIn: "/login", error: "/login" },
    trustHost: true,
    callbacks: {
      async signIn({ user, account, profile }) {
        const email =
          account?.provider === "microsoft-entra-id"
            ? emailFromEntraProfile(profile as Record<string, unknown> | undefined)
            : normalizeEmail(user.email);
        if (!email || !isEmailAllowed(email, env.ALLOWED_EMAIL_DOMAINS)) return false;
        const dbUser = await syncUser(email, user.name);
        if (!dbUser) return false;
        user.id = dbUser.id;
        user.email = dbUser.email;
        return true;
      },
      async jwt({ token, user }) {
        if (user?.id) {
          const dbUser = await getDb().user.findUnique({ where: { id: user.id } });
          if (dbUser) {
            token.uid = dbUser.id;
            token.email = dbUser.email;
            token.role = dbUser.role;
          }
        }
        return token;
      },
      session({ session, token }) {
        if (token.uid && token.email) {
          session.user = { ...session.user, id: token.uid, email: token.email, role: token.role ?? "user" };
        }
        return session;
      },
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => buildConfig());
