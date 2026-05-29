import { montrealCityProfile } from '../domain/cityProfiles';
import { buildMapTilerStyleUrl } from '../domain/mapConfig';
import { fetchWithTimeout } from '../domain/providers/fetchWithTimeout';
import { createGeoapifyGeocodingProvider } from '../domain/providers/geoapifyGeocodingProvider';
import { createGeoapifyRoutingProvider } from '../domain/providers/geoapifyRoutingProvider';
import { createMapboxRoutingProvider } from '../domain/providers/mapboxRoutingProvider';
import type { POI } from '../domain/mvpTypes';
import { usableProviderEnvValue } from './envValidation';

export type ProviderSelfTestStatus = 'ok' | 'skipped' | 'failed';

export interface ProviderSelfTestCheck {
  id: 'maptiler-style' | 'geoapify-geocode' | 'mapbox-walking-route';
  label: string;
  status: ProviderSelfTestStatus;
  message: string;
}

export interface ProviderSelfTestResult {
  ok: boolean;
  checkedAt: string;
  checks: ProviderSelfTestCheck[];
}

interface ProviderSelfTestOptions {
  env?: Record<string, string | undefined>;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

function envValue(env: Record<string, string | undefined>, key: string) {
  return usableProviderEnvValue(env, key);
}

async function mapTilerCheck(env: Record<string, string | undefined>, fetcher: typeof fetch, timeoutMs: number): Promise<ProviderSelfTestCheck> {
  const apiKey = envValue(env, 'MAPTILER_API_KEY') || envValue(env, 'VITE_MAPTILER_API_KEY');

  if (!apiKey) {
    return {
      id: 'maptiler-style',
      label: 'MapTiler style',
      status: 'skipped',
      message: 'MAPTILER_API_KEY is not configured.',
    };
  }

  try {
    const url = buildMapTilerStyleUrl(apiKey);
    const response = await fetchWithTimeout(
      fetcher,
      url,
      undefined,
      timeoutMs,
      `MapTiler style timed out after ${timeoutMs}ms.`,
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');

      throw new Error(`MapTiler style failed with ${response.status}${text ? `: ${text.slice(0, 120)}` : ''}`);
    }

    return {
      id: 'maptiler-style',
      label: 'MapTiler style',
      status: 'ok',
      message: 'MapTiler style loaded.',
    };
  } catch (error) {
    return {
      id: 'maptiler-style',
      label: 'MapTiler style',
      status: 'failed',
      message: error instanceof Error ? error.message : 'MapTiler style check failed.',
    };
  }
}

async function geoapifyCheck(env: Record<string, string | undefined>, fetcher: typeof fetch, timeoutMs: number): Promise<ProviderSelfTestCheck> {
  const apiKey = envValue(env, 'GEOAPIFY_API_KEY');

  if (!apiKey) {
    return {
      id: 'geoapify-geocode',
      label: 'Geoapify geocoding',
      status: 'skipped',
      message: 'GEOAPIFY_API_KEY is not configured.',
    };
  }

  try {
    const provider = createGeoapifyGeocodingProvider({ apiKey, fetcher, timeoutMs });
    const places = await provider.search('Station Laurier', montrealCityProfile);

    if (places.length === 0) throw new Error('Geoapify returned no Montréal geocoding candidates.');

    return {
      id: 'geoapify-geocode',
      label: 'Geoapify geocoding',
      status: 'ok',
      message: `Geoapify returned ${places.length} Montréal candidate${places.length === 1 ? '' : 's'}.`,
    };
  } catch (error) {
    return {
      id: 'geoapify-geocode',
      label: 'Geoapify geocoding',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Geoapify geocoding check failed.',
    };
  }
}

async function walkingRouteCheck(env: Record<string, string | undefined>, fetcher: typeof fetch, timeoutMs: number): Promise<ProviderSelfTestCheck> {
  const geoapifyKey = envValue(env, 'GEOAPIFY_API_KEY');
  const accessToken = envValue(env, 'MAPBOX_ACCESS_TOKEN');

  if (!geoapifyKey && !accessToken) {
    return {
      id: 'mapbox-walking-route',
      label: 'Walking route',
      status: 'skipped',
      message: 'No walking routing key is configured.',
    };
  }

  try {
    const provider = geoapifyKey
      ? createGeoapifyRoutingProvider({ apiKey: geoapifyKey, fetcher, maxPoiWaypoints: 1, timeoutMs })
      : createMapboxRoutingProvider({ accessToken, fetcher, maxPoiWaypoints: 1, timeoutMs });
    const waypoint: POI = {
      id: 'self-test-poi',
      cityId: 'montreal',
      name: 'Self-test POI',
      category: 'parks',
      coordinate: { lat: 45.524, lng: -73.598 },
      source: 'curated',
      moods: ['calm'],
      interestTags: ['parks'],
      computedRouteValue: 50,
      lastImportedAt: new Date().toISOString(),
    };
    const route = await provider.walkingRoute({
      start: { lat: 45.5234, lng: -73.5996 },
      waypoints: [waypoint],
      targetMeters: 1000,
      profile: 'walking',
    });

    return {
      id: 'mapbox-walking-route',
      label: 'Walking route',
      status: 'ok',
      message: `${route.provider} returned a ${route.distanceMeters}m walking route.`,
    };
  } catch (error) {
    return {
      id: 'mapbox-walking-route',
      label: 'Walking route',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Walking routing check failed.',
    };
  }
}

export async function runProviderSelfTest(options: ProviderSelfTestOptions = {}): Promise<ProviderSelfTestResult> {
  const env = options.env ?? process.env;
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 8_000;
  const checks = await Promise.all([
    mapTilerCheck(env, fetcher, timeoutMs),
    geoapifyCheck(env, fetcher, timeoutMs),
    walkingRouteCheck(env, fetcher, timeoutMs),
  ]);

  return {
    ok: checks.every((check) => check.status === 'ok'),
    checkedAt: new Date().toISOString(),
    checks,
  };
}
