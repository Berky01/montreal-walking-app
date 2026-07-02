import Link from "next/link";
import { PlaceCover } from "@/components/media/PlaceCover";
import { RouteCover } from "@/components/media/RouteCover";
import type { Place, Route } from "@/lib/types";
import type { MapSelection } from "./mapTypes";

export function MapPreviewCard({
  selected,
  route,
  place,
  fallbackRoute
}: {
  selected: MapSelection;
  route?: Route;
  place?: Place;
  fallbackRoute?: Route;
}) {
  const activeRoute = selected?.type === "route" ? route : fallbackRoute;

  if (selected?.type === "place" && place) {
    return (
      <div className="absolute bottom-4 left-4 right-4 z-[500] rounded-card bg-surface-container-lowest/95 p-4 shadow-card backdrop-blur">
        <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
          <Link aria-label={`Open ${place.name}`} className="relative h-20 overflow-hidden rounded-card bg-surface-container-high" href={`/places/${place.slug}`}>
            <PlaceCover place={place} />
          </Link>
          <div className="min-w-0">
            <p className="text-label-sm text-on-surface-variant">{place.area} · {place.category.replace("_", " ")}</p>
            <Link className="mt-1 block text-label-md text-on-surface hover:text-primary" href={`/places/${place.slug}`}>
              {place.name}
            </Link>
            <Link className="mt-3 inline-flex text-label-sm font-semibold text-primary" href={`/places/${place.slug}`}>
              View place
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!activeRoute) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 z-[500] rounded-card bg-surface-container-lowest/95 p-4 shadow-card backdrop-blur">
      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
        <Link aria-label={`Open ${activeRoute.title}`} className="relative h-20 overflow-hidden rounded-card bg-surface-container-high" href={`/routes/${activeRoute.slug}`}>
          <RouteCover route={activeRoute} />
        </Link>
        <div className="min-w-0">
          <p className="text-label-sm text-on-surface-variant">{activeRoute.area} · {activeRoute.stops.length} stops</p>
          <Link className="mt-1 block text-label-md text-on-surface hover:text-primary" href={`/routes/${activeRoute.slug}`}>
            {activeRoute.title}
          </Link>
          <div className="mt-3 flex gap-3 text-label-sm font-semibold text-primary">
            <Link href={`/routes/${activeRoute.slug}`}>View places</Link>
            <Link href={`/routes/${activeRoute.slug}/live`}>Optional walk</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
