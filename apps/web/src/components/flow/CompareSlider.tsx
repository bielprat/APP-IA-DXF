"use client";

import { useId, useState } from "react";

type Props = { before: React.ReactNode; after: React.ReactNode; beforeLabel?: string; afterLabel?: string };

/** ORIGINAL | RESULTAT comparator; the range input keeps it keyboard and screen-reader operable. */
export function CompareSlider({ before, after, beforeLabel = "ORIGINAL", afterLabel = "RESULTAT" }: Props) {
  const [position, setPosition] = useState(50);
  const id = useId();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-bg-page">
        <div className="absolute inset-0">{after}</div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          {before}
        </div>
        <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_#212121]" style={{ left: `${position}%` }} />
        <span className="absolute top-3 left-3 rounded-full bg-brand-black px-3 py-1 text-xs font-semibold text-white">{beforeLabel}</span>
        <span className="absolute top-3 right-3 rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold text-brand-black">{afterLabel}</span>
      </div>
      <label htmlFor={id} className="sr-only">
        Posició del comparador
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-valuetext={`${position}% original`}
        className="h-11 w-full accent-brand-orange"
      />
    </div>
  );
}
