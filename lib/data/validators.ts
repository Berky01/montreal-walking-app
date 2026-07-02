import type { Place, Route } from "@/lib/data/types";
import {
  getPublicPlaceReadinessIssues,
  getPublicPlaces,
  getPublicRouteReadinessIssues,
  getPublicRoutes
} from "@/lib/data/public-content";

export type DataValidationResult = {
  ok: boolean;
  counts: {
    routes: number;
    places: number;
  };
  errors: string[];
  warnings: string[];
};

export type PublicContentValidationResult = {
  ok: boolean;
  counts: {
    routes: number;
    places: number;
    publicRoutes: number;
    publicPlaces: number;
    hiddenRoutes: number;
    hiddenPlaces: number;
  };
  errors: string[];
  warnings: string[];
};

export function validateDataCatalog({
  routes,
  places,
  minimumPlaces = 140,
  minimumRoutes = 28
}: {
  routes: Route[];
  places: Place[];
  minimumPlaces?: number;
  minimumRoutes?: number;
}): DataValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const placeIds = new Set(places.map((place) => place.id));
  const routeSlugs = new Set<string>();
  const placeSlugs = new Set<string>();

  if (routes.length < minimumRoutes) {
    errors.push(`Expected at least ${minimumRoutes} routes, found ${routes.length}.`);
  }

  if (places.length < minimumPlaces) {
    errors.push(`Expected at least ${minimumPlaces} places, found ${places.length}.`);
  }

  for (const place of places) {
    if (placeSlugs.has(place.slug)) {
      errors.push(`Duplicate place slug: ${place.slug}.`);
    }
    placeSlugs.add(place.slug);

    if (!hasValidCoordinates(place.coordinates)) {
      errors.push(`Place ${place.slug} is missing valid coordinates.`);
    }

    if (!place.sources.length) {
      errors.push(`Place ${place.slug} is missing source attribution.`);
    }

    if (!place.contentStatus) {
      errors.push(`Place ${place.slug} is missing content status.`);
    }
  }

  for (const route of routes) {
    if (routeSlugs.has(route.slug)) {
      errors.push(`Duplicate route slug: ${route.slug}.`);
    }
    routeSlugs.add(route.slug);

    if (route.stops.length < 2) {
      errors.push(`Route ${route.slug} must have at least two stops.`);
    }

    if (route.geometry.type !== "LineString" || route.geometry.coordinates.length < 2) {
      errors.push(`Route ${route.slug} is missing a GeoJSON-ready LineString geometry.`);
    }

    for (const point of route.geometry.coordinates) {
      if (!hasValidCoordinates(point)) {
        errors.push(`Route ${route.slug} has invalid geometry coordinates.`);
        break;
      }
    }

    for (const stop of route.stops) {
      if (!placeIds.has(stop.placeId)) {
        errors.push(`Route ${route.slug} references missing place ${stop.placeId}.`);
      }

      if (!hasValidCoordinates(stop.coordinates)) {
        errors.push(`Route ${route.slug} stop ${stop.id} has invalid coordinates.`);
      }

      if (!route.geometry.coordinates.some((point) => distanceKm(point, stop.coordinates) <= 0.03)) {
        errors.push(`Route ${route.slug} geometry does not include stop ${stop.id}.`);
      }
    }

    if (!placeIds.has(route.startPlaceId)) {
      errors.push(`Route ${route.slug} has missing start place ${route.startPlaceId}.`);
    }

    if (!placeIds.has(route.endPlaceId)) {
      errors.push(`Route ${route.slug} has missing end place ${route.endPlaceId}.`);
    }

    if (!route.safetyNotes.length) {
      errors.push(`Route ${route.slug} is missing safety notes.`);
    }

    if (!route.accessibilityNotes.length) {
      errors.push(`Route ${route.slug} is missing accessibility notes.`);
    }

    if (!route.sources.length) {
      errors.push(`Route ${route.slug} is missing source attribution.`);
    }

    if (!route.contentStatus) {
      errors.push(`Route ${route.slug} is missing content status.`);
    }

    if (route.qaScore < 0 || route.qaScore > 100 || route.qaStatus.score !== route.qaScore) {
      errors.push(`Route ${route.slug} has an invalid QA score.`);
    }

    if (route.metrics.find((metric) => metric.label === "Stops")?.value !== String(route.stops.length)) {
      warnings.push(`Route ${route.slug} stop metric does not match stop count.`);
    }
  }

  return {
    ok: errors.length === 0,
    counts: {
      routes: routes.length,
      places: places.length
    },
    errors,
    warnings
  };
}

