import { describe, expect, it } from "vitest";
import { getAllPlaces, getAllRoutes } from "@/lib/data/index";
import { readDiscoveryConfig } from "@/lib/discovery/config";
import { dedupePoiCandidates, rankPoiCandidates } from "@/lib/discovery/poi-ranking";
import type { PoiCandidate } from "@/lib/discovery/types";

const baseCandidate: PoiCandidate = {
  source: "generated_local",
  sourceId: "candidate-1",
  name: "Candidate Place",
  category: "museum",
  area: "Downtown",
  coordinates: { lat: 45.5019, lng: -73.5674 },
  tags: ["museums"],
  shortDescription: "A candidate discovery place.",
  rating: 4.2,
  popularity: 60,
  localInterestScore: 60,
  sourceUrl: "https://example.com/candidate"
};

describe("Montreal discovery expansion", () => {
  it("defaults to configurable Montreal regional coverage", () => {
    const config = readDiscoveryConfig({});

    expect(config.defaultCity).toBe("montreal");
    expect(config.defaultRadiusKm).toBeGreaterThanOrEqual(75);
    expect(config.defaultRadiusKm).toBeLessThanOrEqual(100);
    expect(config.coverageAreas.map((area) => area.label)).toEqual(
      expect.arrayContaining(["Montreal Island", "Laval", "Longueuil", "South Shore", "North Shore"])
    );
    expect(config.routeGenerationEnabled).toBe(true);
  });

  it("dedupes provider candidates by source id and nearby normalized name", () => {
    const candidates: PoiCandidate[] = [
      baseCandidate,
      { ...baseCandidate, name: "Candidate Place duplicate", sourceId: "candidate-1" },
      {
        ...baseCandidate,
        sourceId: "candidate-2",
        name: "Candidate Place",
        coordinates: { lat: 45.50191, lng: -73.56739 }
      },
      {
        ...baseCandidate,
        sourceId: "candidate-3",
        name: "Different Candidate",
        coordinates: { lat: 45.58, lng: -73.74 }
      }
    ];

    expect(dedupePoiCandidates(candidates).map((candidate) => candidate.sourceId)).toEqual(["candidate-1", "candidate-3"]);
  });

  it("ranks POIs with area diversity instead of letting the center dominate", () => {
    const candidates: PoiCandidate[] = [
      { ...baseCandidate, sourceId: "downtown-1", name: "Downtown One", area: "Downtown", popularity: 100 },
      { ...baseCandidate, sourceId: "downtown-2", name: "Downtown Two", area: "Downtown", popularity: 95 },
      { ...baseCandidate, sourceId: "downtown-3", name: "Downtown Three", area: "Downtown", popularity: 90 },
      {
        ...baseCandidate,
        sourceId: "laval-1",
        name: "Laval One",
        area: "Laval",
        coordinates: { lat: 45.6066, lng: -73.7124 },
        popularity: 75
      },
      {
        ...baseCandidate,
        sourceId: "longueuil-1",
        name: "Longueuil One",
        area: "Longueuil",
        coordinates: { lat: 45.537, lng: -73.5103 },
        popularity: 70
      }
    ];

    const ranked = rankPoiCandidates(candidates, readDiscoveryConfig({}));

    expect(ranked.slice(0, 4).map((candidate) => candidate.area)).toEqual(expect.arrayContaining(["Laval", "Longueuil"]));
  });

  it("expands the mock catalog beyond the old central MVP limits", () => {
    const places = getAllPlaces();
    const routes = getAllRoutes();

    expect(places.length).toBeGreaterThanOrEqual(140);
    expect(routes.length).toBeGreaterThanOrEqual(28);
    expect(new Set(places.map((place) => place.area)).size).toBeGreaterThanOrEqual(20);
    expect(places.map((place) => place.area)).toEqual(
      expect.arrayContaining(["Laval", "Longueuil", "South Shore", "North Shore", "West Island"])
    );
    expect(routes.map((route) => route.area)).toEqual(expect.arrayContaining(["Laval", "Longueuil", "South Shore", "North Shore"]));
  });

  it("generates configurable routes from expanded POIs across expected themes", () => {
    const config = readDiscoveryConfig({});
    const generatedRoutes = getAllRoutes().filter((route) => route.sources.some((source) => source.id === "source-generated-discovery-routes"));
    const routeTags = generatedRoutes.flatMap((route) => [...route.tags, ...route.interests, ...route.moodTags]);

    expect(generatedRoutes.length).toBeGreaterThanOrEqual(16);
    expect(routeTags).toEqual(
      expect.arrayContaining(["nightlife", "family-friendly", "rainy day", "day-trip", "bike-friendly", "date-night"])
    );

    for (const route of generatedRoutes) {
      const stopIds = route.stops.map((stop) => stop.placeId);

      expect(route.stops.length, route.slug).toBeGreaterThanOrEqual(config.minPoisPerRoute);
      expect(route.stops.length, route.slug).toBeLessThanOrEqual(config.maxPoisPerRoute);
      expect(route.durationMin, route.slug).toBeLessThanOrEqual(config.maxRouteDurationMin);
      expect(new Set(stopIds).size, route.slug).toBe(stopIds.length);
    }
  });
});
