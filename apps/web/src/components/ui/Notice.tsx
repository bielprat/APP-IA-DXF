import { Icon } from "./Icon";

type Variant = "warning" | "info";

export function Notice({ title, children, variant = "info" }: { title?: string; children: React.ReactNode; variant?: Variant }) {
  return (
    <div className={`flex gap-3 rounded-xl px-4 py-3 text-[15px] ${variant === "warning" ? "bg-tint-orange" : "bg-tint-gray"}`}>
      <span className="mt-0.5 shrink-0">
        <Icon name={variant === "warning" ? "alert" : "info"} />
      </span>
      <div className="flex flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="leading-snug">{children}</div>
      </div>
    </div>
  );
}
