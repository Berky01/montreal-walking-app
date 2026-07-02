import { places as fallbackPlaces } from "@/lib/mock-data/places";
import type { Place, Route, UserPreferences } from "@/lib/types";

export type RouteSort = "recommended" | "shortest" | "longest" | "easiest" | "scenic";
export type WeatherSuitability = "all" | "rainy";

export type RouteResultFilters = {
  duration: number;
  interest: string;
  difficulty: Route["difficulty"] | "all";
  routeType: Route["routeType"] | "all";
  accessible: boolean;
  neighborhood: string;
  weatherSuitability: WeatherSuitability;
  sort: RouteSort;
};

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

export function parseRouteFilterParams(params: URLSearchParams): RouteResultFilters {
  const duration = Number(params.get("duration"));
  const difficulty = params.get("difficulty");
  const routeType = params.get("type");
  const sort = params.get("sort");
  const weather = params.get("weather");

  return {
    duration: Number.isFinite(duration) && duration > 0 ? duration : defaultFilters.duration,
    interest: params.get("interest") || defaultFilters.interest,
    difficulty: difficulty === "easy" || difficulty === "moderate" || difficulty === "hard" ? difficulty : "all",
    routeType: routeType === "loop" || routeType === "one_way" || routeType === "out_and_back" ? routeType : "all",
    accessible: params.get("accessible") === "true",
    neighborhood: params.get("neighborhood") || defaultFilters.neighborhood,
    weatherSuitability: weather === "rainy" ? "rainy" : "all",
    sort: sort === "shortest" || sort === "longest" || sort === "easiest" || sort === "scenic" ? sort : "recommended"
  };
}

export function filterAndSortRoutes(routes: Route[], filters: RouteResultFilters, preferences?: UserPreferences): Route[] {
  const filtered = routes.filter((route) => {
    const matchesDuration = route.durationMin <= filters.duration;
    const matchesInterest =
      filters.interest === "all" ||
      route.tags.includes(filters.interest) ||
      route.interests.includes(filters.interest) ||
      route.moodTags.includes(filters.interest);
    const matchesDifficulty = filters.difficulty === "all" || route.difficulty === filters.difficulty;
    const matchesType = filters.routeType === "all" || route.routeType === filters.routeType;
    const matchesAccessible = !filters.accessible || !route.accessibilityNotes.some((note) => note.severity === "barrier");
    const matchesNeighborhood = filters.neighborhood === "all" || normalize(route.area).includes(normalize(filters.neighborhood));
    const matchesWeather = filters.weatherSuitability === "all" || isRainyDaySuitable(route);

    return matchesDuration && matchesInterest && matchesDifficulty && matchesType && matchesAccessible && matchesNeighborhood && matchesWeather;
  });

  return [...filtered].sort((a, b) => compareRoutes(a, b, filters.sort, preferences));
}

export function getRouteResultMapPlaces(routes: Route[], places: Place[] = fallbackPlaces): Place[] {
  const stopPlaceIds = new Set(routes.flatMap((route) => route.stops.map((stop) => stop.placeId)));

  return places.filter((place) => stopPlaceIds.has(place.id));
}

export function getSyncedRouteMapSelection({
  selected,
  routes,
  places
}: {
  selected: { type: "route"; slug: string } | { type: "place"; slug: string } | null;
  routes: Route[];
  places: Place[];
}): { type: "route"; slug: string } | { type: "place"; slug: string } | null {
  if (selected?.type === "route" && routes.some((route) => route.slug === selected.slug)) {
    return selected;
  }

  if (selected?.type === "place" && places.some((place) => place.slug === selected.slug)) {
    return selected;
  }

  if (routes[0]) {
    return { type: "route", slug: routes[0].slug };
  }

  if (places[0]) {
    return { type: "place", slug: places[0].slug };
  }

  return null;
}

function compareRoutes(a: Route, b: Route, sort: RouteSort, preferences?: UserPreferences): number {
  if (sort === "shortest") {
    return a.distanceKm - b.distanceKm || a.durationMin - b.durationMin;
  }

  if (sort === "longest") {
    return b.distanceKm - a.distanceKm || b.durationMin - a.durationMin;
  }

  if (sort === "easiest") {
    return difficultyScore(a) - difficultyScore(b) || a.durationMin - b.durationMin;
  }

  if (sort === "scenic") {
    return scenicScore(b) - scenicScore(a) || a.durationMin - b.durationMin;
  }

  return preferenceScore(b, preferences) - preferenceScore(a, preferences) || b.qaScore - a.qaScore || a.durationMin - b.durationMin;
}

function difficultyScore(route: Route): number {
  return route.difficulty === "easy" ? 0 : route.difficulty === "moderate" ? 1 : 2;
}

function scenicScore(route: Route): number {
  return [...route.tags, ...route.interests, ...route.moodTags].filter((tag) => tag === "scenic" || tag === "viewpoints" || tag === "waterfront").length;
}

function isRainyDaySuitable(route: Route): boolean {
  return [...route.tags, ...route.interests, ...route.moodTags].some((tag) => ["museums", "cafes", "markets", "restaurants", "shopping", "rainy day"].includes(tag));
}

function preferenceScore(route: Route, preferences?: UserPreferences): number {
  if (!preferences) {
    return 0;
  }

  const routeSignals = [
    ...route.tags,
    ...route.interests,
    ...route.moodTags,
    ...route.bestFor.map((item) => item.toLowerCase())
  ].map(normalize);
  const routeSignalSet = new Set(routeSignals);
  const interestScore = preferences.interests.reduce((score, interest) => {
    const normalizedInterest = normalize(interest);
    return score + (routeSignals.some((signal) => signal.includes(normalizedInterest) || normalizedInterest.includes(signal)) ? 18 : 0);
  }, 0);
  const quietScore = preferences.preferQuietRoutes && routeSignalSet.has("quiet") ? 10 : 0;
  const cafeScore = (preferences.preferCafes || preferences.interests.includes("cafes")) && (routeSignalSet.has("cafes") || routeSignalSet.has("food")) ? 8 : 0;
  const rainyScore = preferences.preferIndoorRainyDay && isRainyDaySuitable(route) ? 8 : 0;
  const accessibilityScore = preferences.avoidStairs
    ? route.accessibilityNotes.some((note) => note.severity === "barrier")
      ? -36
      : routeSignalSet.has("accessible")
        ? 18
        : 10
    : 0;

  return interestScore + quietScore + cafeScore + rainyScore + accessibilityScore;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
