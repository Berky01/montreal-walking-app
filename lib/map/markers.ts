import type { Coordinates, Place, Route } from "@/lib/types";

type MarkerSelection =
  | { type: "route"; slug: string }
  | { type: "place"; slug: string }
  | null;

export type MapMarkerState = "default" | "visited" | "skipped" | "current" | "next" | "route" | "place";

export type MapMarkerModel = {
  id: string;
  kind: "route" | "place" | "stop";
  label: string;
  ariaLabel: string;
  title: string;
  coordinates: Coordinates;
  selected: boolean;
  state: MapMarkerState;
  selection: MarkerSelection;
};

export type BuildMapMarkerInput = {
  route?: Route;
  routes?: Route[];
  places?: Place[];
  selected?: MarkerSelection;
  currentStopId?: string;
  nextStopId?: string;
  visitedStopIds?: string[];
  skippedStopIds?: string[];
  placeLimit?: number;
};

export function buildMapMarkers({
  route,
  routes = [],
  places = [],
  selected = null,
  currentStopId,
  nextStopId,
  visitedStopIds = [],
  skippedStopIds = [],
  placeLimit
}: BuildMapMarkerInput): MapMarkerModel[] {
  const routeList = route ? [route] : routes;
  const activeRoute = route ?? getActiveRoute(routeList, selected);
  const visited = new Set(visitedStopIds);
  const skipped = new Set(skippedStopIds);
  const markers: MapMarkerModel[] = [];

  if (!route) {
    markers.push(
      ...routeList.map((item, index) => ({
        id: item.id,
        kind: "route" as const,
        label: `R${index + 1}`,
        ariaLabel: `Show route ${item.title} on map`,
        title: item.title,
        coordinates: item.coordinates,
        selected: selected?.type === "route" && selected.slug === item.slug,
        state: "route" as const,
        selection: { type: "route" as const, slug: item.slug }
      }))
    );

    markers.push(
      ...places.slice(0, placeLimit ?? places.length).map((place) => ({
        id: place.id,
        kind: "place" as const,
        label: "P",
        ariaLabel: `Show ${place.name} on map`,
        title: place.name,
        coordinates: place.coordinates,
        selected: selected?.type === "place" && selected.slug === place.slug,
        state: "place" as const,
        selection: { type: "place" as const, slug: place.slug }
      }))
    );
  }

  if (activeRoute) {
    markers.push(
      ...activeRoute.stops.map((stop, index) => {
        const place = places.find((item) => item.id === stop.placeId);

        return {
          id: stop.id,
          kind: "stop" as const,
          label: String(index + 1),
          ariaLabel: `Show stop ${index + 1}, ${stop.title}, on map`,
          title: stop.title,
          coordinates: stop.coordinates,
          selected: Boolean(place?.slug && selected?.type === "place" && selected.slug === place.slug),
          state: getStopState(stop.id, currentStopId, nextStopId, visited, skipped),
          selection: place ? { type: "place" as const, slug: place.slug } : null
        };
      })
    );
  }

  return markers;
}

export function getActiveRoute(routes: Route[], selected: MarkerSelection): Route | undefined {
  if (selected?.type !== "route") {
    return undefined;
  }

  return routes.find((route) => route.slug === selected.slug);
}

export function getActivePlace(places: Place[], selected: MarkerSelection): Place | undefined {
  if (selected?.type !== "place") {
    return undefined;
  }

  return places.find((place) => place.slug === selected.slug);
}

export function buildMapFitPoints({
  route,
  routes = [],
  places = [],
  selected = null
}: Pick<BuildMapMarkerInput, "route" | "routes" | "places" | "selected">): Coordinates[] {
  if (route) {
    return route.geometry.coordinates;
  }

  const selectedRoute = getActiveRoute(routes, selected);
  if (selectedRoute) {
    return selectedRoute.geometry.coordinates;
  }

  if (places.length && selected?.type !== "route") {
    return places.map((place) => place.coordinates);
  }

  const routeCoordinates = routes.flatMap((item) => item.geometry.coordinates);
  if (routeCoordinates.length) {
    return routeCoordinates;
  }

  return places.map((place) => place.coordinates);
}

function getStopState(
  stopId: string,
  currentStopId: string | undefined,
  nextStopId: string | undefined,
  visited: Set<string>,
  skipped: Set<string>
): MapMarkerState {
  if (stopId === currentStopId) {
    return "current";
  }

  if (stopId === nextStopId) {
    return "next";
  }

  if (visited.has(stopId)) {
    return "visited";
  }

  if (skipped.has(stopId)) {
    return "skipped";
  }

  return "default";
}
