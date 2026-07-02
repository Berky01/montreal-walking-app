import type { MediaAsset, Source } from "@/lib/types";
import { describeMediaAttribution } from "@/lib/media/licenses";
import { cn } from "@/lib/utils/cn";

export function AttributionLine({
  className,
  media,
  sources
}: {
  className?: string;
  media: MediaAsset[];
  sources?: Source[];
}) {
  return (
    <p className={cn("text-label-sm text-on-surface-variant", className)}>
      {describeMediaAttribution(media, sources)}
    </p>
  );
}
