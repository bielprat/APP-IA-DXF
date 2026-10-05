"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui/button-styles";

type Props = {
  status?: string;
  backHref?: string;
  nextHref: string;
  nextLabel?: string;
  /** When set, "Continuar" is disabled and this explains why. */
  blockedReason?: string | null;
};

export function FlowFooter({ status, backHref, nextHref, nextLabel = "Continuar", blockedReason }: Props) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4 md:px-6">
      <div className="flex flex-col gap-0.5">
        {status && <p className="text-[17px] font-semibold">{status}</p>}
        {blockedReason && (
          <p id="flow-blocked-reason" className="text-sm text-text-muted">
            {blockedReason}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {backHref && (
          <Link href={backHref} className={buttonStyles.secondary}>
            Enrere
          </Link>
        )}
        <button
          type="button"
          className={buttonStyles.primary}
          disabled={Boolean(blockedReason)}
          aria-describedby={blockedReason ? "flow-blocked-reason" : undefined}
          onClick={() => router.push(nextHref)}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
