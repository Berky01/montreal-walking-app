import { mockProvider } from "@/lib/data/mockProvider";
import { postgresProvider } from "@/lib/data/postgresProvider";

const provider = process.env.DATA_SOURCE === "postgres" ? postgresProvider : mockProvider;

export const getFeaturedRoutes = provider.getFeaturedRoutes;
export const getCities = provider.getCities;
export const getNeighborhoods = provider.getNeighborhoods;
export const getCityPacks = provider.getCityPacks;
export const getPartnerKits = provider.getPartnerKits;
export const getRoutes = provider.getRoutes;
export const getRouteBySlug = provider.getRouteBySlug;
export const getRouteGeoJson = provider.getRouteGeoJson;
export const getPlaces = provider.getPlaces;
export const getPlaceBySlug = provider.getPlaceBySlug;
export const getNearbyPlaces = provider.getNearbyPlaces;
export const searchRoutes = provider.searchRoutes;
export const createIssueReport = provider.createIssueReport;
export const getIssueReports = provider.getIssueReports;
export const getSavedLibrary = provider.getSavedLibrary;
export const getWalkHistory = provider.getWalkHistory;

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
