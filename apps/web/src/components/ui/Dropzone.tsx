"use client";

import { useId, useState } from "react";
import { Icon } from "./Icon";

type Props = {
  label: string;
  hint?: string;
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  compact?: boolean;
};

/** Large drop zone backed by a real file input, so it works with keyboard and screen readers. */
export function Dropzone({ label, hint, accept, multiple = true, onFiles, compact = false }: Props) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  return (
    <label
      htmlFor={inputId}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFiles(Array.from(event.dataTransfer.files));
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center text-[15px] text-text-muted has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-black ${
        dragging ? "border-brand-orange bg-tint-orange" : "border-brand-gray bg-surface-sunken"
      } ${compact ? "min-h-[160px]" : "min-h-[260px]"}`}
    >
      <Icon name={compact ? "plus" : "upload"} size={28} />
      <span className="font-medium text-brand-black">{label}</span>
      {hint && <span className="font-mono text-[13px]">{hint}</span>}
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
    </label>
  );
}
