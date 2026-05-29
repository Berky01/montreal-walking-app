import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getProviderConfiguration, getRouteStorePath } from './providerFactory';

describe('provider factory runtime paths', () => {
  it('uses a local JSON route store by default', () => {
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;

    delete process.env.ROUTE_STORE_PATH;

    try {
      expect(getRouteStorePath()).toBe('data/route-store.json');
      expect(getProviderConfiguration().persistence).toEqual(
        expect.objectContaining({
          provider: 'json-file',
          configured: true,
          writable: true,
          storePath: 'data/route-store.json',
        }),
      );
    } finally {
      if (previousRouteStorePath === undefined) {
        delete process.env.ROUTE_STORE_PATH;
      } else {
        process.env.ROUTE_STORE_PATH = previousRouteStorePath;
      }
    }
  });

  it('does not report seeded geocoding or routing as live configured even when keys exist', () => {
    const previousSeededMode = process.env.USE_SEEDED_PROVIDERS;
    const previousGeoapifyKey = process.env.GEOAPIFY_API_KEY;
    const previousMapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    process.env.USE_SEEDED_PROVIDERS = 'true';
    process.env.GEOAPIFY_API_KEY = 'geoapify-live-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'mapbox-live-token';

    try {
      const providers = getProviderConfiguration();

      expect(providers.seededMode).toBe(true);
      expect(providers.geocoding).toEqual({
        provider: 'seed',
        configured: false,
      });
      expect(providers.routing).toEqual({
        provider: 'seed',
        configured: false,
        fallbackProvider: 'seed',
      });
    } finally {
      if (previousSeededMode === undefined) delete process.env.USE_SEEDED_PROVIDERS;
      else process.env.USE_SEEDED_PROVIDERS = previousSeededMode;

      if (previousGeoapifyKey === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapifyKey;

      if (previousMapboxToken === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapboxToken;
    }
  });

  it('does not report placeholder provider keys as live configured', () => {
    const previousSeededMode = process.env.USE_SEEDED_PROVIDERS;
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapifyKey = process.env.GEOAPIFY_API_KEY;
    const previousMapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    process.env.USE_SEEDED_PROVIDERS = 'false';
    process.env.MAPTILER_API_KEY = 'replace-with-maptiler-key';
    process.env.GEOAPIFY_API_KEY = 'your-geoapify-api-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'mapbox-token-here';

    try {
      const providers = getProviderConfiguration();

      expect(providers.maps).toEqual({
        provider: 'maptiler',
        configured: false,
      });
      expect(providers.geocoding).toEqual({
        provider: 'seed',
        configured: false,
      });
      expect(providers.routing).toEqual({
        provider: 'seed',
        configured: false,
        fallbackProvider: 'seed',
      });
    } finally {
      if (previousSeededMode === undefined) delete process.env.USE_SEEDED_PROVIDERS;
      else process.env.USE_SEEDED_PROVIDERS = previousSeededMode;

      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapifyKey === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapifyKey;

      if (previousMapboxToken === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapboxToken;
    }
  });

  it('uses Geoapify as the live routing provider when only the Geoapify key is configured', () => {
    const previousSeededMode = process.env.USE_SEEDED_PROVIDERS;
    const previousGeoapifyKey = process.env.GEOAPIFY_API_KEY;
    const previousMapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    process.env.USE_SEEDED_PROVIDERS = 'false';
    process.env.GEOAPIFY_API_KEY = 'geoapify-live-key';
    delete process.env.MAPBOX_ACCESS_TOKEN;

    try {
      expect(getProviderConfiguration().routing).toEqual({
        provider: 'geoapify-routing',
        configured: true,
        fallbackProvider: 'seed',
      });
    } finally {
      if (previousSeededMode === undefined) delete process.env.USE_SEEDED_PROVIDERS;
      else process.env.USE_SEEDED_PROVIDERS = previousSeededMode;

      if (previousGeoapifyKey === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapifyKey;

      if (previousMapboxToken === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapboxToken;
    }
  });

  it('reports missing POI categories for incomplete MVP coverage', async () => {
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-poi-coverage-'));
    const cachePath = join(tempDir, 'montreal-pois.json');

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      categoryCounts: { cafes: 1 },
      pois: [
        {
          id: 'osm-only-cafe',
          cityId: 'montreal',
          name: 'Only Cafe',
          category: 'cafes',
          coordinate: { lat: 45.5235, lng: -73.5994 },
          source: 'osm-overpass',
          sourceOsmId: '42',
          moods: ['coffee'],
          interestTags: ['cafes'],
          computedRouteValue: 75,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        },
      ],
    }));
    process.env.POI_CACHE_PATH = cachePath;

    try {
      expect(getProviderConfiguration().pois).toEqual(
        expect.objectContaining({
          coverageReady: false,
          requiredCategories: ['parks', 'cafes', 'architecture', 'churches', 'viewpoints', 'waterfront', 'public-toilets', 'transit'],
          missingCategories: ['parks', 'architecture', 'churches', 'viewpoints', 'waterfront', 'public-toilets', 'transit'],
        }),
      );
    } finally {
      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('does not report persistence as configured when the route store path is not writable as a file', async () => {
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-route-store-dir-'));

    process.env.ROUTE_STORE_PATH = tempDir;

    try {
      expect(getProviderConfiguration().persistence).toEqual(
        expect.objectContaining({
          provider: 'json-file',
          configured: false,
          writable: false,
          storePath: tempDir,
          error: expect.stringContaining('file'),
        }),
      );
    } finally {
      if (previousRouteStorePath === undefined) delete process.env.ROUTE_STORE_PATH;
      else process.env.ROUTE_STORE_PATH = previousRouteStorePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('reports both route generation and geocoding rate limits in operational readiness', () => {
    const previousRouteMax = process.env.ROUTE_GENERATION_RATE_LIMIT_MAX;
    const previousRouteWindow = process.env.ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS;
    const previousGeocodeMax = process.env.GEOCODE_RATE_LIMIT_MAX;
    const previousGeocodeWindow = process.env.GEOCODE_RATE_LIMIT_WINDOW_MS;

    process.env.ROUTE_GENERATION_RATE_LIMIT_MAX = '25';
    process.env.ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS = '45000';
    process.env.GEOCODE_RATE_LIMIT_MAX = '80';
    process.env.GEOCODE_RATE_LIMIT_WINDOW_MS = '120000';

    try {
      expect(getProviderConfiguration().operations).toEqual(
        expect.objectContaining({
          routeGenerationRateLimit: {
            maxRequests: 25,
            windowMs: 45_000,
          },
          geocodeRateLimit: {
            maxRequests: 80,
            windowMs: 120_000,
          },
        }),
      );
    } finally {
      if (previousRouteMax === undefined) delete process.env.ROUTE_GENERATION_RATE_LIMIT_MAX;
      else process.env.ROUTE_GENERATION_RATE_LIMIT_MAX = previousRouteMax;

      if (previousRouteWindow === undefined) delete process.env.ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS;
      else process.env.ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS = previousRouteWindow;

      if (previousGeocodeMax === undefined) delete process.env.GEOCODE_RATE_LIMIT_MAX;
      else process.env.GEOCODE_RATE_LIMIT_MAX = previousGeocodeMax;

      if (previousGeocodeWindow === undefined) delete process.env.GEOCODE_RATE_LIMIT_WINDOW_MS;
      else process.env.GEOCODE_RATE_LIMIT_WINDOW_MS = previousGeocodeWindow;
    }
  });
});
