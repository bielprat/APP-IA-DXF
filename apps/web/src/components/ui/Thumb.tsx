const NEUTRAL = "repeating-linear-gradient(135deg, #E8E9E8 0 12px, #F1F1F0 12px 24px)";

/** 84 px illustrative thumbnail: a catalog gradient, a solid swatch or the neutral stripes. */
export function Thumb({ thumbnail, swatch, className = "" }: { thumbnail?: string; swatch?: string; className?: string }) {
  const background = swatch ?? (thumbnail === "neutral" || !thumbnail ? NEUTRAL : thumbnail);
  return <span aria-hidden="true" className={`block h-[84px] w-full rounded-[10px] border border-border ${className}`} style={{ background }} />;
}
