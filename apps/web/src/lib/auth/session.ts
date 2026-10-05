import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import type { Role } from "./access";

export type CurrentUser = { id: string; email: string; name: string | null; role: Role };

/**
 * Authoritative check for server components and actions: the JWT only proves identity,
 * role and active flag are always re-read from the database.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await getDb().user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.active) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
