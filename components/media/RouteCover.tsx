import type { Route } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { RouteVisual } from "@/components/visual/visuals";
import { getPrimaryMediaAsset } from "@/lib/media/media-selection";
import { ResponsiveImage } from "./ResponsiveImage";

export function RouteCover({ route, className }: { route: Route; className?: string }) {
  const asset = getPrimaryMediaAsset(route.media, "card");

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {asset?.url ? (
        <ResponsiveImage asset={asset} />
      ) : (
        <RouteVisual className="rounded-none" route={route} size="md" />
      )}
    </div>
  );
}
