import type { Coordinate, RoutedPath, RoutingProvider, WalkingRouteInput } from '../mvpTypes';
import { fetchWithTimeout } from './fetchWithTimeout';

interface GeoapifyRoutingOptions {
  apiKey?: string;
  fetcher?: typeof fetch;
  maxPoiWaypoints?: number;
  timeoutMs?: number;
}

function waypointParam(coordinate: Coordinate): string {
  return `${coordinate.lat},${coordinate.lng}`;
}

function isUsableCoordinatePair(value: unknown): value is [number, number] {
  return Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]);
}

function lineStringCoordinates(geometry: unknown): Array<[number, number]> | null {
  const candidate = geometry as { type?: unknown; coordinates?: unknown };

  if (candidate.type === 'LineString' && Array.isArray(candidate.coordinates)) {
    return candidate.coordinates.every(isUsableCoordinatePair) ? candidate.coordinates : null;
  }

  if (candidate.type === 'MultiLineString' && Array.isArray(candidate.coordinates)) {
    const flattened = candidate.coordinates.flat();

    return flattened.every(isUsableCoordinatePair) ? flattened : null;
  }

  return null;
}

export function createGeoapifyRoutingProvider(options: GeoapifyRoutingOptions): RoutingProvider {
  const fetcher = options.fetcher ?? fetch;
  const maxPoiWaypoints = options.maxPoiWaypoints ?? 8;
  const timeoutMs = options.timeoutMs ?? 12_000;

  return {
    async walkingRoute(input: WalkingRouteInput): Promise<RoutedPath> {
      if (!options.apiKey) throw new Error('Geoapify API key is not configured for routing.');

      const cappedWaypoints = input.waypoints.slice(0, maxPoiWaypoints);
      const coordinates = [
        input.start,
        ...cappedWaypoints.map((waypoint) => waypoint.coordinate),
        input.start,
      ];
      const url = new URL('https://api.geoapify.com/v1/routing');

      url.searchParams.set('waypoints', coordinates.map(waypointParam).join('|'));
      url.searchParams.set('mode', 'walk');
      url.searchParams.set('apiKey', options.apiKey);

      const response = await fetchWithTimeout(
        fetcher,
        url.toString(),
        undefined,
        timeoutMs,
        `Geoapify routing timed out after ${timeoutMs}ms.`,
      );

      if (!response.ok) throw new Error(`Geoapify routing failed with ${response.status}`);

      const data = await response.json() as {
        features?: Array<{
          properties?: { distance?: number; time?: number };
          geometry?: unknown;
        }>;
      };
      const route = data.features?.[0];
      const routeCoordinates = lineStringCoordinates(route?.geometry);
      const routeDistance = route?.properties?.distance;
      const routeDuration = route?.properties?.time;

      if (
        !routeCoordinates ||
        routeCoordinates.length < 2 ||
        typeof routeDistance !== 'number' ||
        !Number.isFinite(routeDistance) ||
        typeof routeDuration !== 'number' ||
        !Number.isFinite(routeDuration)
      ) {
        throw new Error('Geoapify routing returned no usable route.');
      }

      return {
        geometry: routeCoordinates.map(([lng, lat]) => ({ lat, lng })),
        distanceMeters: Math.round(routeDistance),
        durationSeconds: Math.round(routeDuration),
        provider: 'geoapify-routing',
      };
    },
  };
}
