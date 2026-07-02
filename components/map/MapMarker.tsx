import { cn } from "@/lib/utils/cn";

export function MapMarker({
  x,
  y,
  label,
  ariaLabel,
  title,
  selected,
  state = "default",
  onSelect
}: {
  x: number;
  y: number;
  label: string;
  ariaLabel?: string;
  title: string;
  selected: boolean;
  state?: "default" | "route" | "place" | "visited" | "skipped" | "current" | "next";
  onSelect: () => void;
}) {
  const active = selected || state === "current";

  return (
    <button
      aria-label={ariaLabel ?? `Show marker ${label}: ${title} on map`}
      className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
      onClick={onSelect}
      style={{ left: `${x}%`, top: `${y}%` }}
      type="button"
    >
      <span
        className={cn(
          "flex h-11 min-w-11 items-center justify-center rounded-full border-2 border-white px-2 text-label-sm font-bold shadow-floating transition-transform",
          active && "scale-110 bg-tertiary text-white",
          !active && state === "visited" && "bg-primary text-on-primary",
          !active && state === "skipped" && "bg-surface-container text-on-surface-variant",
          !active && state === "next" && "bg-secondary text-white",
          !active && state === "route" && "bg-secondary text-white",
          !active && state === "place" && "bg-surface-container-lowest text-primary",
          !active && state === "default" && "bg-primary text-on-primary",
          "hover:scale-105"
        )}
      >
        {label}
      </span>
      <span className="pointer-events-none absolute left-1/2 top-9 hidden -translate-x-1/2 whitespace-nowrap rounded-control bg-surface-container-lowest px-2 py-1 text-label-sm text-on-surface shadow-card group-hover:block">
        {title}
      </span>
    </button>
  );
}
