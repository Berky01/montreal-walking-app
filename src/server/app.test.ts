import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildServer } from './app';
import type { GeocodingProvider, POIProvider, RoutingProvider } from '../domain/mvpTypes';

describe('MVP API', () => {
  it('returns Montréal as the only supported city', async () => {
    const app = buildServer();
    const response = await app.inject({ method: 'GET', url: '/api/cities' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      cities: [
        expect.objectContaining({
          id: 'montreal',
          name: 'Montréal',
        }),
      ],
    });
  });

  it('reports provider configuration for live readiness checks', async () => {
    const app = buildServer();
    const response = await app.inject({ method: 'GET', url: '/api/health/providers' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        liveReady: expect.any(Boolean),
        missingLiveProviders: expect.any(Array),
        city: 'montreal',
        providers: expect.objectContaining({
          geocoding: expect.objectContaining({ provider: expect.any(String) }),
          routing: expect.objectContaining({ provider: expect.any(String) }),
          pois: expect.objectContaining({ provider: expect.any(String) }),
          maps: expect.objectContaining({ provider: 'maptiler' }),
          operations: expect.objectContaining({
            provider: 'server',
            configured: true,
            routeGenerationRateLimit: {
              maxRequests: 30,
              windowMs: 60_000,
            },
            routeStoreRetention: {
              maxRequests: 200,
            },
          }),
        }),
      }),
    );
  });

  it('returns actionable setup steps for missing live providers', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousViteMapTiler = process.env.VITE_MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-setup-steps-'));

    delete process.env.ADMIN_TOKEN;
    delete process.env.MAPTILER_API_KEY;
    delete process.env.VITE_MAPTILER_API_KEY;
    delete process.env.GEOAPIFY_API_KEY;
    delete process.env.MAPBOX_ACCESS_TOKEN;
    process.env.POI_CACHE_PATH = join(tempDir, 'missing-pois.json');

    try {
      const app = buildServer();
      const response = await app.inject({ method: 'GET', url: '/api/health/providers' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          liveReady: false,
          setupSteps: expect.arrayContaining([
            expect.objectContaining({
              id: 'maps',
              label: 'Configure production map tiles',
              status: 'missing',
              envVars: ['MAPTILER_API_KEY'],
            }),
            expect.objectContaining({
              id: 'geocoding',
              label: 'Configure address search',
              status: 'missing',
              envVars: ['GEOAPIFY_API_KEY'],
            }),
            expect.objectContaining({
              id: 'routing',
              label: 'Configure walking route geometry',
              status: 'missing',
              envVars: ['MAPBOX_ACCESS_TOKEN'],
            }),
            expect.objectContaining({
              id: 'poi-cache',
              label: 'Import Montréal POIs',
              status: 'missing',
            }),
            expect.objectContaining({
              id: 'admin-token',
              label: 'Secure admin tools',
              status: 'missing',
              envVars: ['ADMIN_TOKEN'],
            }),
          ]),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;

      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousViteMapTiler === undefined) delete process.env.VITE_MAPTILER_API_KEY;
      else process.env.VITE_MAPTILER_API_KEY = previousViteMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns 503 from the live health endpoint until required live providers are configured', async () => {
    const app = buildServer();
    const response = await app.inject({ method: 'GET', url: '/api/health/live' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        liveReady: false,
        missingLiveProviders: expect.arrayContaining(['maps', 'geocoding', 'routing', 'admin token']),
      }),
    );
  });

  it('returns 200 from the live health endpoint when required live providers are configured', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-live-health-'));
    const cachePath = join(tempDir, 'montreal-pois.json');

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: ['parks', 'cafes', 'architecture', 'churches', 'viewpoints', 'waterfront', 'public-toilets', 'transit']
        .map((category, index) => ({
          id: `osm-live-${category}`,
          cityId: 'montreal',
          name: `Live ${category}`,
          category,
          coordinate: { lat: 45.5235 + index * 0.0001, lng: -73.5994 },
          source: 'osm-overpass',
          sourceOsmId: String(42 + index),
          moods: ['coffee'],
          interestTags: [category],
          computedRouteValue: 75,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        })),
    }));
    process.env.MAPTILER_API_KEY = 'map-key';
    process.env.GEOAPIFY_API_KEY = 'geo-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'route-key';
    process.env.POI_CACHE_PATH = cachePath;
    process.env.ADMIN_TOKEN = 'live-health-secret';

    try {
      const app = buildServer();
      const response = await app.inject({ method: 'GET', url: '/api/health/live' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;

      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('keeps live health unavailable when the POI cache is empty', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-empty-poi-health-'));
    const cachePath = join(tempDir, 'montreal-pois.json');

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: [],
    }));
    process.env.MAPTILER_API_KEY = 'map-key';
    process.env.GEOAPIFY_API_KEY = 'geo-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'route-key';
    process.env.POI_CACHE_PATH = cachePath;
    process.env.ADMIN_TOKEN = 'live-health-secret';

    try {
      const app = buildServer();
      const response = await app.inject({ method: 'GET', url: '/api/health/live' });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual(
        expect.objectContaining({
          ok: false,
          liveReady: false,
          missingLiveProviders: expect.arrayContaining(['POI cache']),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;

      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('keeps live health unavailable when the POI cache lacks MVP interest coverage', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-poi-coverage-health-'));
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
    process.env.MAPTILER_API_KEY = 'map-key';
    process.env.GEOAPIFY_API_KEY = 'geo-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'route-key';
    process.env.POI_CACHE_PATH = cachePath;
    process.env.ADMIN_TOKEN = 'live-health-secret';

    try {
      const app = buildServer();
      const response = await app.inject({ method: 'GET', url: '/api/health/live' });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual(
        expect.objectContaining({
          ok: false,
          liveReady: false,
          missingLiveProviders: expect.arrayContaining(['POI cache']),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;

      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('keeps live health unavailable when seeded provider mode is enabled', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    const previousSeededMode = process.env.USE_SEEDED_PROVIDERS;
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-seeded-health-'));
    const cachePath = join(tempDir, 'montreal-pois.json');

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: [],
    }));
    process.env.USE_SEEDED_PROVIDERS = 'true';
    process.env.MAPTILER_API_KEY = 'map-key';
    process.env.GEOAPIFY_API_KEY = 'geo-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'route-key';
    process.env.POI_CACHE_PATH = cachePath;
    process.env.ADMIN_TOKEN = 'live-health-secret';

    try {
      const app = buildServer();
      const response = await app.inject({ method: 'GET', url: '/api/health/live' });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual(
        expect.objectContaining({
          ok: false,
          liveReady: false,
          missingLiveProviders: expect.arrayContaining(['geocoding', 'routing']),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;

      if (previousSeededMode === undefined) delete process.env.USE_SEEDED_PROVIDERS;
      else process.env.USE_SEEDED_PROVIDERS = previousSeededMode;

      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('does not report live ready when the admin token is missing or left at the default', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-admin-readiness-'));
    const cachePath = join(tempDir, 'montreal-pois.json');

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: [],
    }));
    process.env.MAPTILER_API_KEY = 'map-key';
    process.env.GEOAPIFY_API_KEY = 'geo-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'route-key';
    process.env.POI_CACHE_PATH = cachePath;
    process.env.ADMIN_TOKEN = 'change-me';

    try {
      const defaultTokenApp = buildServer();
      const defaultTokenHealth = await defaultTokenApp.inject({ method: 'GET', url: '/api/health/providers' });

      expect(defaultTokenHealth.json()).toEqual(
        expect.objectContaining({
          liveReady: false,
          missingLiveProviders: expect.arrayContaining(['admin token']),
          adminSecurity: {
            configured: true,
            usesDefault: true,
            ready: false,
          },
        }),
      );

      delete process.env.ADMIN_TOKEN;

      const missingTokenApp = buildServer();
      const missingTokenHealth = await missingTokenApp.inject({ method: 'GET', url: '/api/health/providers' });

      expect(missingTokenHealth.json()).toEqual(
        expect.objectContaining({
          liveReady: false,
          missingLiveProviders: expect.arrayContaining(['admin token']),
          adminSecurity: {
            configured: false,
            usesDefault: false,
            ready: false,
          },
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;

      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('exposes browser-safe runtime client config', async () => {
    const previousMapTilerKey = process.env.MAPTILER_API_KEY;
    const previousOpsPanel = process.env.ENABLE_OPS_PANEL;

    process.env.MAPTILER_API_KEY = 'runtime-map-key';
    process.env.ENABLE_OPS_PANEL = 'true';

    try {
      const app = buildServer();
      const response = await app.inject({ method: 'GET', url: '/api/client-config' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        city: 'montreal',
        map: {
          provider: 'maptiler',
          mapTilerKey: 'runtime-map-key',
        },
        ops: {
          enabled: true,
        },
      });
    } finally {
      if (previousMapTilerKey === undefined) {
        delete process.env.MAPTILER_API_KEY;
      } else {
        process.env.MAPTILER_API_KEY = previousMapTilerKey;
      }

      if (previousOpsPanel === undefined) {
        delete process.env.ENABLE_OPS_PANEL;
      } else {
        process.env.ENABLE_OPS_PANEL = previousOpsPanel;
      }
    }
  });

  it('keeps the ops panel disabled in runtime client config by default', async () => {
    const previousOpsPanel = process.env.ENABLE_OPS_PANEL;

    delete process.env.ENABLE_OPS_PANEL;

    try {
      const app = buildServer();
      const response = await app.inject({ method: 'GET', url: '/api/client-config' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(expect.objectContaining({
        ops: {
          enabled: false,
        },
      }));
    } finally {
      if (previousOpsPanel === undefined) {
        delete process.env.ENABLE_OPS_PANEL;
      } else {
        process.env.ENABLE_OPS_PANEL = previousOpsPanel;
      }
    }
  });

  it('returns cached POI matches as geocoded start candidates', async () => {
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-poi-geocode-'));
    const cachePath = join(tempDir, 'montreal-pois.json');
    const emptyGeocoder: GeocodingProvider = {
      async search() {
        return [];
      },
      async reverse() {
        return null;
      },
    };

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: [
        {
          id: 'osm-cafe-olimpico',
          cityId: 'montreal',
          name: 'Café Olimpico',
          category: 'cafes',
          coordinate: { lat: 45.5241, lng: -73.6011 },
          source: 'osm-overpass',
          sourceOsmId: '123',
          moods: ['coffee'],
          interestTags: ['cafes'],
          computedRouteValue: 95,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        },
      ],
    }));
    process.env.POI_CACHE_PATH = cachePath;

    try {
      const app = buildServer({ geocodingProvider: emptyGeocoder });
      const response = await app.inject({
        method: 'GET',
        url: '/api/geocode?city=montreal&query=Cafe%20Olimpico',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        provider: 'poi-cache',
        places: [
          {
            id: 'poi-osm-cafe-olimpico',
            label: 'Café Olimpico',
            coordinate: { lat: 45.5241, lng: -73.6011 },
          },
        ],
      });
    } finally {
      if (previousCachePath === undefined) {
        delete process.env.POI_CACHE_PATH;
      } else {
        process.env.POI_CACHE_PATH = previousCachePath;
      }

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('does not use seeded geocoding fallback when live geocoding is configured and no Montréal match exists', async () => {
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-live-geocode-empty-'));
    const cachePath = join(tempDir, 'montreal-pois.json');
    const emptyLiveGeocoder: GeocodingProvider = {
      async search() {
        return [];
      },
      async reverse() {
        return null;
      },
    };

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: [],
    }));
    process.env.GEOAPIFY_API_KEY = 'live-geocode-key';
    process.env.POI_CACHE_PATH = cachePath;

    try {
      const app = buildServer({ geocodingProvider: emptyLiveGeocoder });
      const response = await app.inject({
        method: 'GET',
        url: '/api/geocode?city=montreal&query=Unknown%20Start',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        provider: 'geoapify',
        places: [],
      });
    } finally {
      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('treats placeholder geocoding keys as unconfigured seed mode', async () => {
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-placeholder-geocode-'));

    process.env.GEOAPIFY_API_KEY = 'your-geoapify-api-key';
    process.env.POI_CACHE_PATH = join(tempDir, 'missing-pois.json');

    try {
      const app = buildServer();
      const response = await app.inject({
        method: 'GET',
        url: '/api/geocode?city=montreal&query=Mile%20End',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          provider: 'seed',
          places: expect.arrayContaining([
            expect.objectContaining({ label: 'Mile End' }),
          ]),
        }),
      );
    } finally {
      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns an explicit geocoding error when the live provider fails without a POI cache match', async () => {
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-live-geocode-failure-'));
    const cachePath = join(tempDir, 'montreal-pois.json');
    const failingLiveGeocoder: GeocodingProvider = {
      async search() {
        throw new Error('Geoapify request failed.');
      },
      async reverse() {
        return null;
      },
    };

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: [],
    }));
    process.env.GEOAPIFY_API_KEY = 'live-geocode-key';
    process.env.POI_CACHE_PATH = cachePath;

    try {
      const app = buildServer({ geocodingProvider: failingLiveGeocoder });
      const response = await app.inject({
        method: 'GET',
        url: '/api/geocode?city=montreal&query=Unknown%20Start',
      });

      expect(response.statusCode).toBe(502);
      expect(response.json()).toEqual({
        error: 'Geocoding provider failed.',
        fallback: 'No cached Montréal POI matched the start query.',
        action: 'Check GEOAPIFY_API_KEY, provider quota, or try a more specific Montréal start.',
      });
    } finally {
      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('does not use seeded POI matches when live geocoding fails and the POI cache is missing', async () => {
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-live-geocode-missing-pois-'));
    const failingLiveGeocoder: GeocodingProvider = {
      async search() {
        throw new Error('Geoapify request failed.');
      },
      async reverse() {
        return null;
      },
    };

    process.env.GEOAPIFY_API_KEY = 'live-geocode-key';
    process.env.POI_CACHE_PATH = join(tempDir, 'missing-pois.json');

    try {
      const app = buildServer({ geocodingProvider: failingLiveGeocoder });
      const response = await app.inject({
        method: 'GET',
        url: '/api/geocode?city=montreal&query=Cafe%20Olimpico',
      });

      expect(response.statusCode).toBe(502);
      expect(response.json()).toEqual({
        error: 'Geocoding provider failed.',
        fallback: 'No cached Montréal POI matched the start query.',
        action: 'Check GEOAPIFY_API_KEY, provider quota, or try a more specific Montréal start.',
      });
    } finally {
      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('rate limits geocoding per client address before using live provider quota', async () => {
    const previousMax = process.env.GEOCODE_RATE_LIMIT_MAX;
    const previousWindow = process.env.GEOCODE_RATE_LIMIT_WINDOW_MS;
    let geocodeCalls = 0;
    const geocodingProvider: GeocodingProvider = {
      async search() {
        geocodeCalls += 1;
        return [
          {
            id: `place-${geocodeCalls}`,
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
        ];
      },
      async reverse() {
        return null;
      },
    };

    process.env.GEOCODE_RATE_LIMIT_MAX = '2';
    process.env.GEOCODE_RATE_LIMIT_WINDOW_MS = '60000';

    try {
      const app = buildServer({ geocodingProvider });
      const first = await app.inject({
        method: 'GET',
        url: '/api/geocode?city=montreal&query=Mile%20End',
        headers: { 'x-forwarded-for': '203.0.113.20' },
      });
      const second = await app.inject({
        method: 'GET',
        url: '/api/geocode?city=montreal&query=Plateau',
        headers: { 'x-forwarded-for': '203.0.113.20' },
      });
      const limited = await app.inject({
        method: 'GET',
        url: '/api/geocode?city=montreal&query=Verdun',
        headers: { 'x-forwarded-for': '203.0.113.20' },
      });
      const otherClient = await app.inject({
        method: 'GET',
        url: '/api/geocode?city=montreal&query=Verdun',
        headers: { 'x-forwarded-for': '203.0.113.21' },
      });

      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(200);
      expect(limited.statusCode).toBe(429);
      expect(limited.headers['retry-after']).toBeDefined();
      expect(limited.json()).toEqual({
        error: 'Too many geocoding requests.',
        retryAfterSeconds: expect.any(Number),
      });
      expect(otherClient.statusCode).toBe(200);
      expect(geocodeCalls).toBe(3);
    } finally {
      if (previousMax === undefined) delete process.env.GEOCODE_RATE_LIMIT_MAX;
      else process.env.GEOCODE_RATE_LIMIT_MAX = previousMax;

      if (previousWindow === undefined) delete process.env.GEOCODE_RATE_LIMIT_WINDOW_MS;
      else process.env.GEOCODE_RATE_LIMIT_WINDOW_MS = previousWindow;
    }
  });

  it('runs provider self-tests behind admin authorization', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;

    process.env.ADMIN_TOKEN = 'self-test-secret';
    delete process.env.MAPTILER_API_KEY;
    delete process.env.GEOAPIFY_API_KEY;
    delete process.env.MAPBOX_ACCESS_TOKEN;

    try {
      const app = buildServer();
      const unauthorized = await app.inject({ method: 'POST', url: '/api/admin/provider-self-test' });
      const authorized = await app.inject({
        method: 'POST',
        url: '/api/admin/provider-self-test',
        headers: { 'x-admin-token': 'self-test-secret' },
      });

      expect(unauthorized.statusCode).toBe(401);
      expect(authorized.statusCode).toBe(200);
      expect(authorized.json()).toEqual(
        expect.objectContaining({
          ok: false,
          checks: expect.arrayContaining([
            expect.objectContaining({ id: 'maptiler-style', status: 'skipped' }),
            expect.objectContaining({ id: 'geoapify-geocode', status: 'skipped' }),
            expect.objectContaining({ id: 'mapbox-walking-route', status: 'skipped' }),
          ]),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;

      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;
    }
  });

  it('runs protected route smoke tests for canonical Montréal walks', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    process.env.ADMIN_TOKEN = 'route-smoke-secret';
    const poiProvider: POIProvider = {
      async findNearby(input) {
        return input.interests.map((interest, index) => ({
          id: `smoke-poi-${interest}-${index}`,
          cityId: 'montreal',
          name: `Smoke ${interest}`,
          category: interest,
          coordinate: {
            lat: input.center.lat + 0.002 + index * 0.001,
            lng: input.center.lng - 0.002 - index * 0.001,
          },
          source: 'curated',
          moods: [input.mood],
          interestTags: [interest],
          computedRouteValue: 80,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        }));
      },
    };
    const routingProvider: RoutingProvider = {
      async walkingRoute(input) {
        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / 1.35),
          provider: 'mapbox-directions',
        };
      },
    };

    try {
      const app = buildServer({ poiProvider, routingProvider, fallbackRoutingProvider: routingProvider });
      const unauthorized = await app.inject({ method: 'POST', url: '/api/admin/route-smoke-test' });

      expect(unauthorized.statusCode).toBe(401);

      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/route-smoke-test',
        headers: { 'x-admin-token': 'route-smoke-secret' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          ok: true,
          passed: 3,
          failed: 0,
          checkedAt: expect.any(String),
          checks: expect.arrayContaining([
            expect.objectContaining({
              id: 'mile-end-coffee',
              label: 'Mile End coffee loop',
              status: 'ok',
              routeCount: expect.any(Number),
              bestRoute: expect.objectContaining({
                provider: 'mapbox-directions',
                poiCount: expect.any(Number),
                score: expect.any(Number),
              }),
            }),
          ]),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;
    }
  });

  it('fails the route smoke gate when canonical routes only return warnings', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    process.env.ADMIN_TOKEN = 'route-smoke-secret';
    const poiProvider: POIProvider = {
      async findNearby(input) {
        return input.interests.map((interest, index) => ({
          id: `warning-poi-${interest}-${index}`,
          cityId: 'montreal',
          name: `Warning ${interest}`,
          category: interest,
          coordinate: {
            lat: input.center.lat + 0.002 + index * 0.001,
            lng: input.center.lng - 0.002 - index * 0.001,
          },
          source: 'curated',
          moods: [input.mood],
          interestTags: [interest],
          computedRouteValue: 80,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        }));
      },
    };
    const poorFitRoutingProvider: RoutingProvider = {
      async walkingRoute(input) {
        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: Math.round(input.targetMeters * 2),
          durationSeconds: Math.round((input.targetMeters * 2) / 1.35),
          provider: 'poor-fit-routing',
        };
      },
    };

    try {
      const app = buildServer({
        poiProvider,
        routingProvider: poorFitRoutingProvider,
        fallbackRoutingProvider: poorFitRoutingProvider,
      });
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/route-smoke-test',
        headers: { 'x-admin-token': 'route-smoke-secret' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          ok: false,
          passed: 0,
          failed: 3,
          checks: expect.arrayContaining([
            expect.objectContaining({
              id: 'mile-end-coffee',
              status: 'warn',
              issues: expect.arrayContaining([
                expect.stringContaining('outside the ±15% step target'),
              ]),
            }),
          ]),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;
    }
  });

  it('fails the route smoke gate when fewer than five route options are available', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    process.env.ADMIN_TOKEN = 'route-smoke-secret';
    const poiProvider: POIProvider = {
      async findNearby(input) {
        return input.interests.map((interest, index) => ({
          id: `few-options-poi-${interest}-${index}`,
          cityId: 'montreal',
          name: `Few options ${interest}`,
          category: interest,
          coordinate: {
            lat: input.center.lat + 0.002 + index * 0.001,
            lng: input.center.lng - 0.002 - index * 0.001,
          },
          source: 'curated',
          moods: [input.mood],
          interestTags: [interest],
          computedRouteValue: 80,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        }));
      },
    };
    const primaryProvider: RoutingProvider = {
      async walkingRoute() {
        throw new Error('Primary unavailable');
      },
    };
    const fallbackAttemptsByStart = new Map<string, number>();
    const fourOptionFallbackProvider: RoutingProvider = {
      async walkingRoute(input) {
        const startKey = `${input.start.lat},${input.start.lng}`;
        const fallbackAttempts = (fallbackAttemptsByStart.get(startKey) ?? 0) + 1;
        fallbackAttemptsByStart.set(startKey, fallbackAttempts);

        if (fallbackAttempts > 4) {
          throw new Error('Fallback could not produce another candidate');
        }

        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / 1.35),
          provider: 'mapbox-directions',
        };
      },
    };

    try {
      const app = buildServer({
        poiProvider,
        routingProvider: primaryProvider,
        fallbackRoutingProvider: fourOptionFallbackProvider,
      });
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/route-smoke-test',
        headers: { 'x-admin-token': 'route-smoke-secret' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          ok: false,
          passed: 0,
          failed: 3,
          checks: expect.arrayContaining([
            expect.objectContaining({
              id: 'mile-end-coffee',
              status: 'warn',
              routeCount: 4,
              issues: expect.arrayContaining([
                'Fewer than 5 route options returned.',
              ]),
            }),
          ]),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;
    }
  });

  it('fails the route smoke gate when best route scores are below launch quality', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    process.env.ADMIN_TOKEN = 'route-smoke-secret';
    const lowQualityPOIProvider: POIProvider = {
      async findNearby(input) {
        return input.interests.map((interest, index) => ({
          id: `low-quality-poi-${interest}-${index}`,
          cityId: 'montreal',
          name: `Low quality ${interest}`,
          category: interest,
          coordinate: {
            lat: input.center.lat + 0.002 + index * 0.001,
            lng: input.center.lng - 0.002 - index * 0.001,
          },
          source: 'curated',
          moods: ['calm'],
          interestTags: [interest],
          computedRouteValue: 30,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        }));
      },
    };
    const routingProvider: RoutingProvider = {
      async walkingRoute(input) {
        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / 1.35),
          provider: 'low-quality-routing',
        };
      },
    };

    try {
      const app = buildServer({
        poiProvider: lowQualityPOIProvider,
        routingProvider,
        fallbackRoutingProvider: routingProvider,
      });
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/route-smoke-test',
        headers: { 'x-admin-token': 'route-smoke-secret' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          ok: false,
          failed: 3,
          checks: expect.arrayContaining([
            expect.objectContaining({
              id: 'mile-end-coffee',
              status: 'warn',
              issues: expect.arrayContaining([
                expect.stringContaining('Best route score is below launch quality'),
              ]),
            }),
          ]),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;
    }
  });

  it('fails the route smoke gate when canonical routes use non-live routing geometry', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    process.env.ADMIN_TOKEN = 'route-smoke-secret';
    const poiProvider: POIProvider = {
      async findNearby(input) {
        return input.interests.map((interest, index) => ({
          id: `seeded-provider-poi-${interest}-${index}`,
          cityId: 'montreal',
          name: `Seeded provider ${interest}`,
          category: interest,
          coordinate: {
            lat: input.center.lat + 0.002 + index * 0.001,
            lng: input.center.lng - 0.002 - index * 0.001,
          },
          source: 'curated',
          moods: [input.mood],
          interestTags: [interest],
          computedRouteValue: 80,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        }));
      },
    };
    const seededRoutingProvider: RoutingProvider = {
      async walkingRoute(input) {
        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / 1.35),
          provider: 'seed-routing-provider',
        };
      },
    };

    try {
      const app = buildServer({
        poiProvider,
        routingProvider: seededRoutingProvider,
        fallbackRoutingProvider: seededRoutingProvider,
      });
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/route-smoke-test',
        headers: { 'x-admin-token': 'route-smoke-secret' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          ok: false,
          passed: 0,
          failed: 3,
          checks: expect.arrayContaining([
            expect.objectContaining({
              id: 'mile-end-coffee',
              status: 'warn',
              issues: expect.arrayContaining([
                expect.stringContaining('Best route used non-live routing provider seed-routing-provider'),
              ]),
            }),
          ]),
        }),
      );
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;
    }
  });

  it('disables admin endpoints until a non-default admin token is configured', async () => {
    const previousToken = process.env.ADMIN_TOKEN;

    try {
      delete process.env.ADMIN_TOKEN;

      const missingTokenApp = buildServer();
      const missingTokenResponse = await missingTokenApp.inject({
        method: 'POST',
        url: '/api/admin/provider-self-test',
      });

      expect(missingTokenResponse.statusCode).toBe(503);
      expect(missingTokenResponse.json()).toEqual({
        error: 'Admin token is not configured.',
      });

      process.env.ADMIN_TOKEN = 'change-me';

      const defaultTokenApp = buildServer();
      const defaultTokenResponse = await defaultTokenApp.inject({
        method: 'POST',
        url: '/api/admin/provider-self-test',
        headers: { 'x-admin-token': 'change-me' },
      });

      expect(defaultTokenResponse.statusCode).toBe(503);
      expect(defaultTokenResponse.json()).toEqual({
        error: 'Admin token uses a default placeholder.',
      });
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;
    }
  });

  it('fails protected POI import when Overpass returns partial category errors', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    process.env.ADMIN_TOKEN = 'import-secret';

    try {
      const app = buildServer({
        poiImporter: async () => ({
          imported: 1,
          source: 'overpass-api',
          cached: true,
          pois: [],
          categoryCounts: { cafes: 1 },
          importErrors: ['parks: 429 rate limited'],
        }),
      });
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/import-pois',
        headers: { 'x-admin-token': 'import-secret' },
      });

      expect(response.statusCode).toBe(502);
      expect(response.json()).toEqual({
        imported: false,
        count: 1,
        source: 'overpass-api',
        cached: true,
        importErrors: ['parks: 429 rate limited'],
        error: 'POI import errors: parks: 429 rate limited',
      });
    } finally {
      if (previousToken === undefined) delete process.env.ADMIN_TOKEN;
      else process.env.ADMIN_TOKEN = previousToken;
    }
  });

  it('reports imported POI cache status in live readiness checks', async () => {
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-health-pois-'));
    const cachePath = join(tempDir, 'montreal-pois.json');

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: [
        {
          id: 'osm-health-cafe',
          cityId: 'montreal',
          name: 'Health Cafe',
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
      const app = buildServer();
      const response = await app.inject({ method: 'GET', url: '/api/health/providers' });

      expect(response.statusCode).toBe(200);
      expect(response.json().providers.pois).toEqual(
        expect.objectContaining({
          provider: 'json-cache',
          configured: true,
          cacheAvailable: true,
          count: 1,
          importedAt: '2026-05-26T00:00:00.000Z',
          source: 'overpass-api',
          sourceLicense: 'ODbL',
        }),
      );
    } finally {
      if (previousCachePath === undefined) {
        delete process.env.POI_CACHE_PATH;
      } else {
        process.env.POI_CACHE_PATH = previousCachePath;
      }

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('generates top routes and hidden alternatives for a valid Montréal request', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload: {
        cityId: 'montreal',
        start: {
          label: 'Mile End',
          coordinate: { lat: 45.5234, lng: -73.5996 },
        },
        stepGoal: 8000,
        timeGoalMinutes: 70,
        mood: 'coffee',
        interests: ['cafes', 'architecture'],
        routeType: 'loop',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.topRoutes).toHaveLength(3);
    expect(body.remainingRoutes.length).toBeGreaterThanOrEqual(2);
    expect(body.fallback).toBe('Generated with seeded providers; configure live provider keys before launch.');
    expect(body.topRoutes[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        label: expect.any(String),
        explanation: expect.stringContaining('step goal'),
        estimatedSteps: expect.any(Number),
        durationSeconds: expect.any(Number),
        distanceMeters: expect.any(Number),
        poiCount: expect.any(Number),
        fitCategory: expect.any(String),
        fitReason: expect.any(String),
      }),
    );
    expect(body.topRoutes[0]).not.toHaveProperty('geometry');
    expect(body.topRoutes[0]).not.toHaveProperty('pois');
    expect(body.topRoutes[0]).not.toHaveProperty('exportLinks');

    const detail = await app.inject({
      method: 'GET',
      url: `/api/routes/${body.topRoutes[0].id}`,
    });

    expect(detail.statusCode).toBe(200);
    expect(detail.json().route).toEqual(
      expect.objectContaining({
        geometry: expect.any(Array),
        pois: expect.any(Array),
        exportLinks: expect.objectContaining({ gpx: expect.any(String) }),
      }),
    );
  });

  it('clamps impossible completed walk steps to session progress', async () => {
    const app = buildServer();
    const generated = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload: {
        cityId: 'montreal',
        start: {
          label: 'Mile End',
          coordinate: { lat: 45.5234, lng: -73.5996 },
        },
        stepGoal: 8000,
        timeGoalMinutes: 70,
        mood: 'coffee',
        interests: ['cafes', 'architecture'],
        routeType: 'loop',
      },
    });
    const routeId = generated.json().topRoutes[0].id;
    const started = await app.inject({
      method: 'POST',
      url: `/api/walks/${routeId}/start`,
    });
    const walkId = started.json().walk.id;

    const completed = await app.inject({
      method: 'POST',
      url: `/api/walks/${walkId}/complete`,
      payload: {
        elapsedSeconds: 120,
        estimatedSteps: 8792,
        discoveredPoiIds: [],
      },
    });

    expect(completed.statusCode).toBe(200);
    expect(completed.json().walk.estimatedSteps).toBeLessThan(1000);
    expect(completed.json().walk.estimatedSteps).toBeGreaterThan(0);

    const completedWalks = await app.inject({
      method: 'GET',
      url: '/api/walks?city=montreal&status=completed',
    });

    expect(completedWalks.statusCode).toBe(200);
    expect(completedWalks.json().walks[0].estimatedSteps).toBe(completed.json().walk.estimatedSteps);
  });

  it('generates routes when clients omit timeGoalMinutes', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload: {
        cityId: 'montreal',
        start: {
          label: 'Mile End',
          coordinate: { lat: 45.5234, lng: -73.5996 },
        },
        stepGoal: 8000,
        mood: 'coffee',
        interests: ['cafes', 'architecture'],
        routeType: 'loop',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().topRoutes).toHaveLength(3);
  });

  it('rejects explicitly invalid route generation durations', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload: {
        cityId: 'montreal',
        start: {
          label: 'Mile End',
          coordinate: { lat: 45.5234, lng: -73.5996 },
        },
        stepGoal: 8000,
        timeGoalMinutes: 14,
        mood: 'coffee',
        interests: ['cafes', 'architecture'],
        routeType: 'loop',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'Invalid route request.',
      }),
    );
  });

  it('returns useful fallback text when route generation produces no candidates', async () => {
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-empty-candidates-'));
    process.env.ROUTE_STORE_PATH = join(tempDir, 'route-store.json');
    const failingRoutingProvider = (message: string): RoutingProvider => ({
      async walkingRoute() {
        throw new Error(message);
      },
    });

    try {
      const app = buildServer({
        routingProvider: failingRoutingProvider('Mapbox route generation failed'),
        fallbackRoutingProvider: failingRoutingProvider('Seed route generation failed'),
      });
      const response = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'calm',
          interests: ['parks'],
          routeType: 'loop',
        },
      });

      expect(response.statusCode).toBe(422);
      expect(response.json()).toEqual(
        expect.objectContaining({
          error: 'No route candidates found.',
          fallback: expect.stringContaining('Mapbox route generation failed'),
        }),
      );
      expect(response.json().fallback).toContain('Seed route generation failed');
    } finally {
      if (previousRouteStorePath === undefined) {
        delete process.env.ROUTE_STORE_PATH;
      } else {
        process.env.ROUTE_STORE_PATH = previousRouteStorePath;
      }

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('does not serve persisted seeded routes when live routing is configured', async () => {
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-live-seeded-saved-route-'));
    const storePath = join(tempDir, 'route-store.json');

    await writeFile(storePath, JSON.stringify({
      routeRequests: [
        {
          id: 'request-seeded',
          createdAt: '2026-05-26T00:00:00.000Z',
          topRoutes: [
            {
              id: 'route-seeded-persisted',
              label: 'Recommended',
              cityId: 'montreal',
              geometry: [
                { lat: 45.5234, lng: -73.5996 },
                { lat: 45.524, lng: -73.598 },
                { lat: 45.5234, lng: -73.5996 },
              ],
              pois: [],
              distanceMeters: 3750,
              durationSeconds: 2700,
              estimatedSteps: 5000,
              provider: 'seed-routing-provider',
              debug: { targetMeters: 3750, waypointStrategy: 'seeded saved route' },
              score: {
                total: 80,
                breakdown: {
                  stepFit: 80,
                  timeFit: 80,
                  moodMatch: 0,
                  interestMatch: 0,
                  poiSpacing: 62,
                  detourPenalty: 0,
                  parkWaterfrontBonus: 0,
                  excessTurnPenalty: 0,
                },
              },
              explanation: 'Seed route',
              scoreSummary: ['80/100 step fit'],
              exportLinks: { googleMaps: 'https://maps.google.com', gpx: '<gpx></gpx>' },
            },
          ],
          remainingRoutes: [],
          diagnostics: { usedFallback: false },
        },
      ],
      feedback: [],
    }));
    process.env.MAPBOX_ACCESS_TOKEN = 'mapbox-live-key';
    process.env.ROUTE_STORE_PATH = storePath;

    try {
      const app = buildServer();
      const response = await app.inject({
        method: 'GET',
        url: '/api/routes/route-seeded-persisted',
      });

      expect(response.statusCode).toBe(410);
      expect(response.json()).toEqual({
        error: 'Saved route was generated by a non-live routing provider.',
        action: 'Generate a new route after live routing is configured.',
      });
    } finally {
      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousRouteStorePath === undefined) delete process.env.ROUTE_STORE_PATH;
      else process.env.ROUTE_STORE_PATH = previousRouteStorePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('does not return seeded fallback routes when the live routing provider fails', async () => {
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousSeededMode = process.env.USE_SEEDED_PROVIDERS;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-live-routing-failure-'));
    const cachePath = join(tempDir, 'montreal-pois.json');
    const storePath = join(tempDir, 'route-store.json');
    const categories = ['parks', 'cafes', 'architecture', 'churches', 'viewpoints', 'waterfront', 'public-toilets', 'transit'];
    const failingRoutingProvider: RoutingProvider = {
      async walkingRoute() {
        throw new Error('Mapbox routing failed with 429');
      },
    };

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: categories.map((category, index) => ({
        id: `osm-live-${category}`,
        cityId: 'montreal',
        name: `Live ${category}`,
        category,
        coordinate: { lat: 45.5235 + index * 0.0001, lng: -73.5994 },
        source: 'osm-overpass',
        sourceOsmId: String(10_000 + index),
        moods: ['coffee'],
        interestTags: [category],
        computedRouteValue: 80,
        lastImportedAt: '2026-05-26T00:00:00.000Z',
      })),
    }));
    process.env.MAPTILER_API_KEY = 'map-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'mapbox-live-key';
    process.env.GEOAPIFY_API_KEY = 'geo-live-key';
    process.env.USE_SEEDED_PROVIDERS = 'false';
    process.env.POI_CACHE_PATH = cachePath;
    process.env.ROUTE_STORE_PATH = storePath;

    try {
      const app = buildServer({
        routingProvider: failingRoutingProvider,
      });
      const response = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'coffee',
          interests: ['cafes'],
          routeType: 'loop',
        },
      });

      expect(response.statusCode).toBe(502);
      expect(response.json()).toEqual({
        error: 'Live routing provider failed.',
        fallback: expect.stringContaining('Mapbox routing failed with 429'),
        action: 'Check MAPBOX_ACCESS_TOKEN, provider quota, or run the route smoke test before serving live routes.',
      });
    } finally {
      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousSeededMode === undefined) delete process.env.USE_SEEDED_PROVIDERS;
      else process.env.USE_SEEDED_PROVIDERS = previousSeededMode;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      if (previousRouteStorePath === undefined) delete process.env.ROUTE_STORE_PATH;
      else process.env.ROUTE_STORE_PATH = previousRouteStorePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns a controlled setup error when generated routes cannot be persisted', async () => {
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-unwritable-route-store-'));

    process.env.ROUTE_STORE_PATH = tempDir;

    try {
      const app = buildServer();
      const response = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'calm',
          interests: ['parks'],
          routeType: 'loop',
        },
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        error: 'Route persistence unavailable.',
        action: 'Check ROUTE_STORE_PATH and server write permissions before generating live routes.',
      });
    } finally {
      if (previousRouteStorePath === undefined) {
        delete process.env.ROUTE_STORE_PATH;
      } else {
        process.env.ROUTE_STORE_PATH = previousRouteStorePath;
      }

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns a controlled route-quality error when fewer than five options are generated', async () => {
    const createFourOptionProvider = (): RoutingProvider => {
      let attempts = 0;

      return {
      async walkingRoute(input) {
        attempts += 1;

        if (attempts > 4) {
          throw new Error('Provider could not produce another route option');
        }

        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / 1.35),
          provider: 'four-option-routing',
        };
      },
      };
    };
    const app = buildServer({
      routingProvider: createFourOptionProvider(),
      fallbackRoutingProvider: createFourOptionProvider(),
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload: {
        cityId: 'montreal',
        start: {
          label: 'Mile End',
          coordinate: { lat: 45.5234, lng: -73.5996 },
        },
        stepGoal: 5000,
        timeGoalMinutes: 45,
        mood: 'coffee',
        interests: ['cafes'],
        routeType: 'loop',
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({
      error: 'Not enough route options found.',
      fallback: expect.stringContaining('Need at least 5 route options'),
      action: 'Try a different Montréal starting point, broader interests, or run route smoke tests before launch.',
    });
  });

  it('returns unique route ids for separate route generations', async () => {
    const app = buildServer();
    const payload = {
      cityId: 'montreal',
      start: {
        label: 'Mile End',
        coordinate: { lat: 45.5234, lng: -73.5996 },
      },
      stepGoal: 5000,
      timeGoalMinutes: 45,
      mood: 'coffee',
      interests: ['cafes'],
      routeType: 'loop',
    };
    const first = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload,
    });
    const second = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload,
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json().requestId).not.toBe(second.json().requestId);
    expect(first.json().topRoutes[0].id).not.toBe(second.json().topRoutes[0].id);
  });

  it('rate limits route generation per client address', async () => {
    const previousMax = process.env.ROUTE_GENERATION_RATE_LIMIT_MAX;
    const previousWindow = process.env.ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS;
    const payload = {
      cityId: 'montreal',
      start: {
        label: 'Mile End',
        coordinate: { lat: 45.5234, lng: -73.5996 },
      },
      stepGoal: 5000,
      timeGoalMinutes: 45,
      mood: 'coffee',
      interests: ['cafes'],
      routeType: 'loop',
    };

    process.env.ROUTE_GENERATION_RATE_LIMIT_MAX = '2';
    process.env.ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS = '60000';

    try {
      const app = buildServer();
      const first = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        headers: { 'x-forwarded-for': '203.0.113.10' },
        payload,
      });
      const second = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        headers: { 'x-forwarded-for': '203.0.113.10' },
        payload,
      });
      const limited = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        headers: { 'x-forwarded-for': '203.0.113.10' },
        payload,
      });
      const otherClient = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        headers: { 'x-forwarded-for': '203.0.113.11' },
        payload,
      });

      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(200);
      expect(limited.statusCode).toBe(429);
      expect(limited.headers['retry-after']).toBeDefined();
      expect(limited.json()).toEqual({
        error: 'Too many route generation requests.',
        retryAfterSeconds: expect.any(Number),
      });
      expect(otherClient.statusCode).toBe(200);
    } finally {
      if (previousMax === undefined) delete process.env.ROUTE_GENERATION_RATE_LIMIT_MAX;
      else process.env.ROUTE_GENERATION_RATE_LIMIT_MAX = previousMax;

      if (previousWindow === undefined) delete process.env.ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS;
      else process.env.ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS = previousWindow;
    }
  });

  it('rejects route generation starts outside Montréal with a client-facing validation error', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload: {
        cityId: 'montreal',
        start: {
          label: 'Toronto',
          coordinate: { lat: 43.6532, lng: -79.3832 },
        },
        stepGoal: 5000,
        timeGoalMinutes: 45,
        mood: 'calm',
        interests: ['parks'],
        routeType: 'loop',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'Invalid route request.',
      issues: ['Start point must be inside Montréal.'],
    });
  });

  it('uses imported POI cache data when generating routes', async () => {
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-pois-'));
    const cachePath = join(tempDir, 'montreal-pois.json');

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: [
        {
          id: 'osm-imported-cafe',
          cityId: 'montreal',
          name: 'Imported Cache Cafe',
          category: 'cafes',
          coordinate: { lat: 45.5235, lng: -73.5994 },
          source: 'osm-overpass',
          sourceOsmId: '9001',
          moods: ['coffee', 'energetic'],
          interestTags: ['cafes'],
          computedRouteValue: 95,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        },
      ],
    }));

    process.env.POI_CACHE_PATH = cachePath;

    try {
      const app = buildServer();
      const response = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'coffee',
          interests: ['cafes'],
          routeType: 'loop',
        },
      });

      expect(response.statusCode).toBe(200);
      const route = (await app.inject({
        method: 'GET',
        url: `/api/routes/${response.json().topRoutes[0].id}`,
      })).json().route;
      expect(route.pois).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'osm-imported-cafe',
            source: 'osm-overpass',
            name: 'Imported Cache Cafe',
          }),
        ]),
      );
    } finally {
      if (previousCachePath === undefined) {
        delete process.env.POI_CACHE_PATH;
      } else {
        process.env.POI_CACHE_PATH = previousCachePath;
      }

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('blocks live route generation when the Montréal POI cache is not ready', async () => {
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousSeededMode = process.env.USE_SEEDED_PROVIDERS;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-live-missing-pois-'));

    process.env.MAPTILER_API_KEY = 'map-key';
    process.env.GEOAPIFY_API_KEY = 'geo-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'route-key';
    process.env.USE_SEEDED_PROVIDERS = 'false';
    process.env.POI_CACHE_PATH = join(tempDir, 'missing-pois.json');

    try {
      const app = buildServer();
      const response = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'coffee',
          interests: ['cafes'],
          routeType: 'loop',
        },
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        error: 'POI cache is not ready for live route generation.',
        issues: expect.arrayContaining(['POI cache is missing or empty.']),
        action: 'Run the Montréal POI import and confirm /api/health/live is ready before generating live routes.',
      });
    } finally {
      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousSeededMode === undefined) delete process.env.USE_SEEDED_PROVIDERS;
      else process.env.USE_SEEDED_PROVIDERS = previousSeededMode;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('blocks mixed live route generation when routing is configured but geocoding is missing', async () => {
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousSeededMode = process.env.USE_SEEDED_PROVIDERS;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-partial-live-route-'));
    const cachePath = join(tempDir, 'montreal-pois.json');
    const storePath = join(tempDir, 'route-store.json');
    const categories = ['parks', 'cafes', 'architecture', 'churches', 'viewpoints', 'waterfront', 'public-toilets', 'transit'];

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: categories.map((category, index) => ({
        id: `partial-live-${category}`,
        cityId: 'montreal',
        name: `Partial live ${category}`,
        category,
        coordinate: { lat: 45.5235 + index * 0.0001, lng: -73.5994 },
        source: 'osm-overpass',
        sourceOsmId: String(20_000 + index),
        moods: ['coffee'],
        interestTags: [category],
        computedRouteValue: 80,
        lastImportedAt: '2026-05-26T00:00:00.000Z',
      })),
    }));
    process.env.MAPTILER_API_KEY = 'map-key';
    delete process.env.GEOAPIFY_API_KEY;
    process.env.MAPBOX_ACCESS_TOKEN = 'route-key';
    process.env.USE_SEEDED_PROVIDERS = 'false';
    process.env.POI_CACHE_PATH = cachePath;
    process.env.ROUTE_STORE_PATH = storePath;

    try {
      const app = buildServer();
      const response = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'coffee',
          interests: ['cafes'],
          routeType: 'loop',
        },
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        error: 'Live route setup is incomplete.',
        issues: ['Live geocoding is missing while live routing is configured.'],
        action: 'Configure MAPTILER_API_KEY, GEOAPIFY_API_KEY, and MAPBOX_ACCESS_TOKEN, or set USE_SEEDED_PROVIDERS=true for local seeded testing.',
      });
    } finally {
      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousSeededMode === undefined) delete process.env.USE_SEEDED_PROVIDERS;
      else process.env.USE_SEEDED_PROVIDERS = previousSeededMode;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      if (previousRouteStorePath === undefined) delete process.env.ROUTE_STORE_PATH;
      else process.env.ROUTE_STORE_PATH = previousRouteStorePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('blocks live route generation when the browser map provider is missing', async () => {
    const previousMapTiler = process.env.MAPTILER_API_KEY;
    const previousGeoapify = process.env.GEOAPIFY_API_KEY;
    const previousMapbox = process.env.MAPBOX_ACCESS_TOKEN;
    const previousSeededMode = process.env.USE_SEEDED_PROVIDERS;
    const previousCachePath = process.env.POI_CACHE_PATH;
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-live-missing-map-'));
    const cachePath = join(tempDir, 'montreal-pois.json');
    const storePath = join(tempDir, 'route-store.json');
    const categories = ['parks', 'cafes', 'architecture', 'churches', 'viewpoints', 'waterfront', 'public-toilets', 'transit'];

    await writeFile(cachePath, JSON.stringify({
      importedAt: '2026-05-26T00:00:00.000Z',
      source: 'overpass-api',
      sourceLicense: 'ODbL',
      pois: categories.map((category, index) => ({
        id: `missing-map-${category}`,
        cityId: 'montreal',
        name: `Missing map ${category}`,
        category,
        coordinate: { lat: 45.5235 + index * 0.0001, lng: -73.5994 },
        source: 'osm-overpass',
        sourceOsmId: String(30_000 + index),
        moods: ['coffee'],
        interestTags: [category],
        computedRouteValue: 80,
        lastImportedAt: '2026-05-26T00:00:00.000Z',
      })),
    }));
    delete process.env.MAPTILER_API_KEY;
    process.env.GEOAPIFY_API_KEY = 'geo-key';
    process.env.MAPBOX_ACCESS_TOKEN = 'route-key';
    process.env.USE_SEEDED_PROVIDERS = 'false';
    process.env.POI_CACHE_PATH = cachePath;
    process.env.ROUTE_STORE_PATH = storePath;

    try {
      const app = buildServer();
      const response = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'coffee',
          interests: ['cafes'],
          routeType: 'loop',
        },
      });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({
        error: 'Live route setup is incomplete.',
        issues: ['Map tiles are missing while live route generation is configured.'],
        action: 'Configure MAPTILER_API_KEY, GEOAPIFY_API_KEY, and MAPBOX_ACCESS_TOKEN, or set USE_SEEDED_PROVIDERS=true for local seeded testing.',
      });
    } finally {
      if (previousMapTiler === undefined) delete process.env.MAPTILER_API_KEY;
      else process.env.MAPTILER_API_KEY = previousMapTiler;

      if (previousGeoapify === undefined) delete process.env.GEOAPIFY_API_KEY;
      else process.env.GEOAPIFY_API_KEY = previousGeoapify;

      if (previousMapbox === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
      else process.env.MAPBOX_ACCESS_TOKEN = previousMapbox;

      if (previousSeededMode === undefined) delete process.env.USE_SEEDED_PROVIDERS;
      else process.env.USE_SEEDED_PROVIDERS = previousSeededMode;

      if (previousCachePath === undefined) delete process.env.POI_CACHE_PATH;
      else process.env.POI_CACHE_PATH = previousCachePath;

      if (previousRouteStorePath === undefined) delete process.env.ROUTE_STORE_PATH;
      else process.env.ROUTE_STORE_PATH = previousRouteStorePath;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('stores structured feedback without requiring an account', async () => {
    const app = buildServer();
    const generated = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload: {
        cityId: 'montreal',
        start: {
          label: 'Mile End',
          coordinate: { lat: 45.5234, lng: -73.5996 },
        },
        stepGoal: 5000,
        timeGoalMinutes: 45,
        mood: 'calm',
        interests: ['parks'],
        routeType: 'loop',
      },
    });
    const routeId = generated.json().topRoutes[0].id;

    const feedback = await app.inject({
      method: 'POST',
      url: `/api/routes/${routeId}/feedback`,
      payload: {
        labels: ['great-route', 'would-walk-again'],
        note: 'Good after-work option.',
      },
    });

    expect(feedback.statusCode).toBe(201);
    expect(feedback.json()).toEqual({
      saved: true,
      feedback: expect.objectContaining({
        routeId,
        labels: ['great-route', 'would-walk-again'],
      }),
    });
  });

  it('returns a controlled setup error when route feedback cannot be persisted', async () => {
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-feedback-store-failure-'));
    const storePath = join(tempDir, 'route-store.json');

    process.env.ROUTE_STORE_PATH = storePath;

    try {
      const app = buildServer();
      const generated = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'calm',
          interests: ['parks'],
          routeType: 'loop',
        },
      });
      const routeId = generated.json().topRoutes[0].id;

      await unlink(storePath);
      await mkdir(storePath);

      const feedback = await app.inject({
        method: 'POST',
        url: `/api/routes/${routeId}/feedback`,
        payload: {
          labels: ['bad-street'],
          note: 'Could not finish this route.',
        },
      });

      expect(feedback.statusCode).toBe(503);
      expect(feedback.json()).toEqual({
        error: 'Feedback persistence unavailable.',
        action: 'Check ROUTE_STORE_PATH and server write permissions before collecting live feedback.',
      });
    } finally {
      if (previousRouteStorePath === undefined) {
        delete process.env.ROUTE_STORE_PATH;
      } else {
        process.env.ROUTE_STORE_PATH = previousRouteStorePath;
      }

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects route feedback labels outside the supported structured set', async () => {
    const app = buildServer();
    const generated = await app.inject({
      method: 'POST',
      url: '/api/routes/generate',
      payload: {
        cityId: 'montreal',
        start: {
          label: 'Mile End',
          coordinate: { lat: 45.5234, lng: -73.5996 },
        },
        stepGoal: 5000,
        timeGoalMinutes: 45,
        mood: 'calm',
        interests: ['parks'],
        routeType: 'loop',
      },
    });
    const routeId = generated.json().topRoutes[0].id;

    const feedback = await app.inject({
      method: 'POST',
      url: `/api/routes/${routeId}/feedback`,
      payload: {
        labels: ['great-route', 'freeform-complaint'],
      },
    });

    expect(feedback.statusCode).toBe(400);
    expect(feedback.json()).toEqual(
      expect.objectContaining({
        error: 'Invalid feedback.',
      }),
    );
  });

  it('returns protected route feedback summaries for route-quality review', async () => {
    const previousToken = process.env.ADMIN_TOKEN;
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-feedback-review-'));

    process.env.ADMIN_TOKEN = 'feedback-secret';
    process.env.ROUTE_STORE_PATH = join(tempDir, 'route-store.json');

    try {
      const app = buildServer();
      const generated = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'calm',
          interests: ['parks'],
          routeType: 'loop',
        },
      });
      const routeId = generated.json().topRoutes[0].id;

      await app.inject({
        method: 'POST',
        url: `/api/routes/${routeId}/feedback`,
        payload: {
          labels: ['boring', 'bad-street'],
          note: 'Too much traffic on the return leg.',
        },
      });

      const unauthorized = await app.inject({
        method: 'GET',
        url: '/api/admin/feedback',
      });
      const authorized = await app.inject({
        method: 'GET',
        url: '/api/admin/feedback',
        headers: { 'x-admin-token': 'feedback-secret' },
      });

      expect(unauthorized.statusCode).toBe(401);
      expect(authorized.statusCode).toBe(200);
      expect(authorized.json()).toEqual({
        count: 1,
        labelCounts: {
          boring: 1,
          'bad-street': 1,
        },
        feedback: [
          expect.objectContaining({
            routeId,
            labels: ['boring', 'bad-street'],
            note: 'Too much traffic on the return leg.',
          }),
        ],
      });
    } finally {
      if (previousToken === undefined) {
        delete process.env.ADMIN_TOKEN;
      } else {
        process.env.ADMIN_TOKEN = previousToken;
      }

      if (previousRouteStorePath === undefined) {
        delete process.env.ROUTE_STORE_PATH;
      } else {
        process.env.ROUTE_STORE_PATH = previousRouteStorePath;
      }

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns provider diagnostics for route debug inspection', async () => {
    const previousToken = process.env.ADMIN_TOKEN;

    process.env.ADMIN_TOKEN = 'route-debug-secret';

    try {
      const app = buildServer();
      const generated = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'calm',
          interests: ['parks'],
          routeType: 'loop',
        },
      });
      const routeId = generated.json().topRoutes[0].id;

      const debug = await app.inject({
        method: 'GET',
        url: `/api/admin/route-debug/${routeId}`,
        headers: { 'x-admin-token': 'route-debug-secret' },
      });

      expect(debug.statusCode).toBe(200);
      const debugBody = debug.json();

      expect(debug.json()).toEqual(
        expect.objectContaining({
          routeId,
          provider: expect.any(String),
          waypointCount: expect.any(Number),
          selectedPois: expect.any(Array),
          diagnostics: expect.objectContaining({
            usedFallback: expect.any(Boolean),
          }),
        }),
      );
      expect(debugBody.waypointCount).toBe(debugBody.debug.requestedWaypointCount);
      expect(debugBody.waypointCount).toBeGreaterThan(debugBody.selectedPois.length + 2);
    } finally {
      if (previousToken === undefined) {
        delete process.env.ADMIN_TOKEN;
      } else {
        process.env.ADMIN_TOKEN = previousToken;
      }
    }
  });

  it('protects route debug diagnostics when an admin token is configured', async () => {
    const previousToken = process.env.ADMIN_TOKEN;

    process.env.ADMIN_TOKEN = 'debug-secret';

    try {
      const app = buildServer();
      const generated = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'calm',
          interests: ['parks'],
          routeType: 'loop',
        },
      });
      const routeId = generated.json().topRoutes[0].id;

      const unauthorized = await app.inject({
        method: 'GET',
        url: `/api/admin/route-debug/${routeId}`,
      });
      const authorized = await app.inject({
        method: 'GET',
        url: `/api/admin/route-debug/${routeId}`,
        headers: { 'x-admin-token': 'debug-secret' },
      });

      expect(unauthorized.statusCode).toBe(401);
      expect(authorized.statusCode).toBe(200);
    } finally {
      if (previousToken === undefined) {
        delete process.env.ADMIN_TOKEN;
      } else {
        process.env.ADMIN_TOKEN = previousToken;
      }
    }
  });

  it('saves routes, tracks walk sessions, records POI actions, and returns progress', async () => {
    const previousRouteStorePath = process.env.ROUTE_STORE_PATH;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-session-api-'));

    process.env.ROUTE_STORE_PATH = join(tempDir, 'route-store.json');

    try {
      const app = buildServer();
      const generated = await app.inject({
        method: 'POST',
        url: '/api/routes/generate',
        payload: {
          cityId: 'montreal',
          start: {
            label: 'Mile End',
            coordinate: { lat: 45.5234, lng: -73.5996 },
          },
          stepGoal: 5000,
          timeGoalMinutes: 45,
          mood: 'coffee',
          interests: ['cafes'],
          routeType: 'loop',
        },
      });
      const routeSummary = generated.json().topRoutes[0];
      const route = (await app.inject({
        method: 'GET',
        url: `/api/routes/${routeSummary.id}`,
      })).json().route;
      const poiId = route.pois[0].id;

      const saveRoute = await app.inject({
        method: 'POST',
        url: `/api/routes/${route.id}/save`,
      });
      const savedRoutes = await app.inject({
        method: 'GET',
        url: '/api/routes/saved',
      });
      const startWalk = await app.inject({
        method: 'POST',
        url: `/api/walks/${route.id}/start`,
      });
      const walkId = startWalk.json().walk.id;
      const updateWalk = await app.inject({
        method: 'PATCH',
        url: `/api/walks/${walkId}`,
        payload: {
          status: 'paused',
          elapsedSeconds: 300,
          estimatedSteps: 700,
        },
      });
      const poiAction = await app.inject({
        method: 'POST',
        url: `/api/walks/${walkId}/pois/${poiId}`,
        payload: { action: 'discovered' },
      });
      const completeWalk = await app.inject({
        method: 'POST',
        url: `/api/walks/${walkId}/complete`,
        payload: {
          elapsedSeconds: 1800,
          estimatedSteps: 3240,
          discoveredPoiIds: [poiId],
        },
      });
      const progress = await app.inject({
        method: 'GET',
        url: '/api/progress?city=montreal',
      });
      const completedWalks = await app.inject({
        method: 'GET',
        url: '/api/walks?city=montreal&status=completed',
      });

      expect(saveRoute.statusCode).toBe(201);
      expect(saveRoute.json().savedRoute.route.id).toBe(route.id);
      expect(savedRoutes.statusCode).toBe(200);
      expect(savedRoutes.json().savedRoutes).toHaveLength(1);
      expect(startWalk.statusCode).toBe(201);
      expect(startWalk.json().walk.route.id).toBe(route.id);
      expect(updateWalk.statusCode).toBe(200);
      expect(updateWalk.json().walk.status).toBe('paused');
      expect(poiAction.statusCode).toBe(201);
      expect(poiAction.json().poiAction.poi).toEqual(expect.objectContaining({
        poiId,
        routeId: route.id,
      }));
      expect(completeWalk.statusCode).toBe(200);
      expect(completeWalk.json().walk.status).toBe('completed');
      expect(progress.statusCode).toBe(200);
      expect(progress.json().progress).toEqual(expect.objectContaining({
        placesDiscovered: 1,
        loopsCompleted: 1,
        savedRoutes: 1,
      }));
      expect(completedWalks.statusCode).toBe(200);
      expect(completedWalks.json().walks).toEqual([
        expect.objectContaining({
          id: walkId,
          routeId: route.id,
          routeLabel: route.label,
          status: 'completed',
          estimatedSteps: 3240,
          discoveredCount: 1,
        }),
      ]);
      expect(JSON.stringify(completedWalks.json().walks)).not.toContain('coordinates');
    } finally {
      if (previousRouteStorePath === undefined) {
        delete process.env.ROUTE_STORE_PATH;
      } else {
        process.env.ROUTE_STORE_PATH = previousRouteStorePath;
      }

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects unknown walk, route, and POI ids with controlled errors', async () => {
    const app = buildServer();
    const saveMissing = await app.inject({
      method: 'POST',
      url: '/api/routes/missing/save',
    });
    const startMissing = await app.inject({
      method: 'POST',
      url: '/api/walks/missing/start',
    });
    const updateMissing = await app.inject({
      method: 'PATCH',
      url: '/api/walks/walk-missing',
      payload: { status: 'paused' },
    });

    expect(saveMissing.statusCode).toBe(404);
    expect(saveMissing.json()).toEqual({ error: 'Route not found.' });
    expect(startMissing.statusCode).toBe(404);
    expect(startMissing.json()).toEqual({ error: 'Route not found.' });
    expect(updateMissing.statusCode).toBe(404);
    expect(updateMissing.json()).toEqual({ error: 'Walk not found.' });
  });
});
