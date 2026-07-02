import type { Place } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { PlaceVisual } from "@/components/visual/visuals";
import { getPrimaryMediaAsset } from "@/lib/media/media-selection";
import { ResponsiveImage } from "./ResponsiveImage";

export function PlaceCover({ className, place }: { className?: string; place: Place }) {
  const asset = getPrimaryMediaAsset(place.media, "card");

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {asset?.url ? (
        <ResponsiveImage asset={asset} />
      ) : (
        <PlaceVisual className="rounded-none" place={place} size="md" />
      )}
    </div>
  );
}
