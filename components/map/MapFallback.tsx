"use client";

import { LocateFixed, Minus, Plus, Rows3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildMapFitPoints, buildMapMarkers, getActivePlace, getActiveRoute, type MapMarkerModel } from "@/lib/map/markers";
import { computeCoordinateBounds, projectCoordinate, zoomBounds } from "@/lib/map/projection";
import type { Place, Route } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { MapMarker } from "./MapMarker";
import { MapPreviewCard } from "./MapPreviewCard";
import { RouteLine } from "./RouteLine";
import type { MapSelection, MeaningfulMapProps } from "./mapTypes";

export function MapFallback({
  route,
  routes,
  places = [],
  className,
  id,
  title = "Montreal route map",
  selected,
  onSelect,
  currentStopId,
  fallbackReason,
  nextStopId,
  visitedStopIds = [],
  skippedStopIds = []
}: MeaningfulMapProps) {
  const [zoom, setZoom] = useState(1);
  const routeList = useMemo(() => (route ? [route] : routes ?? []), [route, routes]);
  const controlledSelection = selected !== undefined && Boolean(onSelect);
  const [internalSelection, setInternalSelection] = useState<MapSelection>(selected ?? null);
  const activeSelection = (controlledSelection ? selected : internalSelection) ?? defaultSelection(routeList, places);
  const activeRoute = getActiveRoute(routeList, activeSelection) ?? routeList[0];
  const activePlace = getActivePlace(places, activeSelection);
  const baseBounds = useMemo(() => {
    return computeCoordinateBounds(buildMapFitPoints({ route, routes, places, selected: activeSelection }));
  }, [activeSelection, places, route, routes]);
  const bounds = useMemo(() => zoomBounds(baseBounds, zoom), [baseBounds, zoom]);
  const markers = useMemo(
    () =>
      buildMapMarkers({
        route,
        routes,
        places,
        selected: activeSelection,
        currentStopId,
        nextStopId,
        visitedStopIds,
        skippedStopIds
      }),
    [activeSelection, currentStopId, nextStopId, places, route, routes, skippedStopIds, visitedStopIds]
  );

  useEffect(() => {
    if (controlledSelection) {
      setInternalSelection(selected ?? null);
    }
  }, [controlledSelection, selected]);

  function handleSelect(selection: MapSelection) {
    if (!controlledSelection) {
      setInternalSelection(selection);
    }

    onSelect?.(selection);
  }

  return (
    <section
      aria-label={title}
      className={cn(
        "relative min-h-[320px] overflow-hidden rounded-card border border-outline-variant bg-surface-container-high shadow-card",
        className
      )}
      data-map-shell="true"
      id={id}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(232,237,231,0.94)),repeating-linear-gradient(45deg,rgba(114,121,110,0.14)_0,rgba(114,121,110,0.14)_1px,transparent_1px,transparent_32px),repeating-linear-gradient(-35deg,rgba(63,98,126,0.12)_0,rgba(63,98,126,0.12)_1px,transparent_1px,transparent_40px)]" />
      <svg aria-hidden="true" className="absolute inset-0 z-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M-8 68 C15 55 33 63 52 54 S84 35 108 44 L108 108 L-8 108 Z" fill="rgba(63,98,126,0.13)" />
        <path d="M2 72 C22 58 36 67 54 58 S86 40 102 48" fill="none" stroke="rgba(63,98,126,0.36)" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M10 18 L28 12 L42 20 L62 10 L84 18" fill="none" stroke="rgba(21,66,18,0.14)" strokeLinecap="round" strokeWidth="1.4" />
        <path d="M8 36 L32 30 L46 40 L70 28 L94 36" fill="none" stroke="rgba(21,66,18,0.12)" strokeLinecap="round" strokeWidth="1.4" />
        <path d="M16 84 L42 76 L58 84 L86 72" fill="none" stroke="rgba(21,66,18,0.12)" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
      <svg aria-hidden="true" className="absolute inset-0 z-10 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {routeList.slice(0, 10).map((item) => (
          <RouteLine
            key={item.id}
            points={item.geometry.coordinates.map((point) => projectCoordinate(point, bounds))}
            selected={activeRoute?.slug === item.slug}
          />
        ))}
      </svg>
      {markers.map((marker) => {
        const point = projectCoordinate(marker.coordinates, bounds);

        return (
          <MapMarker
            key={marker.id}
            ariaLabel={marker.ariaLabel}
            label={marker.label}
            onSelect={() => {
              if (marker.selection) {
                handleSelect(marker.selection);
              }
            }}
            selected={isSelectedMarker(marker, activeSelection)}
            state={marker.state}
            title={marker.title}
            x={point.x}
            y={point.y}
          />
        );
      })}
      <div className="absolute left-4 top-4 z-30 rounded-control bg-surface-container-lowest px-3 py-2 text-label-sm text-on-surface shadow-card">
        {activeSelection?.type === "route" ? "Route overview" : "Discovery map"} · Montreal
      </div>
      {fallbackReason ? (
        <div className="absolute left-4 top-16 z-30 max-w-[min(26rem,calc(100%-8rem))] rounded-control bg-surface-container-lowest/95 px-3 py-2 text-label-sm text-on-surface-variant shadow-card backdrop-blur">
          {fallbackReason}
        </div>
      ) : null}
      <div className={cn("absolute left-4 z-30 hidden rounded-control bg-surface-container-lowest/95 p-3 text-label-sm text-on-surface shadow-card backdrop-blur sm:block", fallbackReason ? "top-28" : "top-16")}>
        <div className="flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-primary" />Route line</div>
        <div className="mt-2 flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-tertiary" />Selected</div>
        <div className="mt-2 flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-secondary" />Next stop</div>
      </div>
      <div className="absolute right-4 top-4 z-30 grid gap-2">
        {[
          { Icon: Plus, label: "Zoom in", onClick: () => setZoom((value) => Math.min(2.2, Number((value + 0.2).toFixed(1)))) },
          { Icon: Minus, label: "Zoom out", onClick: () => setZoom((value) => Math.max(1, Number((value - 0.2).toFixed(1)))) },
          { Icon: LocateFixed, label: "Recenter route", onClick: () => setZoom(1) },
          { Icon: Rows3, label: "Show all stops", onClick: () => setZoom(1) }
        ].map(({ Icon, label, onClick }) => (
          <button
            aria-label={label}
            className="flex h-11 w-11 items-center justify-center rounded-control bg-surface-container-lowest text-on-surface shadow-card"
            key={label}
            onClick={onClick}
            type="button"
          >
            <Icon aria-hidden="true" size={16} />
          </button>
        ))}
      </div>
      <MapPreviewCard fallbackRoute={activeRoute} place={activePlace} route={activeRoute} selected={activeSelection} />
    </section>
  );
}

function defaultSelection(routes: Route[], places: Place[]): MapSelection {
  if (routes[0]) {
    return { type: "route", slug: routes[0].slug };
  }

  if (places[0]) {
    return { type: "place", slug: places[0].slug };
  }

  return null;
}

function isSelectedMarker(marker: MapMarkerModel, selected: MapSelection): boolean {
  return Boolean(marker.selection && selected && marker.selection.type === selected.type && marker.selection.slug === selected.slug);
}
