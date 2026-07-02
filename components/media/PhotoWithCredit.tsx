import type { ReactNode } from "react";
import type { MediaAsset } from "@/lib/types";
import { isApprovedProductionImageAsset } from "@/lib/media/licenses";
import { cn } from "@/lib/utils/cn";
import { MediaCredit } from "./MediaCredit";
import { ResponsiveImage } from "./ResponsiveImage";

export function PhotoWithCredit({
  asset,
  className,
  fallback,
  imageClassName,
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw"
}: {
  asset?: MediaAsset;
  className?: string;
  fallback?: ReactNode;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!isApprovedProductionImageAsset(asset)) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <figure className={cn("relative isolate h-full w-full overflow-hidden rounded-card bg-surface-container-high", className)}>
      <ResponsiveImage asset={asset} className={imageClassName} priority={priority} sizes={sizes} />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
      <MediaCredit asset={asset} className="absolute bottom-3 left-3 right-3 w-fit max-w-[calc(100%-1.5rem)]" />
    </figure>
  );
}
