"use client";

import Link from "next/link";
import { Clock, Footprints, GitCompare, MapPin, Route as RouteIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SaveButton } from "@/components/library/save-button";
import { RouteCover } from "@/components/media/RouteCover";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { getUserPreferences, isRouteInCompareBasket, setCompareRouteSelected } from "@/lib/local-state";
import { estimateDurationForPace, formatDistanceForUnits } from "@/lib/preferences";
import type { Route, UserPreferences } from "@/lib/types";
import { getRouteMoodLine, getRouteShapeLabel } from "@/lib/visual-system";
import { formatDistance, formatDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function RouteCard({
  route,
  matchReasons,
  selected = false,
  onPreview,
  variant = "default",
  showCompare = false
}: {
  route: Route;
  matchReasons?: string[];
  selected?: boolean;
  onPreview?: (route: Route) => void;
  variant?: "default" | "large" | "compact" | "saved" | "related";
  showCompare?: boolean;
}) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [compareSelected, setCompareSelected] = useState(false);

  useEffect(() => {
    function refreshPreferences() {
      setPreferences(getUserPreferences());
    }

    refreshPreferences();
    window.addEventListener("meaningful-routes-local-state", refreshPreferences);
    window.addEventListener("storage", refreshPreferences);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refreshPreferences);
      window.removeEventListener("storage", refreshPreferences);
    };
  }, []);

  useEffect(() => {
    if (!showCompare) {
      return;
    }

    function refreshCompareState() {
      setCompareSelected(isRouteInCompareBasket(route.slug));
    }

    refreshCompareState();
    window.addEventListener("meaningful-routes-local-state", refreshCompareState);
    window.addEventListener("storage", refreshCompareState);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refreshCompareState);
      window.removeEventListener("storage", refreshCompareState);
    };
  }, [route.slug, showCompare]);

  const distanceLabel = preferences ? formatDistanceForUnits(route.distanceKm, preferences.units) : formatDistance(route.distanceKm);
  const durationLabel = formatDuration(preferences ? estimateDurationForPace(route.durationMin, preferences.preferredPace) : route.durationMin);
  const compact = variant === "compact" || variant === "related";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-card border bg-surface-container-lowest shadow-card transition-shadow hover:shadow-floating",
        selected ? "border-primary" : "border-outline-variant/70"
      )}
      onClickCapture={(event) => {
        if (isInteractiveTarget(event.target)) {
          return;
        }
        onPreview?.(route);
      }}
      onFocusCapture={() => onPreview?.(route)}
      onMouseEnter={() => onPreview?.(route)}
    >
      <div className={cn("relative bg-surface-container-high", variant === "large" ? "h-48" : compact ? "h-28" : "h-36")}>
        <Link aria-label={`Open ${route.title}`} className="absolute inset-0" href={`/routes/${route.slug}`}>
          <RouteCover route={route} />
        </Link>
        <SaveButton className="absolute right-3 top-3 z-10" compact itemId={route.id} itemSlug={route.slug} itemTitle={route.title} itemType="route" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link className="rounded-control hover:text-primary" href={`/routes/${route.slug}`}>
            <h3 className="text-body-lg font-semibold text-on-surface">{route.title}</h3>
          </Link>
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-label-sm text-primary">{route.difficulty}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-body-md text-on-surface-variant">{route.description}</p>
        {!compact ? <p className="mt-3 text-label-sm text-on-surface-variant">{getRouteMoodLine(route)}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-2 text-label-sm text-on-surface-variant sm:grid-cols-4">
          <span className="flex items-center gap-1">
            <RouteIcon aria-hidden="true" size={15} />
            {distanceLabel}
          </span>
          <span className="flex items-center gap-1">
            <Clock aria-hidden="true" size={15} />
            {durationLabel}
          </span>
          <span className="flex items-center gap-1">
            <MapPin aria-hidden="true" size={15} />
            {route.stops.length} stops
          </span>
          <span className="flex items-center gap-1">
            <Footprints aria-hidden="true" size={15} />
            {getRouteShapeLabel(route.routeType)}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {route.tags.slice(0, compact ? 3 : 5).map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
        {matchReasons?.length ? (
          <div className="mt-4 border-t border-outline-variant pt-3">
            <p className="text-label-sm text-primary">{matchReasons.slice(0, 2).join(" · ")}</p>
          </div>
        ) : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <ButtonLink href={`/routes/${route.slug}`}>
            View places
          </ButtonLink>
          <ButtonLink href={`/routes/${route.slug}/live`} variant="secondary">
            Optional walk
            <Footprints aria-hidden="true" size={16} />
          </ButtonLink>
        </div>
        {showCompare ? (
          <label className={cn(
            "mt-3 flex min-h-10 items-center gap-2 rounded-control border px-3 text-label-sm",
            compareSelected ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"
          )}>
            <input
              aria-label={`Compare ${route.title}`}
              checked={compareSelected}
              onChange={(event) => {
                event.stopPropagation();
                setCompareSelected(setCompareRouteSelected(route, event.currentTarget.checked).selected);
              }}
              onClick={(event) => event.stopPropagation()}
              type="checkbox"
            />
            <GitCompare aria-hidden="true" size={15} />
            {compareSelected ? "In compare" : "Add to compare"}
          </label>
        ) : null}
      </div>
    </article>
  );
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("a,button,input,label,select,textarea"));
}
