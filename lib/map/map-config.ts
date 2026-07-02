import type { Coordinates, Place, Route } from "@/lib/types";

export const DEFAULT_MAP_STYLE_URL = "";
export const DEFAULT_MAP_ATTRIBUTION = "";
export const DEFAULT_MAP_PROVIDER = "fallback";
export const DEFAULT_MAP_DEFAULT_CITY = "montreal";
export const DEFAULT_MAP_CENTER: Coordinates = { lat: 45.5017, lng: -73.5673 };

export type PublicMapConfigInput = {
  styleUrl?: string;
  attribution?: string;
  provider?: string;
  defaultCity?: string;
  centerLat?: string;
  centerLng?: string;
};

export type PublicMapConfig = {
  styleUrl?: string;
  attribution: string;
  provider: string;
  defaultCity: string;
  center: Coordinates;
  configured: boolean;
};

export function resolveMapStyle(styleUrl?: string): string | undefined {
  const trimmed = styleUrl?.trim();
  return trimmed || undefined;
}

export function resolveMapAttribution(_styleUrl?: string, attribution?: string): string {
  const trimmedAttribution = attribution?.trim();
  return trimmedAttribution || DEFAULT_MAP_ATTRIBUTION;
}

export function resolveMapProvider(provider?: string): string {
  return provider?.trim() || DEFAULT_MAP_PROVIDER;
}

export function resolveDefaultMapCenter(centerLat?: string, centerLng?: string): Coordinates {
  const lat = Number(centerLat);
  const lng = Number(centerLng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return DEFAULT_MAP_CENTER;
}

export function resolvePublicMapConfig(input: PublicMapConfigInput): PublicMapConfig {
  const styleUrl = resolveMapStyle(input.styleUrl);

  return {
    styleUrl,
    attribution: resolveMapAttribution(styleUrl, input.attribution),
    provider: resolveMapProvider(input.provider),
    defaultCity: input.defaultCity?.trim() || DEFAULT_MAP_DEFAULT_CITY,
    center: resolveDefaultMapCenter(input.centerLat, input.centerLng),
    configured: Boolean(styleUrl)
  };
}

export function getMapViewportCoordinates(
  routes: Array<Pick<Route, "geometry">>,
  places: Array<Pick<Place, "coordinates">>
): Coordinates[] {
  const routeCoordinates = routes.flatMap((route) => route.geometry.coordinates);

  if (routeCoordinates.length) {
    return routeCoordinates;
  }

  return places.map((place) => place.coordinates);
}
