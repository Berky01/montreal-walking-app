import type { Place } from "@/lib/types";

export type PlaceResultFilters = {
  category: Place["category"] | "all";
  neighborhood: string;
  tag: string;
  query: string;
};

const defaultFilters: PlaceResultFilters = {
  category: "all",
  neighborhood: "all",
  tag: "all",
  query: ""
};

export function parsePlaceFilterParams(params: URLSearchParams): PlaceResultFilters {
  return {
    category: (params.get("category") as PlaceResultFilters["category"] | null) || defaultFilters.category,
    neighborhood: params.get("neighborhood") || defaultFilters.neighborhood,
    tag: params.get("tag") || defaultFilters.tag,
    query: params.get("q")?.trim() || defaultFilters.query
  };
}

export function filterPlaces(places: Place[], filters: PlaceResultFilters): Place[] {
  const normalizedQuery = normalize(filters.query);
  const normalizedTag = normalize(filters.tag);
  const normalizedNeighborhood = normalize(filters.neighborhood);

  return places.filter((place) => {
    const matchesCategory = filters.category === "all" || place.category === filters.category;
    const matchesNeighborhood = filters.neighborhood === "all" || normalize(place.area) === normalizedNeighborhood;
    const matchesTag = filters.tag === "all" || place.tags.some((tag) => normalize(tag) === normalizedTag);
    const matchesQuery =
      !normalizedQuery ||
      [
        place.name,
        place.area,
        place.shortDescription,
        place.story,
        place.whyItMatters,
        place.category,
        place.periodOrStyle ?? "",
        ...place.tags,
        ...place.whatToNotice,
        ...place.practicalInfo
      ]
        .map(normalize)
        .some((value) => value.includes(normalizedQuery));

    return matchesCategory && matchesNeighborhood && matchesTag && matchesQuery;
  });
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
