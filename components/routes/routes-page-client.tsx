"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SplitMapLayout } from "@/components/layout/split-map-layout";
import { MapShell } from "@/components/map/map-shell";
import type { MapSelection } from "@/components/map/mapTypes";
import { EmptyState } from "@/components/ui/empty-state";
import { Chip } from "@/components/ui/chip";
import { RouteCard } from "@/components/routes/route-card";
import { getCompareRouteSlugs, getUserPreferences } from "@/lib/local-state";
import {
  filterAndSortRoutes,
  getRouteResultMapPlaces,
  getSyncedRouteMapSelection,
  parseRouteFilterParams,
  type RouteResultFilters,
  type RouteSort
} from "@/lib/route-filters";
import type { Place, Route, UserPreferences } from "@/lib/types";

const interestOrder = [
  "history",
  "architecture",
  "cafes",
  "scenic",
  "nature",
  "waterfront",
  "quiet",
  "churches",
  "museums",
  "public art",
  "markets",
  "family-friendly"
];
const durations = [
  { label: "Any time", value: 999 },
  { label: "Under 45 min", value: 45 },
  { label: "Under 1 hr", value: 60 },
  { label: "Under 90 min", value: 90 }
];
const difficulties: Array<{ label: string; value: RouteResultFilters["difficulty"] }> = [
  { label: "Any difficulty", value: "all" },
  { label: "Easy", value: "easy" },
  { label: "Moderate", value: "moderate" }
];
const routeTypes: Array<{ label: string; value: RouteResultFilters["routeType"] }> = [
  { label: "Any shape", value: "all" },
  { label: "Loop", value: "loop" },
  { label: "One-way", value: "one_way" },
  { label: "Out and back", value: "out_and_back" }
];
const sortOptions: Array<{ label: string; value: RouteSort }> = [
  { label: "Recommended", value: "recommended" },
  { label: "Shortest", value: "shortest" },
  { label: "Longest", value: "longest" },
  { label: "Easiest", value: "easiest" },
  { label: "Most scenic", value: "scenic" }
];

const defaultFilters: RouteResultFilters = {
  duration: 999,
  interest: "all",
  difficulty: "all",
  routeType: "all",
  accessible: false,
  neighborhood: "all",
  weatherSuitability: "all",
  sort: "recommended"
};

