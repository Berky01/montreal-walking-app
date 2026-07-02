"use client";

import Link from "next/link";
import { Footprints, GitCompare, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MapShell } from "@/components/map/map-shell";
import type { MapSelection } from "@/components/map/mapTypes";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { resolveComparedRoutes } from "@/lib/compare-routes";
import { clearCompareBasket, getCompareRouteSlugs, getUserPreferences, removeCompareRoute } from "@/lib/local-state";
import { estimateDurationForPace, formatDistanceForUnits } from "@/lib/preferences";
import type { Route, UserPreferences } from "@/lib/types";
import { formatDuration, titleCase } from "@/lib/utils/format";
import { getRouteShapeLabel } from "@/lib/visual-system";

export function RouteCompareClient({ routes }: { routes: Route[] }) {
  const [routeSlugs, setRouteSlugs] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [selected, setSelected] = useState<MapSelection>(routes[0] ? { type: "route", slug: routes[0].slug } : null);

  useEffect(() => {
    function refreshState() {
      setRouteSlugs(getCompareRouteSlugs());
      setPreferences(getUserPreferences());
    }

    refreshState();
    window.addEventListener("meaningful-routes-local-state", refreshState);
    window.addEventListener("storage", refreshState);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refreshState);
      window.removeEventListener("storage", refreshState);
    };
  }, []);

  const comparedResult = useMemo(() => resolveComparedRoutes(routes, routeSlugs), [routeSlugs, routes]);
  const comparedRoutes = comparedResult.routes;
  const selectedRoutesCount = comparedResult.usedFallback ? 0 : comparedRoutes.length;
  const isUsingSuggestions = comparedResult.usedFallback;
  const selectedLabel = selectedRoutesCount === 1 ? "1 selected route" : `${selectedRoutesCount} selected routes`;
  const rows = getCompareRows(preferences);
  const activeSelection =
    selected?.type === "route" && comparedRoutes.some((route) => route.slug === selected.slug)
      ? selected
      : comparedRoutes[0]
        ? { type: "route" as const, slug: comparedRoutes[0].slug }
        : selected;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.68fr)]">
        <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone={selectedRoutesCount ? "primary" : "neutral"}>
                  {selectedRoutesCount ? selectedLabel : "Suggested routes"}
                </Chip>
                {preferences ? <Chip>{preferences.units === "imperial" ? "Miles" : "Kilometers"} · {preferences.preferredPace} pace</Chip> : null}
              </div>
              <p className="mt-3 max-w-2xl text-body-md text-on-surface-variant">
                {isUsingSuggestions
                  ? "Select optional route collections from the catalog to compare your own shortlist. For now, these recommended Montreal ways to explore are shown as a starting point."
                  : "This comparison uses the optional routes selected in this browser and updates as the basket changes."}
              </p>
              {comparedResult.missingSlugs.length ? (
                <p className="mt-2 text-label-sm text-on-surface-variant">
                  {comparedResult.missingSlugs.length} saved comparison item could not be found in the current route catalog.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/routes" variant="secondary">
                <GitCompare aria-hidden="true" size={16} />
                Edit basket
              </ButtonLink>
              {selectedRoutesCount ? (
                <Button
                  onClick={() => {
                    clearCompareBasket();
                    setRouteSlugs([]);
                  }}
                  variant="ghost"
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <MapShell
          className="min-h-[320px]"
          onSelect={setSelected}
          routes={comparedRoutes}
          selected={activeSelection}
          title="Compared optional routes map"
        />
      </div>

      <div className="sr-only" aria-live="polite">
        {activeSelection?.type === "route" ? `Selected ${activeSelection.slug}` : "No route selected"}
      </div>

      <div className="overflow-x-auto rounded-card border border-outline-variant bg-surface-container-lowest shadow-card">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container">
              <th className="w-44 p-4 text-label-md text-on-surface" scope="col">Metric</th>
              {comparedRoutes.map((route) => (
                <th className="min-w-56 p-4 align-top text-label-md text-on-surface" key={route.id} scope="col">
                  <Link className="rounded-control hover:text-primary" href={`/routes/${route.slug}`}>
                    {route.title}
                  </Link>
                  <p className="mt-1 text-label-sm font-normal text-on-surface-variant">{route.area}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-outline-variant last:border-b-0" key={row.label}>
                <th className="p-4 align-top text-label-md text-on-surface" scope="row">{row.label}</th>
                {comparedRoutes.map((route) => (
                  <td className="p-4 align-top text-body-md text-on-surface-variant" key={route.id}>
                    {row.value(route)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th className="p-4 align-top text-label-md text-on-surface" scope="row">Actions</th>
              {comparedRoutes.map((route) => (
                <td className="p-4 align-top" key={route.id}>
                  <div className="grid gap-2">
                    <ButtonLink className="w-full" href={`/routes/${route.slug}`}>
                      View places
                    </ButtonLink>
                    <ButtonLink className="w-full" href={`/routes/${route.slug}/live`} variant="secondary">
                      Optional walk
                      <Footprints aria-hidden="true" size={16} />
                    </ButtonLink>
                    {!isUsingSuggestions ? (
                      <Button
                        className="w-full"
                        onClick={() => setRouteSlugs(removeCompareRoute(route.slug))}
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

type CompareRow = {
  label: string;
  value: (route: Route) => ReactNode;
};

function getCompareRows(preferences: UserPreferences | null): CompareRow[] {
  return [
    {
      label: "Distance",
      value: (route) => (preferences ? formatDistanceForUnits(route.distanceKm, preferences.units) : `${route.distanceKm.toFixed(1)} km`)
    },
    {
      label: "Est. time",
      value: (route) => formatDuration(preferences ? estimateDurationForPace(route.durationMin, preferences.preferredPace) : route.durationMin)
    },
    { label: "Places", value: (route) => `${route.stops.length} places` },
    { label: "Difficulty", value: (route) => titleCase(route.difficulty) },
    { label: "Optional walk shape", value: (route) => getRouteShapeLabel(route.routeType) },
    { label: "Best for", value: (route) => route.bestFor.slice(0, 3).join(", ") },
    { label: "Tags", value: (route) => route.tags.slice(0, 5).join(", ") },
    { label: "Neighborhoods", value: (route) => route.area },
    { label: "Weather fit", value: weatherFitLabel },
    { label: "Accessibility", value: accessibilityLabel },
    { label: "Safety", value: (route) => route.safetyNotes[0]?.label ?? "Standard city exploring awareness" }
  ];
}

function weatherFitLabel(route: Route): string {
  const tags = new Set([...route.tags, ...route.interests, ...route.moodTags].map((tag) => tag.toLowerCase()));

  if (tags.has("rainy day") || tags.has("museums") || tags.has("markets") || tags.has("cafes")) {
    return "Works in light rain with indoor or covered pauses";
  }

  if (tags.has("waterfront") || tags.has("scenic") || tags.has("viewpoints")) {
    return "Best in clear weather for views and exposed sections";
  }

  return `Best around ${route.bestTime.toLowerCase()}`;
}

function accessibilityLabel(route: Route): string {
  const barriers = route.accessibilityNotes.filter((note) => note.severity === "barrier");
  if (!barriers.length) {
    return "No major barriers flagged";
  }

  return barriers.map((note) => note.label).join(", ");
}
