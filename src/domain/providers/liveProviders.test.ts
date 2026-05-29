import { describe, expect, it, vi } from 'vitest';
import { montrealCityProfile } from '../cityProfiles';
import { createGeoapifyGeocodingProvider } from './geoapifyGeocodingProvider';
import { createGeoapifyRoutingProvider } from './geoapifyRoutingProvider';
import { createMapboxRoutingProvider } from './mapboxRoutingProvider';
import { normalizeOverpassElement } from './overpassPOIImporter';

describe('live provider adapters', () => {
  it('filters Geoapify geocoding results to Montréal bounds', async () => {
    let requestedUrl = '';
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      requestedUrl = String(input);

      return {
        ok: true,
        json: async () => ({
          features: [
            {
              properties: {
                place_id: 'mtl',
                formatted: 'Station Laurier, Montréal',
                lat: 45.5272,
                lon: -73.5897,
              },
            },
            {
              properties: {
                place_id: 'toronto',
                formatted: 'Toronto Union Station',
                lat: 43.6453,
                lon: -79.3806,
              },
            },
          ],
        }),
      };
    }) as unknown as typeof fetch;
    const provider = createGeoapifyGeocodingProvider({
      apiKey: 'geo-key',
      fetcher,
    });

    const results = await provider.search('Station', montrealCityProfile);

    expect(results).toEqual([
      {
        id: 'mtl',
        label: 'Station Laurier, Montréal',
        coordinate: { lat: 45.5272, lng: -73.5897 },
      },
    ]);
    expect(decodeURIComponent(requestedUrl)).toContain('filter=rect:-73.975,45.395,-73.475,45.705');
  });

  it('does not return Geoapify reverse results with non-finite coordinates', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              place_id: 'bad-reverse',
              formatted: 'Bad reverse result',
            },
          },
        ],
      }),
    })) as unknown as typeof fetch;
    const provider = createGeoapifyGeocodingProvider({
      apiKey: 'geo-key',
      fetcher,
    });

    await expect(provider.reverse({
      lat: Number.NaN,
      lng: Number.POSITIVE_INFINITY,
    })).resolves.toBeNull();
  });

  it('times out Geoapify search requests instead of hanging address lookup', async () => {
    const fetcher = vi.fn(() => new Promise<Response>(() => {})) as unknown as typeof fetch;
    const provider = createGeoapifyGeocodingProvider({
      apiKey: 'geo-key',
      fetcher,
      timeoutMs: 1,
    });

    await expect(provider.search('Station Laurier', montrealCityProfile))
      .rejects.toThrow('Geoapify geocoding timed out after 1ms.');
  });

  it('formats Geoapify walking route requests with capped waypoints and full geometry', async () => {
    let requestedUrl = '';
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      requestedUrl = String(input);

      return {
        ok: true,
        json: async () => ({
          features: [
            {
              properties: { distance: 4800, time: 3600 },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [-73.5996, 45.5234],
                  [-73.59, 45.52],
                  [-73.5996, 45.5234],
                ],
              },
            },
          ],
        }),
      };
    }) as unknown as typeof fetch;
    const provider = createGeoapifyRoutingProvider({
      apiKey: 'geo-key',
      fetcher,
      maxPoiWaypoints: 8,
    });
    const waypoints = Array.from({ length: 12 }, (_, index) => ({
      id: `poi-${index}`,
      cityId: 'montreal' as const,
      name: `POI ${index}`,
      category: 'parks' as const,
      coordinate: { lat: 45.5 + index * 0.001, lng: -73.6 + index * 0.001 },
      source: 'osm-seed' as const,
      moods: ['green' as const],
      interestTags: ['parks' as const],
      computedRouteValue: 50,
      lastImportedAt: '2026-05-26T00:00:00.000Z',
    }));

    const route = await provider.walkingRoute({
      start: { lat: 45.5234, lng: -73.5996 },
      waypoints,
      targetMeters: 5000,
      profile: 'walking',
    });

    const url = new URL(requestedUrl);

    expect(url.origin).toBe('https://api.geoapify.com');
    expect(url.pathname).toBe('/v1/routing');
    expect(url.searchParams.get('mode')).toBe('walk');
    expect(url.searchParams.get('apiKey')).toBe('geo-key');
    expect(url.searchParams.get('waypoints')?.split('|')).toHaveLength(10);
    expect(route.provider).toBe('geoapify-routing');
    expect(route.geometry).toEqual([
      { lat: 45.5234, lng: -73.5996 },
      { lat: 45.52, lng: -73.59 },
      { lat: 45.5234, lng: -73.5996 },
    ]);
  });

  it('formats Mapbox walking requests with capped coordinates and full geometry', async () => {
    let requestedUrl = '';
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      requestedUrl = String(input);

      return {
      ok: true,
      json: async () => ({
        routes: [
          {
            geometry: {
              coordinates: [
                [-73.5996, 45.5234],
                [-73.59, 45.52],
                [-73.5996, 45.5234],
              ],
            },
            distance: 4800,
            duration: 3600,
          },
        ],
      }),
    };
    });
    const fetcher = fetchMock as unknown as typeof fetch;
    const provider = createMapboxRoutingProvider({
      accessToken: 'mapbox-token',
      fetcher,
      maxPoiWaypoints: 8,
    });
    const waypoints = Array.from({ length: 12 }, (_, index) => ({
      id: `poi-${index}`,
      cityId: 'montreal' as const,
      name: `POI ${index}`,
      category: 'parks' as const,
      coordinate: { lat: 45.5 + index * 0.001, lng: -73.6 + index * 0.001 },
      source: 'osm-seed' as const,
      moods: ['green' as const],
      interestTags: ['parks' as const],
      computedRouteValue: 50,
      lastImportedAt: '2026-05-26T00:00:00.000Z',
    }));

    const route = await provider.walkingRoute({
      start: { lat: 45.5234, lng: -73.5996 },
      waypoints,
      targetMeters: 5000,
      profile: 'walking',
    });

    const coordinatePart = requestedUrl.match(/walking\/([^?]+)/)?.[1] ?? '';

    expect(coordinatePart.split(';')).toHaveLength(10);
    expect(requestedUrl).toContain('geometries=geojson');
    expect(requestedUrl).toContain('overview=full');
    expect(route.provider).toBe('mapbox-directions');
  });

  it('rejects Mapbox walking responses with empty route geometry', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        routes: [
          {
            geometry: { coordinates: [] },
            distance: 4800,
            duration: 3600,
          },
        ],
      }),
    })) as unknown as typeof fetch;
    const provider = createMapboxRoutingProvider({
      accessToken: 'mapbox-token',
      fetcher,
    });

    await expect(provider.walkingRoute({
      start: { lat: 45.5234, lng: -73.5996 },
      waypoints: [],
      targetMeters: 5000,
      profile: 'walking',
    })).rejects.toThrow('Mapbox routing returned no usable route.');
  });

  it('times out Mapbox walking requests instead of hanging route generation', async () => {
    const fetcher = vi.fn(() => new Promise<Response>(() => {})) as unknown as typeof fetch;
    const provider = createMapboxRoutingProvider({
      accessToken: 'mapbox-token',
      fetcher,
      timeoutMs: 1,
    });

    await expect(provider.walkingRoute({
      start: { lat: 45.5234, lng: -73.5996 },
      waypoints: [],
      targetMeters: 5000,
      profile: 'walking',
    })).rejects.toThrow('Mapbox routing timed out after 1ms.');
  });

  it('rejects Mapbox walking responses with non-finite route numbers', async () => {
    const providerFor = (route: unknown) => createMapboxRoutingProvider({
      accessToken: 'mapbox-token',
      fetcher: vi.fn(async () => ({
        ok: true,
        json: async () => ({ routes: [route] }),
      })) as unknown as typeof fetch,
    });
    const request = {
      start: { lat: 45.5234, lng: -73.5996 },
      waypoints: [],
      targetMeters: 5000,
      profile: 'walking' as const,
    };

    await expect(providerFor({
      geometry: { coordinates: [[-73.5996, 45.5234], [-73.59, Number.NaN]] },
      distance: 4800,
      duration: 3600,
    }).walkingRoute(request)).rejects.toThrow('Mapbox routing returned no usable route.');

    await expect(providerFor({
      geometry: { coordinates: [[-73.5996, 45.5234], [-73.59, 45.52]] },
      distance: Number.POSITIVE_INFINITY,
      duration: 3600,
    }).walkingRoute(request)).rejects.toThrow('Mapbox routing returned no usable route.');
  });

  it('normalizes Overpass tags into app POI categories', () => {
    const cafe = normalizeOverpassElement({
      type: 'node',
      id: 123,
      lat: 45.52,
      lon: -73.6,
      tags: {
        name: 'Neighbourhood Cafe',
        amenity: 'cafe',
        opening_hours: 'Mo-Fr 08:00-17:00',
      },
    });

    expect(cafe).toEqual(
      expect.objectContaining({
        id: 'osm-node-123',
        category: 'cafes',
        name: 'Neighbourhood Cafe',
        source: 'osm-overpass',
        sourceOsmId: 'node/123',
      }),
    );
  });
});
