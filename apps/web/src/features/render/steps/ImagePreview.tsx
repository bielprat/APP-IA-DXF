/* eslint-disable @next/next/no-img-element -- local blob: URLs are not supported by next/image */

export function ImagePreview({ url, alt, className = "" }: { url: string; alt: string; className?: string }) {
  return <img src={url} alt={alt} className={`h-full w-full object-contain ${className}`} />;
}

export function PlaceholderBox({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center p-4 text-center font-mono text-sm text-text-muted ${className}`}
      style={{ background: "repeating-linear-gradient(135deg, #E8E9E8 0 12px, #F1F1F0 12px 24px)" }}
    >
      {label}
    </div>
  );
}
