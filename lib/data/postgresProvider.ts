import type { DataProvider } from "@/lib/data/types";

function notConfigured(): never {
  throw new Error("DATA_SOURCE=postgres is prepared but not configured. Use DATA_SOURCE=mock until Postgres/PostGIS connection code is wired.");
}

export const postgresProvider: DataProvider = {
  getCities: notConfigured,
  getNeighborhoods: notConfigured,
  getCityPacks: notConfigured,
  getPartnerKits: notConfigured,
  getFeaturedRoutes: notConfigured,
  getRoutes: notConfigured,
  getRouteBySlug: notConfigured,
  getRouteGeoJson: notConfigured,
  getPlaces: notConfigured,
  getPlaceBySlug: notConfigured,
  getNearbyPlaces: notConfigured,
  searchRoutes: notConfigured,
  createIssueReport: notConfigured,
  updateIssueReport: notConfigured,
  getIssueReports: notConfigured,
  getSavedLibrary: notConfigured,
  getWalkHistory: notConfigured
};
