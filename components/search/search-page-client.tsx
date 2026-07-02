"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SplitMapLayout } from "@/components/layout/split-map-layout";
import { MapShell } from "@/components/map/map-shell";
import type { MapSelection } from "@/components/map/mapTypes";
import { PlaceCard } from "@/components/places/place-card";
import { RouteList } from "@/components/routes/route-list";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { rankRoutes } from "@/lib/route-engine";
import { rankPlaces } from "@/lib/search/place-search";
import type { Place, Route, RouteSearchResult } from "@/lib/types";

const suggestions = [
  "Gothic churches",
  "quiet courtyards",
  "public art downtown",
  "markets",
  "viewpoints",
  "rainy-day places",
  "Old Montreal history"
];

type SearchSort = "best" | "shortest" | "easiest";

export function SearchPageClient({ routes, places }: { routes: Route[]; places: Place[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SearchSort>("best");
  const [selected, setSelected] = useState<MapSelection>(places[0] ? { type: "place", slug: places[0].slug } : null);

  const results = useMemo(() => sortResults(rankRoutes(query, routes), sort), [query, routes, sort]);
  const intent = results[0]?.intent;
  const routeLikeQuery = /\b(route|routes|walk|walks|walking|loop|circuit|itinerary|under|hour|hours|min|minutes|km|kilometers|kilometres|easy|moderate|hard)\b/i.test(query);
  const hasRouteIntent = Boolean(
    query.trim() &&
      (routeLikeQuery ||
        intent?.durationMaxMin ||
        intent?.difficulty ||
        intent?.routeShape)
  );
  const placeResults = useMemo(() => rankPlaces(query, places), [places, query]);
  const displayedResults = hasRouteIntent ? results : [];
  const resultRoutes = displayedResults.map((result) => result.route);
  const resultPlaces = placeResults.map((result) => result.place);
  const mapPlaces = query.trim() ? resultPlaces : places.slice(0, 18);
  const activeSelection =
    selected?.type === "place" && mapPlaces.some((place) => place.slug === selected.slug)
      ? selected
      : selected?.type === "route" && resultRoutes.some((route) => route.slug === selected.slug)
        ? selected
        : mapPlaces[0]
          ? { type: "place" as const, slug: mapPlaces[0].slug }
          : resultRoutes[0]
            ? { type: "route" as const, slug: resultRoutes[0].slug }
            : selected;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get("q");
    if (urlQuery) {
      setQuery(urlQuery);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [query]);

  const content = (
    <div className="space-y-5">
      <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
        <label className="text-label-md text-on-surface" htmlFor="discovery-search">
          Search Montreal places
        </label>
        <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative min-w-0">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              className="h-14 w-full rounded-control border border-outline-variant bg-white pl-10 pr-3 text-body-md text-on-surface"
              id="discovery-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search places, monuments, neighborhoods, or themes"
              type="search"
              value={query}
            />
          </div>
          {hasRouteIntent ? (
            <label className="flex min-h-11 items-center gap-2 rounded-control border border-outline-variant bg-white px-3 text-label-md text-on-surface">
              <SlidersHorizontal aria-hidden="true" size={16} />
              <span className="sr-only">Sort optional route suggestions</span>
              <select aria-label="Sort optional route suggestions" className="bg-transparent" onChange={(event) => setSort(event.target.value as SearchSort)} value={sort}>
                <option value="best">Best match</option>
                <option value="shortest">Shortest route</option>
                <option value="easiest">Easiest route</option>
              </select>
            </label>
          ) : null}
          <Button onClick={() => setQuery("")} variant="ghost">
            Reset
          </Button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
          {suggestions.map((suggestion) => (
            <button className="shrink-0 rounded-full bg-surface-container px-3 py-2 text-label-sm text-on-surface-variant hover:bg-primary hover:text-on-primary" key={suggestion} onClick={() => setQuery(suggestion)} type="button">
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {query.trim() && placeResults.length ? (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-headline-mobile text-on-surface">Best matching places</h2>
            <p className="text-label-sm text-on-surface-variant">{placeResults.length} places</p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {placeResults.map((result) => (
              <PlaceCard
                key={result.place.id}
                matchReasons={result.matchReasons}
                onPreview={() => setSelected({ type: "place", slug: result.place.slug })}
                place={result.place}
                selected={activeSelection?.type === "place" && activeSelection.slug === result.place.slug}
                variant="large"
              />
            ))}
          </div>
        </section>
      ) : null}

      {intent?.explanationChips.length && hasRouteIntent ? (
        <section className="rounded-card border border-outline-variant bg-surface-container-lowest p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-label-md text-on-surface">Optional route matches</h2>
            <p className="text-label-sm text-on-surface-variant">{displayedResults.length} optional routes</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {intent.explanationChips.map((chip) => (
              <button
                aria-label={`Remove ${chip}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-label-sm text-on-primary focus:outline-none focus:ring-2 focus:ring-primary"
                key={chip}
                onClick={() => setQuery((current) => removeChipTerms(current, chip))}
                type="button"
              >
                {chip}
                <X aria-hidden="true" size={14} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {query.trim() && displayedResults.length ? (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-headline-mobile text-on-surface">Optional routes that connect discoveries</h2>
            <p className="text-label-sm text-on-surface-variant">{displayedResults.length} route suggestions</p>
          </div>
          <div className="mt-4">
            <RouteList
              onPreview={(route) => setSelected({ type: "route", slug: route.slug })}
              results={displayedResults}
              selectedSlug={activeSelection?.type === "route" ? activeSelection.slug : undefined}
            />
          </div>
        </section>
      ) : query.trim() && !placeResults.length ? (
        <EmptyState
          title="No places match that search"
          description="Try a broader place type, neighborhood, or theme like Old Montreal, churches, markets, viewpoints, public art, or rainy-day places."
          action={<Chip tone="primary">Try Old Montreal history</Chip>}
        />
      ) : !query.trim() ? (
        <section>
          <h2 className="text-headline-mobile text-on-surface">Featured places to discover</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {places.slice(0, 4).map((place) => (
              <PlaceCard
                key={place.id}
                onPreview={() => setSelected({ type: "place", slug: place.slug })}
                place={place}
                selected={activeSelection?.type === "place" && activeSelection.slug === place.slug}
                variant="large"
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );

  return (
    <SplitMapLayout
      content={content}
      map={
        <MapShell
          className="sticky top-24 min-h-[640px]"
          onSelect={setSelected}
          places={mapPlaces}
          routes={resultRoutes}
          selected={activeSelection}
          title="Discovery search map"
        />
      }
    />
  );
}

function sortResults(results: RouteSearchResult[], sort: SearchSort): RouteSearchResult[] {
  if (sort === "shortest") {
    return [...results].sort((a, b) => a.route.durationMin - b.route.durationMin || b.score - a.score);
  }

  if (sort === "easiest") {
    return [...results].sort((a, b) => difficultyScore(a.route) - difficultyScore(b.route) || b.score - a.score);
  }

  return results;
}

function difficultyScore(route: Route): number {
  return route.difficulty === "easy" ? 0 : route.difficulty === "moderate" ? 1 : 2;
}

function removeChipTerms(query: string, chip: string): string {
  const replacements: Record<string, RegExp[]> = {
    "Quiet mood": [/\bquiet\b/gi],
    "Architecture theme": [/\barchitecture|architectural|buildings\b/gi],
    "Cafe stops included": [/\bcafes?|cafe|coffee\b/gi],
    "History theme": [/\bhistory|historic|historical|heritage\b/gi],
    "Rainy day": [/\brainy?|rain\b/gi],
    "Accessible preference": [/\baccessible|accessibility|step-free|wheelchair|without stairs|no stairs|avoid stairs\b/gi],
    "Scenic route": [/\bscenic|views?|viewpoints?|sunset\b/gi],
    "Scenic mood": [/\bscenic|views?|viewpoints?|sunset\b/gi],
    "Churches included": [/\bchurches?|basilica|cathedral\b/gi],
    "Market or food stops": [/\bmarkets?|food|restaurants?|bakeries|bagel\b/gi],
    "Museums included": [/\bmuseums?|gallery|galleries\b/gi],
    "Little Italy": [/\blittle italy|petite italie|jean-talon\b/gi],
    "Old Montreal": [/\bold montreal|vieux-montreal|place d'armes|old port\b/gi],
    "Downtown": [/\bdowntown|ville-marie\b/gi]
  };

  const durationChip = chip.match(/^Under \d+ min$/);
  const patterns = durationChip ? [/\b(?:under|less than|within)\s+(?:an?\s+)?\d+\s*(?:hour|hr|hours|hrs|minute|min|minutes|mins)\b/gi, /\b\d+\s*(?:minute|min|minutes|mins|hour|hr|hours|hrs)\b/gi, /\bshort|quick\b/gi] : replacements[chip] ?? [];

  return patterns.reduce((next, pattern) => next.replace(pattern, " "), query).replace(/\s+/g, " ").trim();
}
