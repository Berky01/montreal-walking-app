import { describe, expect, it } from "vitest";
import { places } from "@/lib/mock-data/places";
import { routes } from "@/lib/mock-data/routes";
import { buildMapFitPoints, buildMapMarkers, getActivePlace, getActiveRoute } from "./markers";

describe("map marker model", () => {
  const route = routes[0];
  const routePlaces = places.filter((place) => route.stops.some((stop) => stop.placeId === place.id));

  it("builds active route stop markers with live route states", () => {
    const markers = buildMapMarkers({
      route,
      places: routePlaces,
      selected: { type: "route", slug: route.slug },
      currentStopId: route.stops[1].id,
      nextStopId: route.stops[2].id,
      visitedStopIds: [route.stops[0].id]
    });

    expect(markers.filter((marker) => marker.kind === "stop")).toHaveLength(route.stops.length);
    expect(markers.find((marker) => marker.id === route.stops[0].id)?.state).toBe("visited");
    expect(markers.find((marker) => marker.id === route.stops[1].id)?.state).toBe("current");
    expect(markers.find((marker) => marker.id === route.stops[2].id)?.state).toBe("next");
    expect(markers.find((marker) => marker.id === route.stops[1].id)?.selection).toEqual({
      type: "place",
      slug: routePlaces.find((place) => place.id === route.stops[1].placeId)?.slug
    });
  });

  it("marks skipped stops separately from unvisited stops", () => {
    const markers = buildMapMarkers({
      route,
      places: routePlaces,
      currentStopId: route.stops[1].id,
      skippedStopIds: [route.stops[0].id]
    });

    expect(markers.find((marker) => marker.id === route.stops[0].id)?.state).toBe("skipped");
    expect(markers.find((marker) => marker.id === route.stops[1].id)?.state).toBe("current");
  });

  it("builds route preview and place markers for catalog maps", () => {
    const markers = buildMapMarkers({
      routes: routes.slice(0, 3),
      places: places.slice(0, 5),
      selected: { type: "route", slug: routes[1].slug }
    });

    expect(markers.filter((marker) => marker.kind === "route")).toHaveLength(3);
    expect(markers.filter((marker) => marker.kind === "place")).toHaveLength(5);
    expect(markers.some((marker) => marker.kind === "stop" && marker.title === routes[1].stops[0].title)).toBe(true);
  });

  it("keeps stop markers on a single route map when a stop place is selected", () => {
    const selectedPlace = routePlaces[2];
    const markers = buildMapMarkers({
      route,
      places: routePlaces,
      selected: { type: "place", slug: selectedPlace.slug }
    });

    expect(markers.filter((marker) => marker.kind === "stop")).toHaveLength(route.stops.length);
    expect(markers.some((marker) => marker.selection?.type === "place" && marker.selection.slug === selectedPlace.slug)).toBe(true);
  });

  it("uses all place markers by default for the places map", () => {
    const markers = buildMapMarkers({ places });

    expect(markers.filter((marker) => marker.kind === "place")).toHaveLength(places.length);
  });

  it("uses selected route geometry for controlled route maps and all points for overview maps", () => {
    const selectedRoutePoints = buildMapFitPoints({
      routes: routes.slice(0, 3),
      selected: { type: "route", slug: routes[1].slug }
    });
    const overviewPoints = buildMapFitPoints({ routes: routes.slice(0, 3) });
    const placePoints = buildMapFitPoints({ places: places.slice(0, 4) });

    expect(selectedRoutePoints).toEqual(routes[1].geometry.coordinates);
    expect(overviewPoints).toHaveLength(routes.slice(0, 3).flatMap((item) => item.geometry.coordinates).length);
    expect(placePoints).toEqual(places.slice(0, 4).map((place) => place.coordinates));
  });

  it("resolves active route and place from map selection", () => {
    expect(getActiveRoute(routes.slice(0, 3), { type: "route", slug: routes[1].slug })).toBe(routes[1]);
    expect(getActiveRoute(routes.slice(0, 3), { type: "place", slug: places[0].slug })).toBeUndefined();
    expect(getActivePlace(places.slice(0, 3), { type: "place", slug: places[1].slug })).toBe(places[1]);
    expect(getActivePlace(places.slice(0, 3), { type: "route", slug: routes[0].slug })).toBeUndefined();
  });
});
