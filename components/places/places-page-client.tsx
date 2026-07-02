"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SplitMapLayout } from "@/components/layout/split-map-layout";
import { MapShell } from "@/components/map/map-shell";
import type { MapSelection } from "@/components/map/mapTypes";
import { EmptyState } from "@/components/ui/empty-state";
import { filterPlaces, parsePlaceFilterParams, type PlaceResultFilters } from "@/lib/place-filters";
import type { Place } from "@/lib/types";
import { getPlaceCategoryLabel } from "@/lib/visual-system";
import { PlaceCard } from "./place-card";

const categoryOrder: Place["category"][] = [
  "monument",
  "square",
  "public_square",
  "church",
  "museum",
  "viewpoint",
  "hidden_gem",
  "cafe",
  "restaurant",
  "bar",
  "nightlife",
  "park",
  "market",
  "shopping",
  "music_venue",
  "art_culture",
  "outdoor_activity",
  "family_activity",
  "attraction",
  "historic_building",
  "heritage_building",
  "public_art",
  "waterfront",
  "campus",
  "street"
];
const defaultFilters: PlaceResultFilters = {
  category: "all",
  neighborhood: "all",
  tag: "all",
  query: ""
};

export function PlacesPageClient({ places }: { places: Place[] }) {
  const [filter, setFilter] = useState<PlaceResultFilters>(defaultFilters);
  const [selected, setSelected] = useState<MapSelection>(places[0] ? { type: "place", slug: places[0].slug } : null);

  const neighborhoods = useMemo(() => ["all", ...Array.from(new Set(places.map((place) => place.area))).sort()], [places]);
  const tags = useMemo(() => ["all", ...Array.from(new Set(places.flatMap((place) => place.tags))).sort()], [places]);
  const categoryFilters = useMemo(() => {
    const categories = new Set(places.map((place) => place.category));
    const ordered = categoryOrder.filter((category) => categories.has(category));
    const extra = Array.from(categories)
      .filter((category) => !categoryOrder.includes(category))
      .sort();

    return ["all", ...ordered, ...extra] as Array<Place["category"] | "all">;
  }, [places]);
  const filteredPlaces = useMemo(() => filterPlaces(places, filter), [filter, places]);

  useEffect(() => {
    setFilter(parsePlaceFilterParams(new URLSearchParams(window.location.search)));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filter.category !== defaultFilters.category) params.set("category", filter.category);
    if (filter.neighborhood !== defaultFilters.neighborhood) params.set("neighborhood", filter.neighborhood);
    if (filter.tag !== defaultFilters.tag) params.set("tag", filter.tag);
    if (filter.query) params.set("q", filter.query);

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [filter]);

  const activeSelection =
    selected?.type === "place" && filteredPlaces.some((place) => place.slug === selected.slug)
      ? selected
      : filteredPlaces[0]
        ? { type: "place" as const, slug: filteredPlaces[0].slug }
        : selected;

  const content = (
    <div className="space-y-5">
      <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="grid gap-2 text-label-md text-on-surface">
            Find places
            <span className="relative">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input
                aria-label="Search places"
                className="h-12 w-full rounded-control border border-outline-variant bg-white pl-10 pr-3 text-body-md"
                onChange={(event) => setFilter((current) => ({ ...current, query: event.target.value }))}
                type="search"
                value={filter.query}
              />
            </span>
          </label>
          <label className="grid gap-2 text-label-md text-on-surface">
            Neighborhood
            <select className="h-12 rounded-control border border-outline-variant bg-white px-3 text-body-md" onChange={(event) => setFilter((current) => ({ ...current, neighborhood: event.target.value }))} value={filter.neighborhood}>
              {neighborhoods.map((item) => (
                <option key={item} value={item}>{item === "all" ? "All neighborhoods" : item}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
          {categoryFilters.map((item) => (
            <button
              className={`shrink-0 rounded-full px-3 py-2 text-label-sm ${filter.category === item ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}
              key={item}
              onClick={() => setFilter((current) => ({ ...current, category: item }))}
              type="button"
            >
              {item === "all" ? "All" : getPlaceCategoryLabel(item as Place["category"])}
            </button>
          ))}
        </div>
        <label className="mt-4 grid gap-2 text-label-md text-on-surface">
          Tag
          <select className="h-12 rounded-control border border-outline-variant bg-white px-3 text-body-md" onChange={(event) => setFilter((current) => ({ ...current, tag: event.target.value }))} value={filter.tag}>
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag === "all" ? "All tags" : tag}</option>
            ))}
          </select>
        </label>
        <p className="mt-3 text-label-md text-on-surface">{filteredPlaces.length} Montreal places</p>
      </div>

      {filteredPlaces.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              onPreview={() => setSelected({ type: "place", slug: place.slug })}
              place={place}
              selected={activeSelection?.type === "place" && activeSelection.slug === place.slug}
              variant="large"
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No places match those filters" description="Use a broader category or browse all Montreal places." />
      )}
    </div>
  );

  return (
    <SplitMapLayout
      content={content}
      map={
        <MapShell
          className="sticky top-24 min-h-[680px]"
          onSelect={setSelected}
          places={filteredPlaces}
          selected={activeSelection}
          title="Montreal discovery map"
        />
      }
    />
  );
}
