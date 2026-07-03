import { mockProvider } from "@/lib/data/mockProvider";
import { postgresProvider } from "@/lib/data/postgresProvider";
import { routeToGeoJson } from "@/lib/data/geojson";
import {
  getPublicPlaces as selectPublicPlaces,
  getPublicRoutes as selectPublicRoutes,
  isPublicPlace,
  isPublicRoute
} from "@/lib/data/public-content";
import { rankRoutes } from "@/lib/route-engine";
import type { NearbyPlacesInput, PlaceFilters, RouteFilters } from "@/lib/data/types";

const provider = process.env.DATA_SOURCE === "postgres" ? postgresProvider : mockProvider;

export const getCities = provider.getCities;
export const getNeighborhoods = provider.getNeighborhoods;
export const getCityPacks = provider.getCityPacks;
export const getPartnerKits = provider.getPartnerKits;
export const createIssueReport = provider.createIssueReport;
export const updateIssueReport = provider.updateIssueReport;
export const getIssueReports = provider.getIssueReports;
export const getSavedLibrary = provider.getSavedLibrary;
export const getWalkHistory = provider.getWalkHistory;

export function getAllRoutes(filters?: RouteFilters) {
  return provider.getRoutes(filters);
}

export function getAllRouteBySlug(slug: string) {
  return provider.getRouteBySlug(slug);
}

export function getAllRouteGeoJson(slug: string) {
  return provider.getRouteGeoJson(slug);
}

export function getAllPlaces(filters?: PlaceFilters) {
  return provider.getPlaces(filters);
}

export function getAllPlaceBySlug(slug: string) {
  return provider.getPlaceBySlug(slug);
}

export function getFeaturedRoutes() {
  return getRoutes().slice(0, 4);
}

export function getRoutes(filters?: RouteFilters) {
  return selectPublicRoutes(getAllRoutes(filters), getAllPlaces());
}

export function getPublicRoutes(routes = getAllRoutes(), places = getAllPlaces()) {
  return selectPublicRoutes(routes, places);
}

export function getRouteBySlug(slug: string) {
  const route = getAllRouteBySlug(slug);
  return route && isPublicRoute(route, getAllPlaces()) ? route : undefined;
}

export function getRouteGeoJson(slug: string) {
  const route = getRouteBySlug(slug);
  return route ? routeToGeoJson(route) : undefined;
}

export function getPlaces(filters?: PlaceFilters) {
  return selectPublicPlaces(getAllPlaces(filters), getAllRoutes());
}

export function getPublicPlaces(places = getAllPlaces(), routes = getAllRoutes()) {
  return selectPublicPlaces(places, routes);
}

export function getPlaceBySlug(slug: string) {
  const place = getAllPlaceBySlug(slug);
  return place && isPublicPlace(place, getAllRoutes()) ? place : undefined;
}

export function getNearbyPlaces(input: NearbyPlacesInput) {
  return selectPublicPlaces(provider.getNearbyPlaces(input), getAllRoutes());
}

export function searchRoutes(intent: string) {
  return rankRoutes(intent, getRoutes());
}

export function getAllPublicSlugsForCrawl() {
  const places = getPlaces();
  const routes = getRoutes();
  const placePaths = places.map((place) => `/places/${place.slug}`).sort();
  const routePaths = routes.map((route) => `/routes/${route.slug}`).sort();
  const routeLivePaths = routes.map((route) => `/routes/${route.slug}/live`).sort();
  const reportPaths = routes.flatMap((route) =>
    route.stops.slice(0, 1).map((stop) => `/report-issue?route=${route.slug}&stop=${stop.id}`)
  );
  const staticPaths = ["/", "/app", "/places", "/routes", "/search", "/saved", "/history", "/settings", "/cities"];

  return {
    places: placePaths,
    routes: routePaths,
    routeLive: routeLivePaths,
    reports: reportPaths,
    static: staticPaths,
    paths: unique([...staticPaths, ...placePaths, ...routePaths, ...routeLivePaths, ...reportPaths])
  };
}

export { isPublicPlace, isPublicRoute } from "@/lib/data/public-content";

export type {
  AccessibilityNote,
  City,
  ContentStatus,
  Coordinates,
  DataProvider,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  IssueReport,
  IssueReportInput,
  IssueReportTriageInput,
  MediaAsset,
  NearbyPlacesInput,
  CityPack,
  Neighborhood,
  PartnerKit,
  Place,
  PlaceFilters,
  Route,
  RouteFilters,
  RouteGeometry,
  RouteQaStatus,
  RouteSearchResult,
  RouteStop,
  SafetyNote,
  SavedItem,
  SearchIntent,
  Source,
  UserPreferences,
  WalkSession
} from "@/lib/data/types";

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
