import { describe, expect, it } from "vitest";
import { getAllPlaces, getAllRoutes, getPlaces, getRouteGeoJson, getRoutes } from "@/lib/data/index";
import { validateDataCatalog, validatePublicContentReadiness } from "@/lib/data/validators";

describe("Phase 2B data catalog", () => {
  it("meets the Montreal route and place baseline", () => {
    const routes = getAllRoutes();
    const places = getAllPlaces();
    const result = validateDataCatalog({ routes, places });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.counts.routes).toBeGreaterThanOrEqual(28);
    expect(result.counts.places).toBeGreaterThanOrEqual(140);
    expect(routes.filter((route) => route.contentStatus === "ready").length).toBeGreaterThanOrEqual(8);
    expect(places.filter((place) => place.contentStatus === "ready").length).toBeGreaterThanOrEqual(40);
  });

  it("keeps source and media metadata on every catalog item", () => {
    for (const route of getAllRoutes()) {
      expect(route.sources.length, route.slug).toBeGreaterThan(0);
      expect(route.media.length, route.slug).toBeGreaterThan(0);
      expect(route.media.every((asset) => asset.alt.trim().length > 0), route.slug).toBe(true);
    }

    for (const place of getAllPlaces()) {
      expect(place.sources.length, place.slug).toBeGreaterThan(0);
      expect(place.media.length, place.slug).toBeGreaterThan(0);
      expect(place.media.every((asset) => asset.alt.trim().length > 0), place.slug).toBe(true);
    }
  });

  it("uses the Phase 2B count floor by default", () => {
    const result = validateDataCatalog({ routes: [], places: [] });

    expect(result.errors).toContain("Expected at least 28 routes, found 0.");
    expect(result.errors).toContain("Expected at least 140 places, found 0.");
  });

  it("flags route geometry that does not pass near its stops", () => {
    const route = JSON.parse(JSON.stringify(getAllRoutes()[0])) as ReturnType<typeof getAllRoutes>[number];
    route.geometry.coordinates = route.geometry.coordinates.map((point) => ({
      lat: point.lat + 1,
      lng: point.lng + 1
    }));

    const result = validateDataCatalog({
      routes: [route],
      places: getAllPlaces(),
      minimumPlaces: 1,
      minimumRoutes: 1
    });

    expect(result.errors).toContain(`Route ${route.slug} geometry does not include stop ${route.stops[0].id}.`);
  });

  it("returns valid route GeoJSON line strings", () => {
    for (const route of getRoutes()) {
      const geojson = getRouteGeoJson(route.slug);

      expect(geojson?.type).toBe("Feature");
      expect(geojson?.geometry.type).toBe("LineString");
      expect(geojson?.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
      expect(geojson?.properties.slug).toBe(route.slug);
    }
  });

  it("validates public readiness separately from all-catalog structure", () => {
    const result = validatePublicContentReadiness({
      routes: getAllRoutes(),
      places: getAllPlaces()
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.counts.publicRoutes).toBe(getRoutes().length);
    expect(result.counts.publicPlaces).toBe(getPlaces().length);
    expect(result.counts.hiddenRoutes).toBeGreaterThan(0);
    expect(result.counts.hiddenPlaces).toBeGreaterThan(0);
  });

  it("fails public readiness when the old full generated catalog is treated as public", () => {
    const routes = getAllRoutes();
    const places = getAllPlaces();
    const result = validatePublicContentReadiness({
      routes,
      places,
      publicRoutes: routes,
      publicPlaces: places
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.includes("generated discovery route"))).toBe(true);
    expect(result.errors.some((error) => error.includes("generated discovery place"))).toBe(true);
  });

  it("fails public readiness when public place related links point to hidden routes", () => {
    const routes = getAllRoutes();
    const places = getAllPlaces();
    const hiddenRoute = routes.find((route) => route.sources.some((source) => source.id === "source-generated-discovery-routes"));
    const publicPlace = getPlaces()[0];
    expect(hiddenRoute).toBeDefined();

    const mutatedPlaces = places.map((place) =>
      place.id === publicPlace.id
        ? { ...place, relatedRouteSlugs: [...place.relatedRouteSlugs, hiddenRoute!.slug] }
        : place
    );
    const result = validatePublicContentReadiness({
      routes,
      places: mutatedPlaces
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(`Public place ${publicPlace.slug} links hidden route ${hiddenRoute!.slug}.`);
  });
});
