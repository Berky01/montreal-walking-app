import { fetchWithTimeout } from '../domain/providers/fetchWithTimeout';
import { isPlaceholderProviderValue } from './envValidation';

export type DoctorStatus = 'ok' | 'warn' | 'fail' | 'skip';

export interface DoctorCheck {
  id: string;
  label: string;
  status: DoctorStatus;
  message: string;
  action?: string;
  details?: string[];
}

export interface DeploymentDoctorResult {
  ok: boolean;
  apiBaseUrl: string;
  publicBaseUrl?: string;
  checkedAt: string;
  checks: DoctorCheck[];
}

interface DeploymentDoctorOptions {
  apiBaseUrl: string;
  publicBaseUrl?: string;
  env: Record<string, string | undefined>;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

const defaultTokens = new Set(['change-me', 'replace-with-a-long-admin-token']);

function cleanBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.replace(/\/+$/, '');
}

function bodyLooksLikeAppShell(body: string) {
  return /<!doctype html/i.test(body) && /id=["']root["']/i.test(body);
}

function publicHttpsCheck(publicBaseUrl: string): DoctorCheck {
  try {
    const url = new URL(publicBaseUrl);

    if (url.protocol === 'https:') {
      return {
        id: 'public-https',
        label: 'Public HTTPS',
        status: 'ok',
        message: 'Public frontend URL uses HTTPS.',
      };
    }
  } catch {
    // The fetch checks will report reachability; this check reports the HTTPS requirement.
  }

  return {
    id: 'public-https',
    label: 'Public HTTPS',
    status: 'fail',
    message: 'Public frontend URL is not HTTPS.',
    action: 'Serve the public app over HTTPS so browser geolocation and secure APIs work.',
  };
}

function envValue(env: Record<string, string | undefined>, name: string) {
  return env[name]?.trim() ?? '';
}

function envCheck(id: string, label: string, envName: string, value: string, action: string): DoctorCheck {
  if (!value) {
    return {
      id,
      label,
      status: 'fail',
      message: `${envName} is missing.`,
      action,
    };
  }

  if (isPlaceholderProviderValue(value)) {
    return {
      id,
      label,
      status: 'fail',
      message: `${envName} is still a placeholder.`,
      action,
    };
  }

  return {
    id,
    label,
    status: 'ok',
    message: `${envName} is configured.`,
  };
}

function routingEnvCheck(env: Record<string, string | undefined>): DoctorCheck {
  const geoapifyKey = envValue(env, 'GEOAPIFY_API_KEY');
  const mapboxToken = envValue(env, 'MAPBOX_ACCESS_TOKEN');
  const hasGeoapifyRouting = Boolean(geoapifyKey) && !isPlaceholderProviderValue(geoapifyKey);
  const hasMapboxRouting = Boolean(mapboxToken) && !isPlaceholderProviderValue(mapboxToken);

  if (hasGeoapifyRouting || hasMapboxRouting) {
    return {
      id: 'env-routing',
      label: 'Walking routing',
      status: 'ok',
      message: hasGeoapifyRouting
        ? 'GEOAPIFY_API_KEY is configured for walking routing.'
        : 'MAPBOX_ACCESS_TOKEN is configured for walking routing.',
    };
  }

  return {
    id: 'env-routing',
    label: 'Walking routing',
    status: 'fail',
    message: 'No walking routing key is configured.',
    action: 'Set GEOAPIFY_API_KEY for Geoapify Routing, or MAPBOX_ACCESS_TOKEN for Mapbox Directions.',
  };
}

function adminTokenCheck(env: Record<string, string | undefined>): DoctorCheck {
  const token = envValue(env, 'ADMIN_TOKEN');

  if (!token) {
    return {
      id: 'env-admin-token',
      label: 'Admin token',
      status: 'fail',
      message: 'ADMIN_TOKEN is missing.',
      action: 'Set ADMIN_TOKEN to a long non-placeholder value before running admin checks.',
    };
  }

  if (defaultTokens.has(token)) {
    return {
      id: 'env-admin-token',
      label: 'Admin token',
      status: 'fail',
      message: 'ADMIN_TOKEN is still a placeholder.',
      action: 'Replace ADMIN_TOKEN with a long random value.',
    };
  }

  return {
    id: 'env-admin-token',
    label: 'Admin token',
    status: 'ok',
    message: 'ADMIN_TOKEN is configured.',
  };
}

function opsPanelCheck(env: Record<string, string | undefined>, publicBaseUrl?: string): DoctorCheck {
  const enabled = ['true', '1', 'yes'].includes(envValue(env, 'ENABLE_OPS_PANEL').toLowerCase());

  if (enabled && publicBaseUrl) {
    return {
      id: 'env-ops-panel',
      label: 'Ops panel',
      status: 'warn',
      message: 'ENABLE_OPS_PANEL is enabled.',
      action: 'Set ENABLE_OPS_PANEL=false before public launch; enable it only temporarily for operator checks.',
    };
  }

  return {
    id: 'env-ops-panel',
    label: 'Ops panel',
    status: 'ok',
    message: enabled ? 'ENABLE_OPS_PANEL is enabled for local operator access.' : 'ENABLE_OPS_PANEL is disabled.',
  };
}

function clientConfigCheck(payload: unknown, response: Response, env: Record<string, string | undefined>): DoctorCheck {
  const expectedMapKey = envValue(env, 'MAPTILER_API_KEY') || envValue(env, 'VITE_MAPTILER_API_KEY');

  if (!response.ok) {
    return {
      id: 'client-config',
      label: 'Runtime client config',
      status: 'fail',
      message: `Runtime client config returned ${response.status}.`,
      action: 'Confirm /api/client-config is served by the running API.',
    };
  }

  const config = payload as {
    map?: {
      provider?: unknown;
      mapTilerKey?: unknown;
    };
  };
  const browserMapKey = typeof config.map?.mapTilerKey === 'string' ? config.map.mapTilerKey.trim() : '';
  const mapConfigured = Boolean(browserMapKey) && !isPlaceholderProviderValue(browserMapKey);

  if (expectedMapKey && !mapConfigured) {
    return {
      id: 'client-config',
      label: 'Runtime client config',
      status: 'fail',
      message: 'Runtime client config is missing the browser MapTiler key.',
      action: 'Confirm MAPTILER_API_KEY is set in the running API environment and restart the API.',
    };
  }

  if (expectedMapKey && browserMapKey !== expectedMapKey) {
    return {
      id: 'client-config',
      label: 'Runtime client config',
      status: 'fail',
      message: 'Runtime client config exposes a different MapTiler key than the current environment.',
      action: 'Restart the API/frontend stack and confirm the reverse proxy reaches the current API service.',
    };
  }

  if (!expectedMapKey) {
    return {
      id: 'client-config',
      label: 'Runtime client config',
      status: 'skip',
      message: 'Skipped because MAPTILER_API_KEY is not configured.',
      action: 'Set MAPTILER_API_KEY before validating browser map configuration.',
    };
  }

  return {
    id: 'client-config',
    label: 'Runtime client config',
    status: 'ok',
    message: 'Runtime client config exposes the browser map key.',
  };
}

async function jsonCheck(
  id: string,
  label: string,
  request: () => Promise<Response>,
  evaluate: (payload: unknown, response: Response) => DoctorCheck | Promise<DoctorCheck>,
): Promise<DoctorCheck> {
  try {
    const response = await request();
    const payload = await response.json().catch(() => null);

    return await evaluate(payload, response);
  } catch (error) {
    return {
      id,
      label,
      status: 'fail',
      message: error instanceof Error ? error.message : `${label} failed.`,
      action: 'Confirm the API is running and reachable from this environment.',
    };
  }
}

function providerHealthOperationalChecks(payload: unknown): DoctorCheck[] {
  const providers = (payload as {
    providers?: {
      pois?: {
        cacheAvailable?: unknown;
        count?: unknown;
        coverageReady?: unknown;
        missingCategories?: unknown;
      };
      persistence?: {
        configured?: unknown;
        writable?: unknown;
        storePath?: unknown;
        error?: unknown;
      };
    };
  }).providers;
  const pois = providers?.pois;
  const persistence = providers?.persistence;
  const checks: DoctorCheck[] = [];

  if (pois) {
    const count = typeof pois.count === 'number' && Number.isFinite(pois.count) ? pois.count : 0;
    const missingCategories = Array.isArray(pois.missingCategories)
      ? pois.missingCategories.filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
      : [];
    const ready = Boolean(pois.cacheAvailable) && count > 0 && Boolean(pois.coverageReady);

    checks.push({
      id: 'poi-cache',
      label: 'POI cache',
      status: ready ? 'ok' : 'fail',
      message: ready
        ? `POI cache is ready with ${count} imported POIs.`
        : `POI cache is not ready${missingCategories.length > 0 ? `; missing categories: ${missingCategories.join(', ')}` : ''}.`,
      action: ready ? undefined : 'Run npm run import:pois or the protected Import POIs admin action, then rerun doctor.',
    });
  }

  if (persistence) {
    const configured = Boolean(persistence.configured);
    const writable = Boolean(persistence.writable);
    const storePath = typeof persistence.storePath === 'string' && persistence.storePath.trim()
      ? persistence.storePath
      : 'route store path';
    const error = typeof persistence.error === 'string' && persistence.error.trim()
      ? ` ${persistence.error}`
      : '';

    checks.push({
      id: 'route-persistence',
      label: 'Route persistence',
      status: configured && writable ? 'ok' : 'fail',
      message: configured && writable
        ? `Route persistence is writable at ${storePath}.`
        : `Route persistence is not writable at ${storePath}.${error}`,
      action: configured && writable ? undefined : 'Check ROUTE_STORE_PATH and server write permissions before serving live users.',
    });
  }

  return checks;
}

async function providerHealthChecks(
  request: () => Promise<Response>,
): Promise<DoctorCheck[]> {
  try {
    const response = await request();
    const payload = await response.json().catch(() => null);
    const liveReady = Boolean((payload as { liveReady?: boolean })?.liveReady);

    return [
      {
        id: 'health-providers',
        label: 'Provider health',
        status: liveReady ? 'ok' : 'fail',
        message: liveReady ? 'Provider health reports live ready.' : `Provider health is incomplete.${missingProvidersMessage(payload)}`,
        action: liveReady ? undefined : 'Use /api/health/providers for setup steps, or enable ENABLE_OPS_PANEL=true temporarily and open ?ops=1.',
      },
      ...providerHealthOperationalChecks(payload),
    ];
  } catch (error) {
    return [
      {
        id: 'health-providers',
        label: 'Provider health',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Provider health failed.',
        action: 'Confirm the API is running and reachable from this environment.',
      },
    ];
  }
}

function missingProvidersMessage(payload: unknown) {
  const missing = Array.isArray((payload as { missingLiveProviders?: unknown }).missingLiveProviders)
    ? (payload as { missingLiveProviders: string[] }).missingLiveProviders
    : [];

  return missing.length > 0 ? ` Missing: ${missing.join(', ')}.` : '';
}

function checkFailureDetails(payload: unknown) {
  const error = (payload as { error?: unknown }).error;

  if (typeof error === 'string' && error.trim().length > 0) return [error];

  const checks = Array.isArray((payload as { checks?: unknown }).checks)
    ? (payload as { checks: Array<{ label?: unknown; status?: unknown; message?: unknown; issues?: unknown }> }).checks
    : [];

  return checks.flatMap((check) => {
    const label = typeof check.label === 'string' && check.label.trim()
      ? check.label
      : 'Check';

    if (Array.isArray(check.issues) && check.issues.length > 0) {
      return check.issues
        .filter((issue): issue is string => typeof issue === 'string' && issue.trim().length > 0)
        .map((issue) => `${label}: ${issue}`);
    }

    if (
      typeof check.status === 'string' &&
      check.status !== 'ok' &&
      typeof check.message === 'string' &&
      check.message.trim().length > 0
    ) {
      return [`${label}: ${check.message}`];
    }

    return [];
  });
}

function liveProviderEnvReady(env: Record<string, string | undefined>) {
  const mapKey = envValue(env, 'MAPTILER_API_KEY') || envValue(env, 'VITE_MAPTILER_API_KEY');
  const geoapifyKey = envValue(env, 'GEOAPIFY_API_KEY');
  const mapboxToken = envValue(env, 'MAPBOX_ACCESS_TOKEN');

  return Boolean(mapKey) &&
    !isPlaceholderProviderValue(mapKey) &&
    Boolean(geoapifyKey) &&
    !isPlaceholderProviderValue(geoapifyKey) &&
    (
      !isPlaceholderProviderValue(geoapifyKey) ||
      (Boolean(mapboxToken) && !isPlaceholderProviderValue(mapboxToken))
    );
}

function publicRouteGenerationRequestBody() {
  return {
    cityId: 'montreal',
    start: {
      id: 'doctor-mile-end',
      label: 'Mile End doctor smoke',
      coordinate: { lat: 45.5234, lng: -73.5996 },
    },
    stepGoal: 5000,
    timeGoalMinutes: 45,
    mood: 'coffee',
    interests: ['cafes'],
    routeType: 'loop',
  };
}

function publicGeocodingCheck(payload: unknown, response: Response): DoctorCheck {
  if (!response.ok) {
    return {
      id: 'public-geocoding',
      label: 'Public geocoding',
      status: 'fail',
      message: `Public geocoding returned ${response.status}.`,
      action: 'Confirm the public reverse proxy forwards query strings to /api/geocode.',
      details: checkFailureDetails(payload),
    };
  }

  const places = Array.isArray((payload as { places?: unknown }).places)
    ? (payload as { places: unknown[] }).places
    : [];
  const provider = typeof (payload as { provider?: unknown }).provider === 'string'
    ? (payload as { provider: string }).provider
    : '';

  if (places.length === 0) {
    return {
      id: 'public-geocoding',
      label: 'Public geocoding',
      status: 'fail',
      message: 'Public geocoding did not return Montréal start candidates.',
      action: 'Confirm public /api/geocode reaches the live-ready API and Geoapify can resolve Station Laurier.',
    };
  }

  if (provider.toLowerCase().includes('seed')) {
    return {
      id: 'public-geocoding',
      label: 'Public geocoding',
      status: 'fail',
      message: 'Public geocoding returned seeded fallback results.',
      action: 'Confirm GEOAPIFY_API_KEY is configured in the public API service and rerun provider self-tests.',
    };
  }

  return {
    id: 'public-geocoding',
    label: 'Public geocoding',
    status: 'ok',
    message: 'Public geocoding returned live Montréal results.',
  };
}

async function publicRouteGenerationCheck(
  payload: unknown,
  response: Response,
  fetchRouteDetail: (routeId: string) => Promise<Response>,
): Promise<DoctorCheck> {
  if (!response.ok) {
    return {
      id: 'public-route-generation',
      label: 'Public route generation',
      status: 'fail',
      message: `Public route generation returned ${response.status}.`,
      action: 'Confirm the public reverse proxy allows POST requests and request bodies to /api/routes/generate.',
      details: checkFailureDetails(payload),
    };
  }

  const routes = Array.isArray((payload as { topRoutes?: unknown }).topRoutes)
    ? (payload as { topRoutes: Array<Record<string, unknown>> }).topRoutes
    : [];

  if (routes.length < 3) {
    return {
      id: 'public-route-generation',
      label: 'Public route generation',
      status: 'fail',
      message: 'Public route generation returned fewer than three visible route options.',
      action: 'Confirm public /api/routes/generate returns the three route options the MVP UI needs.',
      details: [`Visible route options: ${routes.length}`],
    };
  }

  const routeIds = routes.slice(0, 3).map((route) => (
    typeof route.id === 'string' && route.id.trim().length > 0 ? route.id.trim() : ''
  ));
  const routesWithoutIds = routeIds
    .map((routeId, index) => routeId ? null : `Route ${index + 1}`)
    .filter((route): route is string => route !== null);

  if (routesWithoutIds.length > 0) {
    return {
      id: 'public-route-generation',
      label: 'Public route generation',
      status: 'fail',
      message: 'Public route generation returned route options without detail IDs.',
      action: 'Confirm public /api/routes/generate returns stable route IDs for detail lookups.',
      details: routesWithoutIds,
    };
  }

  const detailResults = await Promise.all(routeIds.map(async (routeId, index) => {
    const response = await fetchRouteDetail(routeId);
    const payload = await response.json().catch(() => null);
    const route = routeFromDetailPayload(payload);

    return {
      routeId,
      index,
      response,
      route,
    };
  }));

  const failedDetails = detailResults
    .filter((detail) => !detail.response.ok || !detail.route)
    .map((detail) => {
      const reason = detail.response.ok ? 'detail payload did not include a route' : `detail returned ${detail.response.status}`;

      return routeDetailLabel(detail.routeId, detail.index, reason);
    });

  if (failedDetails.length > 0) {
    return {
      id: 'public-route-generation',
      label: 'Public route generation',
      status: 'fail',
      message: 'Public route detail lookup failed for generated route options.',
      action: 'Confirm public /api/routes/:id returns detail payloads for generated route IDs.',
      details: failedDetails,
    };
  }

  const detailRoutes = detailResults
    .map((detail) => detail.route)
    .filter((route): route is Record<string, unknown> => route !== null);
  const unusableRoutes = detailRoutes
    .map((route, index) => routeHasUsablePublicPayload(route) ? null : routeDetailLabel(routeIds[index], index))
    .filter((route): route is string => route !== null);

  if (unusableRoutes.length > 0) {
    return {
      id: 'public-route-generation',
      label: 'Public route generation',
      status: 'fail',
      message: 'Public route details are missing usable route facts or geometry.',
      action: 'Confirm public /api/routes/:id returns complete route detail payloads for the MVP route screen.',
      details: unusableRoutes,
    };
  }

  const routesWithoutContent = detailRoutes
    .map((route, index) => routeHasMvpContent(route) ? null : routeDetailLabel(routeIds[index], index))
    .filter((route): route is string => route !== null);

  if (routesWithoutContent.length > 0) {
    return {
      id: 'public-route-generation',
      label: 'Public route generation',
      status: 'fail',
      message: 'Public route details are missing POIs or explanations.',
      action: 'Confirm public /api/routes/:id returns POI anchors and route explanations for the MVP route screen.',
      details: routesWithoutContent,
    };
  }

  const providers = detailRoutes
    .map((route) => route.provider)
    .filter((provider): provider is string => typeof provider === 'string' && provider.trim().length > 0);
  const hasLiveRoute = providers.some((provider) => {
    const normalized = provider.toLowerCase();

    return !normalized.includes('seed') && normalized !== 'fallback-routing';
  });

  if (!hasLiveRoute) {
    return {
      id: 'public-route-generation',
      label: 'Public route generation',
      status: 'fail',
      message: routes.length > 0
        ? 'Public route generation returned non-live route geometry.'
        : 'Public route generation did not return route options.',
      action: 'Confirm public /api/routes/:id returns live routing provider details and rerun the route smoke test.',
      details: providers.length > 0 ? [`Providers: ${providers.join(', ')}`] : undefined,
    };
  }

  return {
    id: 'public-route-generation',
    label: 'Public route generation',
    status: 'ok',
    message: 'Public route generation returned three usable live route options.',
  };
}

function routeFromDetailPayload(payload: unknown) {
  const route = (payload as { route?: unknown })?.route ?? payload;

  return route && typeof route === 'object' && !Array.isArray(route)
    ? route as Record<string, unknown>
    : null;
}

function routeDetailLabel(routeId: string, index: number, reason?: string) {
  const label = `Route ${index + 1} (${routeId})`;

  return reason ? `${label}: ${reason}` : label;
}

function routeHasUsablePublicPayload(route: Record<string, unknown>) {
  return isPositiveFiniteNumber(route.distanceMeters)
    && isPositiveFiniteNumber(route.durationSeconds)
    && isPositiveFiniteNumber(route.estimatedSteps)
    && hasUsableRouteGeometry(route.geometry);
}

function routeHasMvpContent(route: Record<string, unknown>) {
  return Array.isArray(route.pois)
    && route.pois.length > 0
    && typeof route.explanation === 'string'
    && route.explanation.trim().length > 0;
}

function isPositiveFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function hasUsableRouteGeometry(geometry: unknown) {
  return Array.isArray(geometry)
    && geometry.length >= 2
    && geometry.every((point) => {
      const coordinate = point as { lat?: unknown; lng?: unknown };

      return typeof coordinate.lat === 'number'
        && Number.isFinite(coordinate.lat)
        && typeof coordinate.lng === 'number'
        && Number.isFinite(coordinate.lng);
    });
}

async function responseTextCheck(
  id: string,
  label: string,
  request: () => Promise<Response>,
  evaluate: (body: string, response: Response) => DoctorCheck,
): Promise<DoctorCheck> {
  try {
    const response = await request();
    const body = await response.text().catch(() => '');

    return evaluate(body, response);
  } catch (error) {
    return {
      id,
      label,
      status: 'fail',
      message: error instanceof Error ? error.message : `${label} failed.`,
      action: 'Confirm the public frontend URL is reachable from this environment.',
    };
  }
}

export async function runDeploymentDoctor(options: DeploymentDoctorOptions): Promise<DeploymentDoctorResult> {
  const apiBaseUrl = cleanBaseUrl(options.apiBaseUrl);
  const publicBaseUrl = options.publicBaseUrl ? cleanBaseUrl(options.publicBaseUrl) : undefined;
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 8_000;
  const adminToken = envValue(options.env, 'ADMIN_TOKEN');
  const adminReady = Boolean(adminToken) && !defaultTokens.has(adminToken);
  const expectedBrowserMapKey = envValue(options.env, 'MAPTILER_API_KEY') || envValue(options.env, 'VITE_MAPTILER_API_KEY');
  const checks: DoctorCheck[] = [
    adminTokenCheck(options.env),
    opsPanelCheck(options.env, publicBaseUrl),
    envCheck(
      'env-maptiler',
      'Map tiles',
      'MAPTILER_API_KEY',
      envValue(options.env, 'MAPTILER_API_KEY') || envValue(options.env, 'VITE_MAPTILER_API_KEY'),
      'Set MAPTILER_API_KEY to a browser-restricted MapTiler key.',
    ),
    envCheck(
      'env-geoapify',
      'Geocoding',
      'GEOAPIFY_API_KEY',
      envValue(options.env, 'GEOAPIFY_API_KEY'),
      'Set GEOAPIFY_API_KEY so address search uses live Montréal geocoding.',
    ),
    routingEnvCheck(options.env),
  ];

  checks.push(...await providerHealthChecks(
    () => fetchWithTimeout(
      fetcher,
      `${apiBaseUrl}/api/health/providers`,
      undefined,
      timeoutMs,
      `Provider health timed out after ${timeoutMs}ms.`,
    ),
  ));

  checks.push(await jsonCheck(
    'health-live',
    'Live health',
    () => fetchWithTimeout(
      fetcher,
      `${apiBaseUrl}/api/health/live`,
      undefined,
      timeoutMs,
      `Live health timed out after ${timeoutMs}ms.`,
    ),
    (payload, response) => {
      const liveReady = response.ok && Boolean((payload as { liveReady?: boolean })?.liveReady);

      return {
        id: 'health-live',
        label: 'Live health',
        status: liveReady ? 'ok' : 'fail',
        message: liveReady ? 'Live health endpoint returned ready.' : `Live health is not ready.${missingProvidersMessage(payload)}`,
        action: liveReady ? undefined : 'Fix missing providers until /api/health/live returns 200.',
      };
    },
  ));

  if (expectedBrowserMapKey) {
    checks.push(await jsonCheck(
      'client-config',
      'Runtime client config',
      () => fetchWithTimeout(
        fetcher,
        `${apiBaseUrl}/api/client-config`,
        undefined,
        timeoutMs,
        `Runtime client config timed out after ${timeoutMs}ms.`,
      ),
      (payload, response) => clientConfigCheck(payload, response, options.env),
    ));
  }

  if (publicBaseUrl) {
    checks.push(publicHttpsCheck(publicBaseUrl));

    checks.push(await responseTextCheck(
      'public-frontend',
      'Public frontend',
      () => fetchWithTimeout(
        fetcher,
        `${publicBaseUrl}/`,
        undefined,
        timeoutMs,
        `Public frontend timed out after ${timeoutMs}ms.`,
      ),
      (body, response) => ({
        id: 'public-frontend',
        label: 'Public frontend',
        status: response.ok && bodyLooksLikeAppShell(body) ? 'ok' : 'fail',
        message: response.ok && bodyLooksLikeAppShell(body)
          ? 'Public frontend is reachable.'
          : response.ok
            ? 'Public frontend did not return the app shell.'
            : `Public frontend returned ${response.status}.`,
        action: response.ok && bodyLooksLikeAppShell(body)
          ? undefined
          : response.ok
            ? 'Confirm the reverse proxy serves the frontend container, not an API response.'
            : 'Confirm the reverse proxy serves the frontend container.',
      }),
    ));

    checks.push(await jsonCheck(
      'public-api-proxy',
      'Public API proxy',
      () => fetchWithTimeout(
        fetcher,
        `${publicBaseUrl}/api/health/providers`,
        undefined,
        timeoutMs,
        `Public API proxy timed out after ${timeoutMs}ms.`,
      ),
      (payload, response) => {
        const liveReady = response.ok && Boolean((payload as { liveReady?: boolean })?.liveReady);

        return {
          id: 'public-api-proxy',
          label: 'Public API proxy',
          status: liveReady ? 'ok' : 'fail',
          message: liveReady ? 'Public API proxy reports live ready.' : `Public API proxy is not live ready.${missingProvidersMessage(payload)}`,
          action: liveReady ? undefined : 'Confirm the frontend nginx /api proxy reaches the API service.',
        };
      },
    ));

    checks.push(await jsonCheck(
      'public-live-health',
      'Public live health',
      () => fetchWithTimeout(
        fetcher,
        `${publicBaseUrl}/api/health/live`,
        undefined,
        timeoutMs,
        `Public live health timed out after ${timeoutMs}ms.`,
      ),
      (payload, response) => {
        const liveReady = response.ok && Boolean((payload as { liveReady?: boolean })?.liveReady);

        return {
          id: 'public-live-health',
          label: 'Public live health',
          status: liveReady ? 'ok' : 'fail',
          message: liveReady ? 'Public live health endpoint returned ready.' : `Public live health is not ready.${missingProvidersMessage(payload)}`,
          action: liveReady ? undefined : 'Confirm the public /api/health/live proxy reaches the live-ready API service.',
        };
      },
    ));

    if (expectedBrowserMapKey) {
      checks.push(await jsonCheck(
        'public-client-config',
        'Public runtime client config',
        () => fetchWithTimeout(
          fetcher,
          `${publicBaseUrl}/api/client-config`,
          undefined,
          timeoutMs,
          `Public runtime client config timed out after ${timeoutMs}ms.`,
        ),
        (payload, response) => {
          const check = clientConfigCheck(payload, response, options.env);

          return {
            ...check,
            id: 'public-client-config',
            label: 'Public runtime client config',
            message: check.status === 'ok'
              ? 'Public runtime client config exposes the browser map key.'
              : check.message,
            action: check.status === 'ok'
              ? undefined
              : 'Confirm the public /api/client-config proxy reaches the API and exposes MAPTILER_API_KEY.',
          };
        },
      ));
    }

    if (!liveProviderEnvReady(options.env)) {
      checks.push(
        {
          id: 'public-geocoding',
          label: 'Public geocoding',
          status: 'skip',
          message: 'Skipped because live provider keys are incomplete.',
          action: 'Set MAPTILER_API_KEY and GEOAPIFY_API_KEY before testing public geocoding.',
        },
        {
          id: 'public-route-generation',
          label: 'Public route generation',
          status: 'skip',
          message: 'Skipped because live provider keys are incomplete.',
          action: 'Set MAPTILER_API_KEY plus GEOAPIFY_API_KEY or MAPBOX_ACCESS_TOKEN before testing public route generation.',
        },
      );
    } else {
      checks.push(await jsonCheck(
        'public-geocoding',
        'Public geocoding',
        () => fetchWithTimeout(
          fetcher,
          `${publicBaseUrl}/api/geocode?query=Station%20Laurier&city=montreal`,
          undefined,
          timeoutMs,
          `Public geocoding timed out after ${timeoutMs}ms.`,
        ),
        publicGeocodingCheck,
      ));

      checks.push(await jsonCheck(
        'public-route-generation',
        'Public route generation',
        () => fetchWithTimeout(
          fetcher,
          `${publicBaseUrl}/api/routes/generate`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(publicRouteGenerationRequestBody()),
          },
          timeoutMs,
          `Public route generation timed out after ${timeoutMs}ms.`,
        ),
        (payload, response) => publicRouteGenerationCheck(
          payload,
          response,
          (routeId) => fetchWithTimeout(
            fetcher,
            `${publicBaseUrl}/api/routes/${encodeURIComponent(routeId)}`,
            undefined,
            timeoutMs,
            `Public route detail timed out after ${timeoutMs}ms.`,
          ),
        ),
      ));
    }
  }

  if (!adminReady) {
    checks.push(
      {
        id: 'provider-self-test',
        label: 'Provider self-test',
        status: 'skip',
        message: 'Skipped because ADMIN_TOKEN is not ready.',
        action: 'Set ADMIN_TOKEN to run provider self-tests.',
      },
      {
        id: 'route-smoke-test',
        label: 'Route smoke test',
        status: 'skip',
        message: 'Skipped because ADMIN_TOKEN is not ready.',
        action: 'Set ADMIN_TOKEN to run canonical Montréal route smoke tests.',
      },
    );
  } else {
    checks.push(await jsonCheck(
      'provider-self-test',
      'Provider self-test',
      () => fetchWithTimeout(
        fetcher,
        `${apiBaseUrl}/api/admin/provider-self-test`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: '{}',
        },
        timeoutMs,
        `Provider self-test timed out after ${timeoutMs}ms.`,
      ),
      (payload, response) => {
        const ok = response.ok && Boolean((payload as { ok?: boolean })?.ok);
        const details = ok ? [] : checkFailureDetails(payload);

        return {
          id: 'provider-self-test',
          label: 'Provider self-test',
          status: ok ? 'ok' : 'fail',
          message: ok ? 'Provider self-test passed.' : 'Provider self-test failed.',
          action: ok ? undefined : 'Enable ENABLE_OPS_PANEL=true temporarily, open ?ops=1, and inspect provider self-test details.',
          details: details.length > 0 ? details : undefined,
        };
      },
    ));

    checks.push(await jsonCheck(
      'route-smoke-test',
      'Route smoke test',
      () => fetchWithTimeout(
        fetcher,
        `${apiBaseUrl}/api/admin/route-smoke-test`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: '{}',
        },
        timeoutMs,
        `Route smoke test timed out after ${timeoutMs}ms.`,
      ),
      (payload, response) => {
        const ok = response.ok && Boolean((payload as { ok?: boolean })?.ok);
        const failed = (payload as { failed?: number })?.failed;
        const details = ok ? [] : checkFailureDetails(payload);

        return {
          id: 'route-smoke-test',
          label: 'Route smoke test',
          status: ok ? 'ok' : 'fail',
          message: ok ? 'Route smoke test passed.' : `Route smoke test failed${typeof failed === 'number' ? ` with ${failed} failed scenario(s)` : ''}.`,
          action: ok ? undefined : 'Enable ENABLE_OPS_PANEL=true temporarily, open ?ops=1, and inspect route smoke details.',
          details: details.length > 0 ? details : undefined,
        };
      },
    ));
  }

  return {
    ok: checks.every((check) => check.status === 'ok'),
    apiBaseUrl,
    publicBaseUrl,
    checkedAt: new Date().toISOString(),
    checks,
  };
}
