import { places as curatedPlaces, routes as curatedRoutes } from "@/lib/mock-data";
import { readDiscoveryConfig } from "@/lib/discovery/config";
import { dedupePoiCandidates, rankPoiCandidates } from "@/lib/discovery/poi-ranking";
import { createPlaceFromPoiCandidate, buildRegionalPoiCandidates } from "@/lib/discovery/regional-pois";
import { generateDiscoveryRoutes } from "@/lib/discovery/route-generation";
import type { Place, Route } from "@/lib/data/types";

const config = readDiscoveryConfig();

export const discoveryPlaces: Place[] = buildDiscoveryPlaces(curatedPlaces);
export const discoveryRoutes: Route[] = buildDiscoveryRoutes(curatedRoutes, discoveryPlaces);

export function buildDiscoveryPlaces(basePlaces: Place[], envConfig = config): Place[] {
  const existingSlugs = new Set(basePlaces.map((place) => place.slug));
  const existingIds = new Set(basePlaces.map((place) => place.id));
  const generatedPlaces = rankPoiCandidates(dedupePoiCandidates(buildRegionalPoiCandidates(envConfig)), envConfig)
    .map(createPlaceFromPoiCandidate)
    .filter((place) => !existingSlugs.has(place.slug) && !existingIds.has(place.id));

  return [...basePlaces, ...generatedPlaces];
}

export function buildDiscoveryRoutes(baseRoutes: Route[], places: Place[], envConfig = config): Route[] {
  const existingRouteSlugs = new Set(baseRoutes.map((route) => route.slug));
  const generatedRoutes = generateDiscoveryRoutes({
    places,
    config: envConfig,
    existingRouteSlugs
  });

  return [...baseRoutes, ...generatedRoutes];
}
