"use client";

/* eslint-disable @next/next/no-img-element -- authenticated API images */
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Region } from "@/features/render/jobRequest";

type Props = {
  imageUrl: string;
  imageAlt: string;
  regions: readonly Region[];
  onAdd: (region: Region) => void;
  onRemove: (index: number) => void;
  /** Label of new regions, numbered automatically ("Logo o rètol 1"). */
  labelPrefix: string;
  /** With 1, a new rectangle replaces the previous one. */
  max?: number;
};

type Point = { x: number; y: number };

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Draw rectangles on an image with the pointer; each one is listed and can be removed. */
export function RegionEditor({ imageUrl, imageAlt, regions, onAdd, onRemove, labelPrefix, max = 30 }: Props) {
  const surface = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState<Point | null>(null);
  const [current, setCurrent] = useState<Point | null>(null);

  const toPoint = (event: React.PointerEvent): Point => {
    const box = surface.current!.getBoundingClientRect();
    return { x: clamp((event.clientX - box.left) / box.width), y: clamp((event.clientY - box.top) / box.height) };
  };

  const draft =
    start && current
      ? { x: Math.min(start.x, current.x), y: Math.min(start.y, current.y), width: Math.abs(current.x - start.x), height: Math.abs(current.y - start.y) }
      : null;

  const finish = () => {
    if (draft && draft.width > 0.01 && draft.height > 0.01) {
      if (max === 1 && regions.length > 0) onRemove(0);
      if (max === 1 || regions.length < max) onAdd({ ...draft, label: `${labelPrefix} ${max === 1 ? 1 : regions.length + 1}` });
    }
    setStart(null);
    setCurrent(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={surface}
        className="relative w-full cursor-crosshair touch-none overflow-hidden rounded-xl bg-bg-page select-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setStart(toPoint(event));
          setCurrent(toPoint(event));
        }}
        onPointerMove={(event) => start && setCurrent(toPoint(event))}
        onPointerUp={finish}
        onPointerCancel={() => {
          setStart(null);
          setCurrent(null);
        }}
      >
        <img src={imageUrl} alt={imageAlt} draggable={false} className="block h-auto w-full" />
        {[...regions, ...(draft ? [{ ...draft, label: "" }] : [])].map((region, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="absolute border-2 border-brand-orange bg-brand-orange/15"
            style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%` }}
          >
            {region.label && <span className="absolute -top-0.5 left-0 -translate-y-full bg-brand-orange px-1.5 text-xs font-semibold text-brand-black">{index + 1}</span>}
          </span>
        ))}
      </div>
      <p className="text-sm text-text-muted">Arrossega sobre la imatge per marcar una zona.</p>
      {regions.length > 0 && (
        <ul className="flex flex-col gap-1">
          {regions.map((region, index) => (
            <li key={index} className="flex items-center justify-between gap-2 rounded-lg bg-bg-page px-3">
              <span className="text-[15px]">
                {index + 1} · {region.label}
              </span>
              <button
                type="button"
                aria-label={`Treure la zona ${index + 1}`}
                onClick={() => onRemove(index)}
                className="flex size-11 items-center justify-center rounded-lg hover:bg-tint-gray"
              >
                <Icon name="trash" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
