"use client";

import * as RadixTabs from "@radix-ui/react-tabs";

export type TabItem = { id: string; label: string; content: React.ReactNode; incomplete?: boolean };

/** Accessible tabs (Radix) styled as the flow chips. */
export function Tabs({ items, label, value, onValueChange }: { items: TabItem[]; label: string; value: string; onValueChange: (id: string) => void }) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className="flex flex-col gap-5">
      <RadixTabs.List aria-label={label} className="flex flex-wrap gap-2 border-b border-border pb-4">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.id}
            value={item.id}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-chip bg-surface px-4 text-sm text-brand-black hover:bg-bg-page data-[state=active]:border-brand-orange data-[state=active]:bg-brand-orange data-[state=active]:font-semibold"
          >
            {item.label}
            {item.incomplete && (
              <span className="rounded-full bg-brand-black px-1.5 text-[11px] font-semibold text-white" aria-label="cal triar">
                !
              </span>
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.id} value={item.id} className="flex flex-col gap-6 focus-visible:outline-none">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
