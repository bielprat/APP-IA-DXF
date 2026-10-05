import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { buttonStyles } from "@/components/ui/button-styles";
import { safeCallbackPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";
import { getEnv, isEntraConfigured } from "@/lib/env";
import { signInWithDevLogin, signInWithMicrosoft } from "./actions";
import { loginErrorMessage } from "./messages";

export const metadata: Metadata = { title: "Inici de sessió" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const callbackUrl = safeCallbackPath(params.callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);

  const env = getEnv();
  const entra = isEntraConfigured(env);
  const error = loginErrorMessage(typeof params.error === "string" ? params.error : undefined, env.ALLOWED_EMAIL_DOMAINS);
  const domain = env.ALLOWED_EMAIL_DOMAINS[0];

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="flex w-full max-w-[440px] flex-col gap-6 rounded-2xl border border-border bg-surface p-6 md:p-10">
        <Image src="/brand/logo-colomer-rifa.png" alt="Colomer-Rifà" width={180} height={56} priority />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Render AI · Modelatge 3D</h1>
          <p className="text-[15px] text-text-muted">Eina interna. Entra amb el teu compte de Microsoft 365 de l&apos;empresa.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-tint-orange px-4 py-3 text-[15px]">
            {error}
          </p>
        )}

        {entra ? (
          <form action={signInWithMicrosoft}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <button type="submit" className={`${buttonStyles.primary} w-full`}>
              Entrar amb Microsoft 365
            </button>
          </form>
        ) : (
          <p className="rounded-xl bg-tint-gray px-4 py-3 text-[15px]">
            L&apos;inici de sessió amb Microsoft 365 encara no està configurat en aquest servidor.
          </p>
        )}

        {env.AUTH_DEV_LOGIN && (
          <form action={signInWithDevLogin} className="flex flex-col gap-3 border-t border-border pt-6">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <p className="text-sm font-semibold">Accés de desenvolupament (només entorn local)</p>
            <label htmlFor="dev-email" className="text-sm text-text-muted">
              Correu
            </label>
            <input
              id="dev-email"
              name="email"
              type="email"
              required
              placeholder={`nom@${domain}`}
              className="min-h-11 rounded-[10px] border border-border-strong bg-surface px-3 font-mono text-[15px]"
            />
            <button type="submit" className={buttonStyles.secondary}>
              Entrar en local
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
