import type { ContentSource, Coordinates, Place } from "@/lib/data/types";

export type DiscoveryCoverageArea = {
  id: string;
  label: string;
  center: Coordinates;
  radiusKm: number;
  regionType: "city" | "borough" | "suburb" | "shore" | "day_trip";
};

export type DiscoveryConfig = {
  defaultCity: string;
  defaultCenter: Coordinates;
  defaultRadiusKm: number;
  maxPoisPerArea: number;
  poiBatchSize: number;
  routeGenerationEnabled: boolean;
  maxRoutesPerTheme: number;
  minPoisPerRoute: number;
  maxPoisPerRoute: number;
  maxRouteDurationMin: number;
  routeRadiusKm: number;
  routesShownInDiscovery: number;
  cacheTtlSeconds: number;
  coverageAreas: DiscoveryCoverageArea[];
};

export type PoiSource = ContentSource | "openstreetmap";

export type PoiCandidate = {
  source: PoiSource;
  sourceId: string;
  name: string;
  category: Place["category"];
  area: string;
  coordinates: Coordinates;
  tags: string[];
  shortDescription: string;
  sourceUrl?: string;
  rating?: number;
  popularity?: number;
  localInterestScore?: number;
  address?: string;
  openingHours?: string;
  website?: string;
  imageUrl?: string;
  score?: number;
};
