import { describe, expect, it } from "vitest";
import {
  getAllPlaces,
  getAllPublicSlugsForCrawl,
  getAllRoutes,
  getPlaceBySlug,
  getPlaces,
  getPublicPlaces,
  getPublicRoutes,
  getRouteBySlug,
  getRouteGeoJson,
  getRoutes,
  isPublicPlace,
  isPublicRoute
} from "@/lib/data/index";

const generatedRouteSourceId = "source-generated-discovery-routes";

describe("public content boundary", () => {
  it("keeps generated discovery routes and places out of default public catalog access", () => {
    const allRoutes = getAllRoutes();
    const allPlaces = getAllPlaces();
    const publicRoutes = getRoutes();
    const publicPlaces = getPlaces();

    expect(allRoutes.length).toBeGreaterThan(publicRoutes.length);
    expect(allPlaces.length).toBeGreaterThan(publicPlaces.length);
    expect(publicRoutes).toEqual(getPublicRoutes(allRoutes, allPlaces));
    expect(publicPlaces).toEqual(getPublicPlaces(allPlaces, allRoutes));
    expect(publicRoutes).toHaveLength(12);
    expect(publicPlaces).toHaveLength(60);
    expect(publicRoutes.every((route) => isPublicRoute(route, allPlaces))).toBe(true);
    expect(publicPlaces.every((place) => isPublicPlace(place, allRoutes))).toBe(true);
    expect(publicRoutes.some((route) => route.sources.some((source) => source.id === generatedRouteSourceId))).toBe(false);
    expect(publicPlaces.some((place) => place.discovery)).toBe(false);
  });

  it("blocks direct access to generated route and place slugs through public lookups", () => {
    const generatedRoute = getAllRoutes().find((route) => route.sources.some((source) => source.id === generatedRouteSourceId));
    const generatedPlace = getAllPlaces().find((place) => place.discovery);

    expect(generatedRoute).toBeDefined();
    expect(generatedPlace).toBeDefined();
    expect(getRouteBySlug(generatedRoute!.slug)).toBeUndefined();
    expect(getRouteGeoJson(generatedRoute!.slug)).toBeUndefined();
    expect(getPlaceBySlug(generatedPlace!.slug)).toBeUndefined();
  });

  it("only publishes routes whose stops are all public places", () => {
    const allPlaces = getAllPlaces();
    const publicPlaceIds = new Set(getPlaces().map((place) => place.id));

    for (const route of getRoutes()) {
      expect(isPublicRoute(route, allPlaces), route.slug).toBe(true);
      expect(route.stops.every((stop) => publicPlaceIds.has(stop.placeId)), route.slug).toBe(true);
    }
  });

  it("exposes a deterministic crawl manifest for public content health checks", () => {
    const crawl = getAllPublicSlugsForCrawl();

    expect(crawl.places).toHaveLength(60);
    expect(crawl.routes).toHaveLength(12);
    expect(crawl.routeLive).toHaveLength(12);
    expect(crawl.places).toContain("/places/montreal-city-hall");
    expect(crawl.places).toContain("/places/crew-collective-cafe");
    expect(crawl.places).toContain("/places/kondiaronk-belvedere");
    expect(crawl.routes).toContain("/routes/old-montreal-monuments-loop");
    expect(crawl.routeLive).toContain("/routes/old-montreal-monuments-loop/live");
    expect(new Set(crawl.paths).size).toBe(crawl.paths.length);
    expect(crawl.paths.some((path) => path.includes("regional"))).toBe(false);
  });
});
