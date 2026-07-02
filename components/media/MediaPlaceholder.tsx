import { cn } from "@/lib/utils/cn";

const toneByKind = {
  route: "from-primary/85 via-secondary/55 to-tertiary/45",
  place: "from-primary/80 via-tertiary/55 to-secondary/45"
};

export function MediaPlaceholder({
  alt,
  className,
  kind,
  label
}: {
  alt: string;
  className?: string;
  kind: keyof typeof toneByKind;
  label: string;
}) {
  return (
    <div
      aria-label={alt}
      className={cn(
        "relative h-full w-full overflow-hidden bg-surface-container-high",
        "bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.2)_0,rgba(255,255,255,0.2)_1px,transparent_1px,transparent_24px)]",
        className
      )}
      role="img"
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", toneByKind[kind])} />
      <div className="absolute bottom-3 left-3 max-w-[70%] rounded-control bg-surface-container-lowest/95 px-3 py-1 text-label-sm text-primary shadow-card">
        {label}
      </div>
    </div>
  );
}
