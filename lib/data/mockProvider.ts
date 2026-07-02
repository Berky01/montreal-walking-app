import { cities, cityPacks, neighborhoods, partnerKits } from "@/lib/mock-data";
import { rankRoutes } from "@/lib/route-engine";
import { routeToGeoJson } from "@/lib/data/geojson";
import { discoveryPlaces as places, discoveryRoutes as routes } from "@/lib/discovery/catalog";
import { readDiscoveryConfig } from "@/lib/discovery/config";
import type {
  DataProvider,
  IssueReport,
  IssueReportInput,
  NearbyPlacesInput,
  Place,
  PlaceFilters,
  Route,
  RouteFilters,
  SavedItem,
  WalkSession
} from "@/lib/data/types";

const issueReports: IssueReport[] = [];
const discoveryConfig = readDiscoveryConfig();

export const mockProvider: DataProvider = {
  getCities,
  getNeighborhoods,
  getCityPacks,
  getPartnerKits,
  getFeaturedRoutes,
  getRoutes,
  getRouteBySlug,
  getRouteGeoJson,
  getPlaces,
  getPlaceBySlug,
  getNearbyPlaces,
  searchRoutes,
  createIssueReport,
  getIssueReports,
  getSavedLibrary,
  getWalkHistory
};

export function getCities() {
  return cities;
}

export function getNeighborhoods() {
  return neighborhoods;
}

export function getCityPacks() {
  return cityPacks;
}

export function getPartnerKits() {
  return partnerKits;
}

export function getFeaturedRoutes(): Route[] {
  return getRoutes({ contentStatus: "ready" }).slice(0, 4);
}

export function getRoutes(filters: RouteFilters = {}): Route[] {
  return routes.filter((route) => {
    const matchesCity = !filters.cityId || route.cityId === filters.cityId;
    const matchesDuration = !filters.durationMaxMin || route.durationMin <= filters.durationMaxMin;
    const matchesInterest =
      !filters.interest ||
      route.tags.includes(filters.interest) ||
      route.interests.includes(filters.interest) ||
      route.moodTags.includes(filters.interest);
    const matchesArea = !filters.area || route.area.toLowerCase().includes(filters.area.toLowerCase());
    const matchesDifficulty = !filters.difficulty || route.difficulty === filters.difficulty;
    const matchesStatus = !filters.contentStatus || route.contentStatus === filters.contentStatus;

    return matchesCity && matchesDuration && matchesInterest && matchesArea && matchesDifficulty && matchesStatus;
  });
}

export function getRouteBySlug(slug: string): Route | undefined {
  return routes.find((route) => route.slug === slug);
}

export function getRouteGeoJson(slug: string) {
  const route = getRouteBySlug(slug);
  return route ? routeToGeoJson(route) : undefined;
}

export function getPlaces(filters: PlaceFilters = {}): Place[] {
  return places.filter((place) => {
    const matchesCity = !filters.cityId || place.cityId === filters.cityId;
    const matchesCategory =
      !filters.category ||
      filters.category === "all" ||
      place.category === filters.category ||
      place.tags.includes(filters.category);
    const matchesArea = !filters.area || place.area.toLowerCase().includes(filters.area.toLowerCase());
    const matchesTag = !filters.tag || place.tags.includes(filters.tag);
    const matchesStatus = !filters.contentStatus || place.contentStatus === filters.contentStatus;

    return matchesCity && matchesCategory && matchesArea && matchesTag && matchesStatus;
  });
}

export function getPlaceBySlug(slug: string): Place | undefined {
  return places.find((place) => place.slug === slug);
}

export function getNearbyPlaces(input: NearbyPlacesInput): Place[] {
  const radiusKm = input.radiusKm ?? discoveryConfig.routeRadiusKm;
  const limit = input.limit ?? discoveryConfig.poiBatchSize;

  return places
    .map((place) => ({
      place,
      distanceKm: haversineKm(input.coordinates, place.coordinates)
    }))
    .filter((item) => item.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
    .map((item) => item.place);
}

export function searchRoutes(intent: string) {
  return rankRoutes(intent, routes);
}

export function createIssueReport(input: IssueReportInput): IssueReport {
  const route = input.routeSlug ? getRouteBySlug(input.routeSlug) : undefined;
  const place = input.placeSlug ? getPlaceBySlug(input.placeSlug) : undefined;
  const report: IssueReport = {
    id: `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    routeId: route?.id,
    routeSlug: route?.slug ?? input.routeSlug,
    placeId: place?.id,
    placeSlug: place?.slug ?? input.placeSlug,
    stopId: input.stopId,
    category: input.category,
    severity: input.severity,
    description: input.description.trim(),
    createdAt: new Date().toISOString(),
    status: "new"
  };

  issueReports.unshift(report);
  return report;
}

export function getIssueReports(): IssueReport[] {
  return issueReports;
}

export function getSavedLibrary(): SavedItem[] {
  return [];
}

export function getWalkHistory(): WalkSession[] {
  return [];
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const radiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * radiusKm * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
