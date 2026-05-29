import type { Coordinate, RoutedPath, RoutingProvider, WalkingRouteInput } from '../mvpTypes';
import { fetchWithTimeout } from './fetchWithTimeout';

interface MapboxOptions {
  accessToken?: string;
  fetcher?: typeof fetch;
  maxPoiWaypoints?: number;
  timeoutMs?: number;
}

function coordinateParam(coordinate: Coordinate): string {
  return `${coordinate.lng},${coordinate.lat}`;
}

function isUsableCoordinatePair(value: unknown): value is [number, number] {
  return Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]);
}

export function createMapboxRoutingProvider(options: MapboxOptions): RoutingProvider {
  const fetcher = options.fetcher ?? fetch;
  const maxPoiWaypoints = options.maxPoiWaypoints ?? 8;
  const timeoutMs = options.timeoutMs ?? 12_000;

  return {
    async walkingRoute(input: WalkingRouteInput): Promise<RoutedPath> {
      if (!options.accessToken) throw new Error('Mapbox access token is not configured.');

      const cappedWaypoints = input.waypoints.slice(0, maxPoiWaypoints);
      const coordinates = [
        input.start,
        ...cappedWaypoints.map((waypoint) => waypoint.coordinate),
        input.start,
      ];
      const url = new URL(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates.map(coordinateParam).join(';')}`,
      );

      url.searchParams.set('access_token', options.accessToken);
      url.searchParams.set('geometries', 'geojson');
      url.searchParams.set('overview', 'full');
      url.searchParams.set('steps', 'false');

      const response = await fetchWithTimeout(
        fetcher,
        url.toString(),
        undefined,
        timeoutMs,
        `Mapbox routing timed out after ${timeoutMs}ms.`,
      );

      if (!response.ok) throw new Error(`Mapbox routing failed with ${response.status}`);

      const data = await response.json() as {
        routes?: Array<{
          geometry?: { coordinates?: Array<[number, number]> };
          distance?: number;
          duration?: number;
        }>;
      };
      const route = data.routes?.[0];
      const routeCoordinates = route?.geometry?.coordinates;
      const routeDistance = route?.distance;
      const routeDuration = route?.duration;

      if (
        !routeCoordinates ||
        routeCoordinates.length < 2 ||
        !routeCoordinates.every(isUsableCoordinatePair) ||
        typeof routeDistance !== 'number' ||
        !Number.isFinite(routeDistance) ||
        typeof routeDuration !== 'number' ||
        !Number.isFinite(routeDuration)
      ) {
        throw new Error('Mapbox routing returned no usable route.');
      }

      return {
        geometry: routeCoordinates.map(([lng, lat]) => ({ lat, lng })),
        distanceMeters: Math.round(routeDistance),
        durationSeconds: Math.round(routeDuration),
        provider: 'mapbox-directions',
      };
    },
  };
}
