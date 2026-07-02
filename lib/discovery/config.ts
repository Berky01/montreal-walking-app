import type { Coordinates } from "@/lib/data/types";
import type { DiscoveryConfig, DiscoveryCoverageArea } from "@/lib/discovery/types";

const montrealCenter: Coordinates = { lat: 45.5019, lng: -73.5674 };

export const DEFAULT_DISCOVERY_COVERAGE_AREAS: DiscoveryCoverageArea[] = [
  { id: "montreal-island", label: "Montreal Island", center: montrealCenter, radiusKm: 16, regionType: "city" },
  { id: "old-montreal", label: "Old Montreal", center: { lat: 45.506, lng: -73.555 }, radiusKm: 3, regionType: "borough" },
  { id: "plateau-mile-end", label: "Plateau and Mile End", center: { lat: 45.523, lng: -73.586 }, radiusKm: 4, regionType: "borough" },
  { id: "laval", label: "Laval", center: { lat: 45.6066, lng: -73.7124 }, radiusKm: 18, regionType: "suburb" },
  { id: "longueuil", label: "Longueuil", center: { lat: 45.537, lng: -73.5103 }, radiusKm: 12, regionType: "suburb" },
  { id: "south-shore", label: "South Shore", center: { lat: 45.445, lng: -73.435 }, radiusKm: 28, regionType: "shore" },
  { id: "north-shore", label: "North Shore", center: { lat: 45.695, lng: -73.765 }, radiusKm: 30, regionType: "shore" },
  { id: "west-island", label: "West Island", center: { lat: 45.447, lng: -73.86 }, radiusKm: 22, regionType: "suburb" },
  { id: "boucherville", label: "Boucherville", center: { lat: 45.591, lng: -73.436 }, radiusKm: 14, regionType: "suburb" },
  { id: "terrebonne", label: "Terrebonne", center: { lat: 45.7, lng: -73.647 }, radiusKm: 16, regionType: "suburb" },
  { id: "chambly", label: "Chambly", center: { lat: 45.447, lng: -73.286 }, radiusKm: 12, regionType: "day_trip" },
  { id: "oka", label: "Oka", center: { lat: 45.464, lng: -74.088 }, radiusKm: 16, regionType: "day_trip" },
  { id: "mont-saint-hilaire", label: "Mont-Saint-Hilaire", center: { lat: 45.565, lng: -73.18 }, radiusKm: 16, regionType: "day_trip" }
];

export function readDiscoveryConfig(env: Partial<Record<string, string | undefined>> = process.env): DiscoveryConfig {
  return {
    defaultCity: (env.DISCOVERY_DEFAULT_CITY || "montreal").trim().toLowerCase(),
    defaultCenter: {
      lat: readNumber(env.DISCOVERY_DEFAULT_CENTER_LAT, montrealCenter.lat),
      lng: readNumber(env.DISCOVERY_DEFAULT_CENTER_LNG, montrealCenter.lng)
    },
    defaultRadiusKm: readPositiveNumber(env.DISCOVERY_DEFAULT_RADIUS_KM, 90),
    maxPoisPerArea: readInteger(env.DISCOVERY_MAX_POIS_PER_AREA, 14),
    poiBatchSize: readInteger(env.DISCOVERY_POI_BATCH_SIZE, 60),
    routeGenerationEnabled: readBoolean(env.DISCOVERY_ROUTE_GENERATION_ENABLED, true),
    maxRoutesPerTheme: readInteger(env.DISCOVERY_MAX_ROUTES_PER_THEME, 2),
    minPoisPerRoute: readInteger(env.DISCOVERY_MIN_POIS_PER_ROUTE, 3),
    maxPoisPerRoute: readInteger(env.DISCOVERY_MAX_POIS_PER_ROUTE, 5),
    maxRouteDurationMin: readInteger(env.DISCOVERY_MAX_ROUTE_DURATION_MIN, 180),
    routeRadiusKm: readPositiveNumber(env.DISCOVERY_ROUTE_RADIUS_KM, 9),
    routesShownInDiscovery: readInteger(env.DISCOVERY_ROUTES_SHOWN, 36),
    cacheTtlSeconds: readInteger(env.DISCOVERY_CACHE_TTL, 60 * 60 * 24 * 7),
    coverageAreas: readCoverageAreas(env.DISCOVERY_COVERAGE_AREAS_JSON)
  };
}

function readCoverageAreas(rawValue: string | undefined): DiscoveryCoverageArea[] {
  if (!rawValue) {
    return DEFAULT_DISCOVERY_COVERAGE_AREAS;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return DEFAULT_DISCOVERY_COVERAGE_AREAS;
    }

    const areas = parsed.filter(isCoverageArea);
    return areas.length ? areas : DEFAULT_DISCOVERY_COVERAGE_AREAS;
  } catch {
    return DEFAULT_DISCOVERY_COVERAGE_AREAS;
  }
}

function isCoverageArea(value: unknown): value is DiscoveryCoverageArea {
  if (!value || typeof value !== "object") {
    return false;
  }

  const area = value as DiscoveryCoverageArea;
  return (
    typeof area.id === "string" &&
    typeof area.label === "string" &&
    typeof area.center?.lat === "number" &&
    typeof area.center?.lng === "number" &&
    typeof area.radiusKm === "number" &&
    ["city", "borough", "suburb", "shore", "day_trip"].includes(area.regionType)
  );
}

function readInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
