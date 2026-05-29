import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createGeoapifyGeocodingProvider } from '../domain/providers/geoapifyGeocodingProvider';
import { createGeoapifyRoutingProvider } from '../domain/providers/geoapifyRoutingProvider';
import { createMapboxRoutingProvider } from '../domain/providers/mapboxRoutingProvider';
import { createCachedPOIProvider } from '../domain/providers/cachedPOIProvider';
import { createSeedGeocodingProvider } from '../domain/providers/seedGeocodingProvider';
import { createSeedRoutingProvider } from '../domain/providers/seedRoutingProvider';
import { supportedInterests } from '../domain/walkOptions';
import { getPOICacheStatus, readPOICache } from './poiImport';
import { usableProviderEnvValue } from './envValidation';
import type { GeocodingProvider, POIProvider, RoutingProvider } from '../domain/mvpTypes';

function usableEnvValue(name: string) {
  return usableProviderEnvValue(process.env, name);
}

export function getPOICachePath() {
  return process.env.POI_CACHE_PATH ?? 'data/montreal-pois.json';
}

export function getRouteStorePath() {
  return process.env.ROUTE_STORE_PATH ?? 'data/route-store.json';
}

export function getMapTilerKey() {
  return usableEnvValue('MAPTILER_API_KEY') || usableEnvValue('VITE_MAPTILER_API_KEY');
}

export function positiveIntegerEnv(name: string, defaultValue: number) {
  const value = Number(process.env[name]);

  if (!Number.isInteger(value) || value <= 0) return defaultValue;
  return value;
}

export function createGeocodingProvider(): GeocodingProvider {
  const apiKey = usableEnvValue('GEOAPIFY_API_KEY');

  if (process.env.USE_SEEDED_PROVIDERS === 'true' || !apiKey) {
    return createSeedGeocodingProvider();
  }

  return createGeoapifyGeocodingProvider({ apiKey });
}

export function createRoutingProvider(): RoutingProvider {
  const accessToken = usableEnvValue('MAPBOX_ACCESS_TOKEN');
  const geoapifyKey = usableEnvValue('GEOAPIFY_API_KEY');

  if (process.env.USE_SEEDED_PROVIDERS === 'true') {
    return createSeedRoutingProvider();
  }

  if (geoapifyKey) return createGeoapifyRoutingProvider({ apiKey: geoapifyKey });
  if (!accessToken) return createSeedRoutingProvider();
  return createMapboxRoutingProvider({ accessToken });
}

export function createPOIProvider(): POIProvider {
  return createCachedPOIProvider({
    loadPois: () => readPOICache(getPOICachePath()),
  });
}

export function createFallbackRoutingProvider(): RoutingProvider {
  return createSeedRoutingProvider();
}

export function poiCoverageFor(categoryCounts: Record<string, number>) {
  const requiredCategories = [...supportedInterests];
  const missingCategories = requiredCategories.filter((category) => (categoryCounts[category] ?? 0) <= 0);

  return {
    requiredCategories,
    missingCategories,
    coverageReady: missingCategories.length === 0,
  };
}

function routeStoreStatus(storePath: string) {
  try {
    if (existsSync(storePath) && statSync(storePath).isDirectory()) {
      throw new Error('Route store path must be a JSON file, not a directory.');
    }

    const storeDir = dirname(storePath);
    const probePath = join(storeDir, `.route-store-probe-${randomUUID()}.tmp`);

    mkdirSync(storeDir, { recursive: true });
    writeFileSync(probePath, 'ok');
    unlinkSync(probePath);

    return {
      provider: 'json-file',
      configured: true,
      writable: true,
      storePath,
    };
  } catch (error) {
    return {
      provider: 'json-file',
      configured: false,
      writable: false,
      storePath,
      error: error instanceof Error ? error.message : 'Route store is not writable.',
    };
  }
}

export function getProviderConfiguration() {
  const seededMode = process.env.USE_SEEDED_PROVIDERS === 'true';
  const poiStatus = getPOICacheStatus(getPOICachePath());
  const routeStorePath = getRouteStorePath();
  const geoapifyKey = usableEnvValue('GEOAPIFY_API_KEY');
  const mapboxToken = usableEnvValue('MAPBOX_ACCESS_TOKEN');
  const liveRoutingProvider = geoapifyKey ? 'geoapify-routing' : mapboxToken ? 'mapbox-directions' : 'seed';
  const liveRoutingConfigured = !seededMode && Boolean(geoapifyKey || mapboxToken);

  return {
    seededMode,
    geocoding: {
      provider: seededMode || !geoapifyKey ? 'seed' : 'geoapify',
      configured: !seededMode && Boolean(geoapifyKey),
    },
    routing: {
      provider: seededMode ? 'seed' : liveRoutingProvider,
      configured: liveRoutingConfigured,
      fallbackProvider: 'seed',
    },
    pois: {
      provider: 'json-cache',
      ...poiStatus,
      ...poiCoverageFor(poiStatus.categoryCounts),
    },
    maps: {
      provider: 'maptiler',
      configured: Boolean(getMapTilerKey()),
    },
    persistence: routeStoreStatus(routeStorePath),
    operations: {
      provider: 'server',
      configured: true,
      routeGenerationRateLimit: {
        maxRequests: positiveIntegerEnv('ROUTE_GENERATION_RATE_LIMIT_MAX', 30),
        windowMs: positiveIntegerEnv('ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS', 60_000),
      },
      geocodeRateLimit: {
        maxRequests: positiveIntegerEnv('GEOCODE_RATE_LIMIT_MAX', 60),
        windowMs: positiveIntegerEnv('GEOCODE_RATE_LIMIT_WINDOW_MS', 60_000),
      },
      routeStoreRetention: {
        maxRequests: positiveIntegerEnv('ROUTE_STORE_MAX_REQUESTS', 200),
      },
    },
  };
}
