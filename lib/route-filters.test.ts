import { describe, expect, it } from "vitest";
import { getRoutes } from "@/lib/data/index";
import { filterAndSortRoutes, getRouteResultMapPlaces, getSyncedRouteMapSelection, parseRouteFilterParams } from "@/lib/route-filters";
import type { UserPreferences } from "@/lib/types";

describe("route filters", () => {
  it("parses URL search params into stable filters", () => {
    const filters = parseRouteFilterParams(new URLSearchParams("duration=60&interest=architecture&difficulty=easy&type=loop&accessible=true&sort=shortest&neighborhood=Old%20Montreal&weather=rainy"));

    expect(filters).toEqual({
      duration: 60,
      interest: "architecture",
      difficulty: "easy",
      routeType: "loop",
      accessible: true,
      sort: "shortest",
      neighborhood: "Old Montreal",
      weatherSuitability: "rainy"
    });
  });

  it("filters and sorts route results deterministically", () => {
    const results = filterAndSortRoutes(getRoutes(), {
      duration: 90,
      interest: "architecture",
      difficulty: "easy",
      routeType: "loop",
      accessible: false,
      neighborhood: "Old Montreal",
      weatherSuitability: "all",
      sort: "shortest"
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((route) => route.durationMin <= 90)).toBe(true);
    expect(results.every((route) => route.difficulty === "easy")).toBe(true);
    expect(results.every((route) => route.routeType === "loop")).toBe(true);
    expect(results.every((route) => route.area.includes("Old Montreal"))).toBe(true);
    expect(results[0].distanceKm).toBeLessThanOrEqual(results.at(-1)?.distanceKm ?? Infinity);
  });

  it("can filter routes for rainy-day suitability from route tags and interests", () => {
    const results = filterAndSortRoutes(getRoutes(), {
      duration: 999,
      interest: "all",
      difficulty: "all",
      routeType: "all",
      accessible: false,
      neighborhood: "all",
      weatherSuitability: "rainy",
      sort: "recommended"
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((route) => [...route.tags, ...route.interests, ...route.moodTags].some((tag) => ["museums", "cafes", "markets", "rainy day"].includes(tag)))).toBe(true);
  });

  it("biases recommended sorting toward saved interests and accessibility preferences", () => {
    const preferences: UserPreferences = {
      units: "metric",
      preferredPace: "balanced",
      interests: ["nature", "scenic"],
      preferQuietRoutes: true,
      preferCafes: false,
      preferIndoorRainyDay: false,
      avoidStairs: true,
      accessibilityNeeds: ["avoid stairs"]
    };

    const results = filterAndSortRoutes(
      getRoutes(),
      {
        duration: 999,
        interest: "all",
        difficulty: "all",
        routeType: "all",
        accessible: false,
        neighborhood: "all",
        weatherSuitability: "all",
        sort: "recommended"
      },
      preferences
    );

    expect(results[0].slug).toBe("lachine-canal-heritage-walk");
    expect(results.findIndex((route) => route.slug === "lachine-canal-heritage-walk")).toBeLessThan(
      results.findIndex((route) => route.slug === "mount-royal-sunrise-loop")
    );
  });

  it("limits route-result map places to stops from the filtered route results", () => {
    const routes = getRoutes().slice(0, 2);
    const routePlaceIds = new Set(routes.flatMap((route) => route.stops.map((stop) => stop.placeId)));
    const mapPlaces = getRouteResultMapPlaces(routes);

    expect(mapPlaces.length).toBe(routePlaceIds.size);
    expect(mapPlaces.every((place) => routePlaceIds.has(place.id))).toBe(true);
  });

  it("keeps map selection synced with filtered route and place results", () => {
    const routes = getRoutes().slice(0, 2);
    const places = getRouteResultMapPlaces(routes);

    expect(
      getSyncedRouteMapSelection({
        selected: { type: "route", slug: routes[1].slug },
        routes,
        places
      })
    ).toEqual({ type: "route", slug: routes[1].slug });

    expect(
      getSyncedRouteMapSelection({
        selected: { type: "route", slug: "filtered-out-route" },
        routes,
        places
      })
    ).toEqual({ type: "route", slug: routes[0].slug });

    expect(
      getSyncedRouteMapSelection({
        selected: { type: "place", slug: places[0].slug },
        routes,
        places
      })
    ).toEqual({ type: "place", slug: places[0].slug });
  });
});
