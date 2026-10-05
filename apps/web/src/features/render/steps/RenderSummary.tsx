"use client";

import { getOption } from "@cr/catalog";
import { useRenderFlow } from "../RenderFlowProvider";
import { baseImage, summarizeRender } from "../state";
import { ImagePreview, PlaceholderBox } from "./ImagePreview";

export function RenderSummary({ title = "El teu render" }: { title?: string }) {
  const { state } = useRenderFlow();
  const base = baseImage(state);
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="aspect-video overflow-hidden rounded-xl bg-bg-page">
        {base ? <ImagePreview url={base.url} alt={`Imatge base: ${base.name}`} /> : <PlaceholderBox label="Sense imatge base" />}
      </div>
      <ul className="flex flex-col gap-1.5 text-[15px]">
        {summarizeRender(state).map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-orange" />
            {line}
          </li>
        ))}
      </ul>
      <p className="text-[15px]">
        <span className="text-text-muted">Fidelitat: </span>
        <span className="font-semibold">{getOption(state.fidelity).label}</span>
      </p>
    </div>
  );
}