export function validatePublicContentReadiness({
  routes,
  places,
  publicRoutes = getPublicRoutes(routes, places),
  publicPlaces = getPublicPlaces(places, routes)
}: {
  routes: Route[];
  places: Place[];
  publicRoutes?: Route[];
  publicPlaces?: Place[];
}): PublicContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allRouteSlugs = new Set(routes.map((route) => route.slug));
  const publicRouteSlugs = new Set<string>();
  const publicPlaceIds = new Set<string>();
  const publicPlaceSlugs = new Set<string>();

  for (const route of publicRoutes) {
    if (publicRouteSlugs.has(route.slug)) {
      errors.push(`Duplicate public route slug: ${route.slug}.`);
    }
    publicRouteSlugs.add(route.slug);

    errors.push(...getPublicRouteReadinessIssues(route, places));
  }

  for (const place of publicPlaces) {
    if (publicPlaceSlugs.has(place.slug)) {
      errors.push(`Duplicate public place slug: ${place.slug}.`);
    }
    publicPlaceSlugs.add(place.slug);
    publicPlaceIds.add(place.id);

    errors.push(...getPublicPlaceReadinessIssues(place));
  }

  for (const route of publicRoutes) {
    const stopIds = new Set<string>();
    const stopOrders = new Set<number>();

    for (const [index, stop] of route.stops.entries()) {
      if (stopIds.has(stop.id)) {
        errors.push(`Public route ${route.slug} has duplicate stop id ${stop.id}.`);
      }
      stopIds.add(stop.id);

      if (stopOrders.has(stop.order)) {
        errors.push(`Public route ${route.slug} has duplicate stop order ${stop.order}.`);
      }
      stopOrders.add(stop.order);

      if (stop.order !== index + 1) {
        errors.push(`Public route ${route.slug} stop order breaks at ${stop.id}.`);
      }

      if (!publicPlaceIds.has(stop.placeId)) {
        errors.push(`Public route ${route.slug} references hidden place ${stop.placeId}.`);
      }
    }
  }

  for (const place of publicPlaces) {
    for (const routeSlug of place.relatedRouteSlugs) {
      if (!allRouteSlugs.has(routeSlug) || !publicRouteSlugs.has(routeSlug)) {
        errors.push(`Public place ${place.slug} links hidden route ${routeSlug}.`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    counts: {
      routes: routes.length,
      places: places.length,
      publicRoutes: publicRoutes.length,
      publicPlaces: publicPlaces.length,
      hiddenRoutes: Math.max(0, routes.length - publicRoutes.length),
      hiddenPlaces: Math.max(0, places.length - publicPlaces.length)
    },
    errors,
    warnings
  };
}

export function summarizeContentReadiness({ routes, places }: { routes: Route[]; places: Place[] }) {
  return {
    routeCountsByStatus: countBy(routes, (route) => route.contentStatus),
    placeCountsByStatus: countBy(places, (place) => place.contentStatus),
    missingCoordinates: places.filter((place) => !hasValidCoordinates(place.coordinates)).map((place) => place.slug),
    missingGeometry: routes.filter((route) => route.geometry.coordinates.length < 2).map((route) => route.slug),
    missingSourceAttribution: [
      ...routes.filter((route) => route.sources.length === 0).map((route) => route.slug),
      ...places.filter((place) => place.sources.length === 0).map((place) => place.slug)
    ],
    missingSafetyNotes: routes.filter((route) => route.safetyNotes.length === 0).map((route) => route.slug),
    missingAccessibilityNotes: routes.filter((route) => route.accessibilityNotes.length === 0).map((route) => route.slug),
    qaScores: routes.map((route) => ({
      slug: route.slug,
      title: route.title,
      score: route.qaScore,
      status: route.qaStatus.overall
    }))
  };
}

function hasValidCoordinates(coordinates: { lat: number; lng: number } | undefined): boolean {
  return Boolean(
    coordinates &&
      Number.isFinite(coordinates.lat) &&
      Number.isFinite(coordinates.lng) &&
      coordinates.lat >= -90 &&
      coordinates.lat <= 90 &&
      coordinates.lng >= -180 &&
      coordinates.lng <= 180
  );
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
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

function countBy<T>(items: T[], getKey: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