export function RoutesPageClient({ routes, places }: { routes: Route[]; places: Place[] }) {
  const [filters, setFilters] = useState<RouteResultFilters>(defaultFilters);
  const [selected, setSelected] = useState<MapSelection>(routes[0] ? { type: "route", slug: routes[0].slug } : null);
  const [compareCount, setCompareCount] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences | undefined>();
  const neighborhoods = useMemo(() => ["all", ...Array.from(new Set(routes.map((route) => route.area))).sort()], [routes]);
  const interests = useMemo(() => {
    const routeSignals = new Set(routes.flatMap((route) => [...route.tags, ...route.interests, ...route.moodTags]));
    const ordered = interestOrder.filter((interest) => routeSignals.has(interest));
    const extra = Array.from(routeSignals)
      .filter((interest) => !interestOrder.includes(interest))
      .sort();

    return [...ordered, ...extra];
  }, [routes]);

  useEffect(() => {
    setFilters(parseRouteFilterParams(new URLSearchParams(window.location.search)));
  }, []);

  useEffect(() => {
    function refreshCompareCount() {
      setCompareCount(getCompareRouteSlugs().length);
    }

    refreshCompareCount();
    window.addEventListener("meaningful-routes-local-state", refreshCompareCount);
    window.addEventListener("storage", refreshCompareCount);
    return () => {
      window.removeEventListener("meaningful-routes-local-state", refreshCompareCount);
      window.removeEventListener("storage", refreshCompareCount);
    };
  }, []);

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
    const params = new URLSearchParams();

    if (filters.duration !== defaultFilters.duration) params.set("duration", String(filters.duration));
    if (filters.interest !== defaultFilters.interest) params.set("interest", filters.interest);
    if (filters.difficulty !== defaultFilters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.routeType !== defaultFilters.routeType) params.set("type", filters.routeType);
    if (filters.accessible) params.set("accessible", "true");
    if (filters.neighborhood !== defaultFilters.neighborhood) params.set("neighborhood", filters.neighborhood);
    if (filters.weatherSuitability !== defaultFilters.weatherSuitability) params.set("weather", filters.weatherSuitability);
    if (filters.sort !== defaultFilters.sort) params.set("sort", filters.sort);

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filters]);

  const filteredRoutes = useMemo(() => filterAndSortRoutes(routes, filters, preferences), [filters, preferences, routes]);
  const activeFilterLabels = [
    filters.duration !== defaultFilters.duration ? `Under ${filters.duration} min` : null,
    filters.interest !== "all" ? filters.interest : null,
    filters.difficulty !== "all" ? filters.difficulty : null,
    filters.routeType !== "all" ? filters.routeType.replace("_", " ") : null,
    filters.accessible ? "accessible" : null,
    filters.neighborhood !== "all" ? filters.neighborhood : null,
    filters.weatherSuitability === "rainy" ? "rainy-day" : null
  ].filter(Boolean) as string[];

  const mapPlaces = useMemo(() => getRouteResultMapPlaces(filteredRoutes, places), [filteredRoutes, places]);
  const activeSelection = getSyncedRouteMapSelection({
    selected,
    routes: filteredRoutes,
    places: mapPlaces
  });

  const content = (
    <div className="space-y-5">
      <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <fieldset>
            <legend className="text-label-md text-on-surface">Time</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {durations.map((option) => (
                <button
                  className={`min-h-11 rounded-full px-3 py-2 text-label-sm ${filters.duration === option.value ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
                  key={option.label}
                  onClick={() => setFilters((current) => ({ ...current, duration: option.value }))}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-label-md text-on-surface">Interest</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className={`min-h-11 rounded-full px-3 py-2 text-label-sm ${filters.interest === "all" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
                onClick={() => setFilters((current) => ({ ...current, interest: "all" }))}
                type="button"
              >
                All
              </button>
              {interests.map((item) => (
                <button
                  className={`min-h-11 rounded-full px-3 py-2 text-label-sm ${filters.interest === item ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
                  key={item}
                  onClick={() => setFilters((current) => ({ ...current, interest: item }))}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="mt-4 grid gap-4 border-t border-outline-variant pt-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-label-md text-on-surface">
            Difficulty
            <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" onChange={(event) => setFilters((current) => ({ ...current, difficulty: event.target.value as RouteResultFilters["difficulty"] }))} value={filters.difficulty}>
              {difficulties.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-label-md text-on-surface">
            Route type
            <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" onChange={(event) => setFilters((current) => ({ ...current, routeType: event.target.value as RouteResultFilters["routeType"] }))} value={filters.routeType}>
              {routeTypes.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-label-md text-on-surface">
            Sort
            <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as RouteSort }))} value={filters.sort}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-label-md text-on-surface">
            Neighborhood
            <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" onChange={(event) => setFilters((current) => ({ ...current, neighborhood: event.target.value }))} value={filters.neighborhood}>
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>{neighborhood === "all" ? "All neighborhoods" : neighborhood}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-label-md text-on-surface">
            Weather
            <select className="h-11 rounded-control border border-outline-variant bg-white px-3 text-body-md" onChange={(event) => setFilters((current) => ({ ...current, weatherSuitability: event.target.value as RouteResultFilters["weatherSuitability"] }))} value={filters.weatherSuitability}>
              <option value="all">Any weather</option>
              <option value="rainy">Rainy-day friendly</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4">
          <label className="flex min-h-11 items-center gap-2 text-label-md text-on-surface">
            <input checked={filters.accessible} onChange={(event) => setFilters((current) => ({ ...current, accessible: event.target.checked }))} type="checkbox" />
            Avoid major accessibility barriers
          </label>
          <p className="text-label-md text-on-surface">{filteredRoutes.length} optional routes</p>
          <button className="min-h-11 text-label-md text-primary" onClick={() => setFilters(defaultFilters)} type="button">
            Reset filters
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeFilterLabels.length ? (
            activeFilterLabels.map((label) => <Chip key={label} tone="primary">{label}</Chip>)
          ) : (
          <Chip>All optional-route filters</Chip>
          )}
        </div>
      </div>

      {filteredRoutes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRoutes.map((route) => (
            <RouteCard
              key={route.id}
              onPreview={() => setSelected({ type: "route", slug: route.slug })}
              route={route}
              selected={activeSelection?.type === "route" && activeSelection.slug === route.slug}
              showCompare
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No routes match those filters"
          description="Try a longer time window or a broader interest. Routes are optional ways to connect the Montreal places catalog."
          action={<Chip tone="primary">Optional routes</Chip>}
        />
      )}
      <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-label-md text-on-surface">Compare basket</h2>
          <Chip tone={compareCount ? "primary" : "neutral"}>
            {compareCount ? `${compareCount} selected ${compareCount === 1 ? "route" : "routes"}` : "No selected routes"}
          </Chip>
        </div>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Distance, time, places, route shape, accessibility, and weather fit side by side for shortlist planning.
        </p>
        <Link className="mt-3 inline-flex text-label-md font-semibold text-primary" href="/routes/compare">
          Open optional-route comparison
        </Link>
      </div>
    </div>
  );

  return (
    <SplitMapLayout
      content={content}
      map={
        <MapShell
          className="sticky top-24 min-h-[680px]"
          onSelect={setSelected}
          places={mapPlaces}
          routes={filteredRoutes}
          selected={activeSelection}
          title="Montreal optional routes map"
        />
      }
    />
  );
}
