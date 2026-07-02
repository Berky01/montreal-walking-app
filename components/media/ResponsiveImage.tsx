import Image from "next/image";
import type { MediaAsset } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function ResponsiveImage({
  asset,
  className,
  priority = false,
  sizes = "(min-width: 1024px) 33vw, 100vw"
}: {
  asset: MediaAsset;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!asset.url) {
    return null;
  }

  return <Image alt={asset.alt} className={cn("object-cover", className)} fill priority={priority} sizes={sizes} src={asset.url} />;
}
