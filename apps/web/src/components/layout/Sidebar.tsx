"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { Role } from "@/lib/auth/access";
import { isNavItemActive, visibleNavItems } from "@/lib/navigation";

type Props = {
  user: { name: string | null; email: string; role: Role };
  signOutAction: () => Promise<void>;
};

export function Sidebar({ user, signOutAction }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-border bg-surface px-5 py-5 md:sticky md:top-0 md:h-dvh md:w-[248px] md:shrink-0 md:gap-8 md:border-r md:border-b-0 md:py-7">
      <div className="flex flex-col gap-3">
        <Link href="/" aria-label="Colomer-Rifà · Inici" className="w-fit">
          <Image src="/brand/logo-colomer-rifa.png" alt="Colomer-Rifà" width={150} height={47} priority />
        </Link>
        <p className="text-[13px] text-text-muted">Render AI · Modelatge 3D</p>
      </div>

      <nav aria-label="Navegació principal" className="flex flex-row flex-wrap gap-1 md:flex-col">
        {visibleNavItems(user.role).map((item) => {
          const active = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] text-brand-black ${
                active ? "bg-brand-orange font-medium" : "hover:bg-bg-page"
              }`}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 border-t border-border pt-4 md:mt-auto">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
          <p className="truncate font-mono text-xs text-text-muted">{user.email}</p>
          {user.role === "admin" && (
            <span className="mt-2 inline-block rounded-full bg-tint-orange px-3 py-0.5 text-xs font-medium">Administrador</span>
          )}
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-border-strong px-3 text-sm hover:bg-bg-page"
          >
            <Icon name="logout" />
            Tancar sessió
          </button>
        </form>
      </div>
    </aside>
  );
}
