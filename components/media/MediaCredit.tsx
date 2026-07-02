import type { MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function MediaCredit({ asset, className }: { asset?: MediaAsset; className?: string }) {
  if (!asset?.attributionText) {
    return null;
  }

  const label = compactCredit(asset.attributionText);

  if (asset.sourceUrl) {
    return (
      <a
        className={cn("rounded-control bg-black/45 px-2 py-1 text-[11px] font-medium leading-tight text-white/90 backdrop-blur hover:bg-black/60", className)}
        href={asset.sourceUrl}
        rel="noreferrer"
        target="_blank"
      >
        {label}
      </a>
    );
  }

  return <span className={cn("rounded-control bg-black/45 px-2 py-1 text-[11px] font-medium leading-tight text-white/90 backdrop-blur", className)}>{label}</span>;
}

function compactCredit(value: string): string {
  return value.replace(/\s*\([^)]*\)\.?$/, "").replace(/^Photo by /, "Photo: ");
}
