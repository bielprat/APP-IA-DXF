"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { DEV_LOGIN_PROVIDER_ID, signIn } from "@/auth";
import { safeCallbackPath } from "@/lib/auth/redirect";

async function signInWith(provider: string, formData: FormData, options: Record<string, unknown> = {}) {
  const redirectTo = safeCallbackPath(formData.get("callbackUrl")?.toString());
  try {
    await signIn(provider, { ...options, redirectTo });
  } catch (error) {
    // signIn() redirects by throwing; only Auth.js errors are mapped to a message.
    if (error instanceof AuthError) redirect(`/login?error=${encodeURIComponent(error.type)}`);
    throw error;
  }
}

export async function signInWithMicrosoft(formData: FormData) {
  await signInWith("microsoft-entra-id", formData);
}

export async function signInWithDevLogin(formData: FormData) {
  await signInWith(DEV_LOGIN_PROVIDER_ID, formData, { email: formData.get("email")?.toString() ?? "" });
}
