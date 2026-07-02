"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";
import { PlaceCover } from "@/components/media/PlaceCover";
import { Button } from "@/components/ui/button";
import { StopMarkerBadge } from "@/components/visual/visuals";
import type { Place, Route } from "@/lib/types";

export function RouteStopTimeline({
  route,
  places = [],
  selectedPlaceSlug,
  visitedStopIds = [],
  skippedStopIds = [],
  currentStopId,
  nextStopId,
  onSelectStop
}: {
  route: Route;
  places?: Place[];
  selectedPlaceSlug?: string;
  visitedStopIds?: string[];
  skippedStopIds?: string[];
  currentStopId?: string;
  nextStopId?: string;
  onSelectStop?: (placeSlug: string) => void;
}) {
  const visited = new Set(visitedStopIds);
  const skipped = new Set(skippedStopIds);

  return (
    <ol className="list-none space-y-4">
      {route.stops.map((stop, index) => {
        const place = places.find((item) => item.id === stop.placeId);
        const selected = Boolean(place?.slug && selectedPlaceSlug === place.slug);
        const markerState = visited.has(stop.id)
          ? "visited"
          : skipped.has(stop.id)
            ? "skipped"
            : stop.id === currentStopId
              ? "selected"
              : stop.id === nextStopId
                ? "next"
                : selected
                  ? "selected"
                  : "default";

        return (
          <li className="grid grid-cols-[36px_minmax(0,1fr)] gap-3" key={stop.id}>
            <StopMarkerBadge index={index + 1} state={markerState} />
            <div className={selected ? "rounded-card border border-primary bg-surface-container-lowest p-4 shadow-card" : "rounded-card border border-outline-variant bg-surface-container-lowest p-4"}>
              <div className="grid gap-3 sm:grid-cols-[112px_minmax(0,1fr)]">
                {place ? (
                  <Link aria-label={`Open ${place.name}`} className="relative block h-24 overflow-hidden rounded-card bg-surface-container-high" href={`/places/${place.slug}`}>
                    <PlaceCover place={place} />
                  </Link>
                ) : null}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-body-lg font-semibold text-on-surface">
                      {place ? (
                        <Link className="rounded-control hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary" href={`/places/${place.slug}`}>
                          {stop.title}
                        </Link>
                      ) : (
                        stop.title
                      )}
                    </h3>
                    <span className="text-label-sm text-on-surface-variant">{stop.distanceFromStartKm.toFixed(1)} km from start</span>
                  </div>
                  <p className="mt-2 text-body-md text-on-surface-variant">{place?.whyItMatters ?? stop.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
                    <span>{stop.recommendedStopMin} min stop</span>
                    {place?.periodOrStyle ? <span>{place.periodOrStyle}</span> : null}
                  </div>
                </div>
              </div>
              {place && onSelectStop ? (
                <Button className="mt-3" onClick={() => onSelectStop(place.slug)} size="sm" variant="secondary">
                  <MapPinned aria-hidden="true" size={15} />
                  Select on map
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
