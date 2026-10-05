"use client";

import { useId } from "react";

export const NOTES_MAX_LENGTH = 1000;

/** «Altres indicacions — opcional»: always last and visually secondary (prompt §1). */
export function NotesField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text-muted">
        Altres indicacions — opcional
      </label>
      <textarea
        id={id}
        value={value}
        maxLength={NOTES_MAX_LENGTH}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 rounded-[10px] border border-border-strong bg-surface px-3 py-2 text-[15px]"
      />
      <p className="self-end font-mono text-xs text-text-muted">
        {value.length}/{NOTES_MAX_LENGTH}
      </p>
    </div>
  );
}
