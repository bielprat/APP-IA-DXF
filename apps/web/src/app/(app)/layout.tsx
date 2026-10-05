import { Sidebar } from "@/components/layout/Sidebar";
import { requireUser } from "@/lib/auth/session";
import { signOutAction } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar user={user} signOutAction={signOutAction} />
      <main className="flex min-w-0 flex-1 flex-col gap-8 px-4 py-6 md:px-10 md:py-8">{children}</main>
    </div>
  );
}
