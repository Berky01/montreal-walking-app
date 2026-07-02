"use client";

import { useMemo, useState } from "react";
import { SplitMapLayout } from "@/components/layout/split-map-layout";
import { MapShell } from "@/components/map/map-shell";
import type { MapSelection } from "@/components/map/mapTypes";
import { AttributionLine } from "@/components/media/AttributionLine";
import { Card } from "@/components/ui/card";
import { RouteAccessibilityNotes, RouteSafetyNotes } from "@/components/routes/route-notes";
import { RouteStopTimeline } from "@/components/routes/route-stop-timeline";
import { RouteDetailStickyActions } from "@/components/walk/route-detail-sticky-actions";
import type { Place, Route } from "@/lib/types";
import { getRouteShapeLabel } from "@/lib/visual-system";

export function RouteGuideClient({ route, places }: { route: Route; places: Place[] }) {
  const [selected, setSelected] = useState<MapSelection>({ type: "route", slug: route.slug });
  const selectedPlaceSlug = selected?.type === "place" ? selected.slug : undefined;
  const nearbyPlaces = useMemo(() => places.filter((place) => route.stops.some((stop) => stop.placeId === place.id)), [places, route.stops]);
  const startPlace = places.find((place) => place.id === route.startPlaceId);
  const endPlace = places.find((place) => place.id === route.endPlaceId);

  return (
    <SplitMapLayout
      content={
        <div className="space-y-8">
          <Card className="p-5">
            <h2 className="text-headline-mobile text-on-surface">Why this collection</h2>
            <p className="mt-3 text-body-md text-on-surface-variant">{route.story}</p>
            <ul className="mt-4 space-y-2 text-body-md text-on-surface-variant">
              {route.whyThisRoute.map((reason) => (
                <li className="flex gap-2" key={reason}>
                  <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  {reason}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-headline-mobile text-on-surface">Practical plan</h2>
            <dl className="mt-4 grid gap-3 text-body-md md:grid-cols-2">
              <div>
                <dt className="text-label-sm text-on-surface-variant">Best time</dt>
                <dd className="mt-1 font-semibold text-on-surface">{route.bestTime}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-on-surface-variant">Pace</dt>
                <dd className="mt-1 font-semibold text-on-surface">{route.pace}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-on-surface-variant">Best for</dt>
                <dd className="mt-1 font-semibold text-on-surface">{route.bestFor.slice(0, 3).join(", ")}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-on-surface-variant">Places</dt>
                <dd className="mt-1 font-semibold text-on-surface">{route.stops.length} stops</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-headline-mobile text-on-surface">Collection details</h2>
            <dl className="mt-4 grid gap-3 text-body-md text-on-surface-variant sm:grid-cols-2">
              <div>
                <dt className="text-label-sm text-on-surface-variant">Optional walk shape</dt>
                <dd className="mt-1 text-on-surface">{getRouteShapeLabel(route.routeType)}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-on-surface-variant">Starts near</dt>
                <dd className="mt-1 text-on-surface">{startPlace?.name ?? route.stops[0]?.title}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-on-surface-variant">Ends near</dt>
                <dd className="mt-1 text-on-surface">{endPlace?.name ?? route.stops.at(-1)?.title}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {route.bestFor.map((item) => (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-label-sm text-primary" key={item}>
                  {item}
                </span>
              ))}
            </div>
            <AttributionLine className="mt-4" media={route.media} sources={route.sources} />
          </Card>

          <section>
            <h2 className="text-headline-mobile text-on-surface">Stop timeline</h2>
            <div className="mt-4">
              <RouteStopTimeline
                onSelectStop={(placeSlug) => setSelected({ type: "place", slug: placeSlug })}
                places={places}
                route={route}
                selectedPlaceSlug={selectedPlaceSlug}
              />
            </div>
          </section>

          <section>
            <h2 className="text-headline-mobile text-on-surface">Optional walking notes</h2>
            <div className="mt-4 grid gap-4">
              <RouteSafetyNotes notes={route.safetyNotes} />
              <RouteAccessibilityNotes notes={route.accessibilityNotes} />
            </div>
          </section>
          <RouteDetailStickyActions route={route} />
        </div>
      }
      map={
        <MapShell
          className="sticky top-24 min-h-[680px]"
          onSelect={setSelected}
          places={nearbyPlaces}
          route={route}
          selected={selected}
          title={`${route.title} map`}
        />
      }
    />
  );
}
