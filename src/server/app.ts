import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { montrealCityProfile } from '../domain/cityProfiles';
import { supportedFeedbackLabels } from '../domain/feedback';
import { createSeedGeocodingProvider } from '../domain/providers/seedGeocodingProvider';
import { generateRouteCandidatesWithFallback, validateMVPWalkRequest } from '../domain/routeEngine';
import type { RouteEngineWithFallbackDependencies } from '../domain/routeEngine';
import { rankScoredRoutes, scoreRouteCandidate } from '../domain/routeScoring';
import type { MVPWalkRequest, RouteSummary, ScoredRoute } from '../domain/mvpTypes';
import type { GeocodingProvider, POIProvider, RoutingProvider } from '../domain/mvpTypes';
import { supportedInterests, supportedMoods } from '../domain/walkOptions';
import {
  createFallbackRoutingProvider,
  createGeocodingProvider,
  createPOIProvider,
  createRoutingProvider,
  getMapTilerKey,
  getPOICachePath,
  getProviderConfiguration,
  getRouteStorePath,
  positiveIntegerEnv,
} from './providerFactory';
import { getPOICacheStatus, importOverpassPOIs, readPOICache } from './poiImport';
import { searchPOIStartPlaces } from './poiPlaceSearch';
import { runProviderSelfTest } from './providerSelfTest';
import { InMemoryRouteRepository, JsonRouteRepository } from './repository';

const coordinateSchema = z.object({
  lat: z.number().finite(),
  lng: z.number().finite(),
});

const routeRequestSchema = z.object({
  cityId: z.literal('montreal'),
  start: z.object({
    id: z.string().optional(),
    label: z.string().min(1),
    coordinate: coordinateSchema,
  }),
  stepGoal: z.number().finite().int().min(1500).max(20000),
  timeGoalMinutes: z.number().finite().int().min(15).max(240).optional(),
  mood: z.enum(supportedMoods),
  interests: z.array(z.enum(supportedInterests)).min(1),
  routeType: z.literal('loop'),
});

const feedbackLabelSchema = z.enum(supportedFeedbackLabels);

const feedbackSchema = z.object({
  labels: z.array(feedbackLabelSchema).min(1),
  note: z.string().max(500).optional(),
});

const walkUpdateSchema = z.object({
  status: z.enum(['active', 'paused', 'completed']).optional(),
  elapsedSeconds: z.number().finite().int().min(0).optional(),
  estimatedSteps: z.number().finite().int().min(0).optional(),
  discoveredPoiIds: z.array(z.string().min(1)).optional(),
});

const poiActionSchema = z.object({
  action: z.enum(['save', 'skip', 'discovered']),
});

function scopedRouteIds(routes: ReturnType<typeof rankScoredRoutes>, requestId: string) {
  return routes.map((route) => ({
    ...route,
    id: `${requestId}-${route.id}`,
  }));
}

function adminSecurityFor() {
  const adminToken = process.env.ADMIN_TOKEN?.trim() ?? '';
  const defaultTokens = new Set(['change-me', 'replace-with-a-long-admin-token']);

  return {
    configured: adminToken.length > 0,
    usesDefault: defaultTokens.has(adminToken),
    ready: adminToken.length > 0 && !defaultTokens.has(adminToken),
  };
}

function adminAccessFor(token: string | string[] | undefined) {
  const adminToken = process.env.ADMIN_TOKEN?.trim() ?? '';
  const security = adminSecurityFor();

  if (!security.configured) {
    return { allowed: false as const, statusCode: 503, error: 'Admin token is not configured.' };
  }

  if (security.usesDefault) {
    return { allowed: false as const, statusCode: 503, error: 'Admin token uses a default placeholder.' };
  }

  return {
    allowed: token === adminToken,
    statusCode: 401,
    error: 'Unauthorized.',
  } as const;
}

function opsPanelEnabled() {
  const value = process.env.ENABLE_OPS_PANEL?.trim().toLowerCase();

  return value === 'true' || value === '1' || value === 'yes';
}

function liveReadinessFor(
  providers: ReturnType<typeof getProviderConfiguration>,
  adminSecurity = adminSecurityFor(),
) {
  const hasUsablePOICache =
    providers.pois.cacheAvailable &&
    providers.pois.count > 0 &&
    providers.pois.coverageReady;
  const missingLiveProviders = [
    providers.maps.configured ? null : 'maps',
    providers.geocoding.configured ? null : 'geocoding',
    providers.routing.configured ? null : 'routing',
    hasUsablePOICache ? null : 'POI cache',
    providers.persistence.configured ? null : 'persistence',
    adminSecurity.ready ? null : 'admin token',
  ].filter((item): item is string => Boolean(item));

  return {
    liveReady: missingLiveProviders.length === 0,
    missingLiveProviders,
    setupSteps: setupStepsFor(providers, adminSecurity),
  };
}

function livePOICacheIssues(providers: ReturnType<typeof getProviderConfiguration>) {
  const issues: string[] = [];

  if (!providers.pois.cacheAvailable || providers.pois.count <= 0) {
    issues.push('POI cache is missing or empty.');
  }

  if (!providers.pois.coverageReady && providers.pois.missingCategories.length > 0) {
    issues.push(`POI cache is missing MVP categories: ${providers.pois.missingCategories.join(', ')}.`);
  }

  return issues;
}

function liveRouteSetupIssues(providers: ReturnType<typeof getProviderConfiguration>) {
  if (providers.seededMode) return [];

  const hasPartialLiveRouteSetup = providers.geocoding.configured || providers.routing.configured;
  const issues: string[] = [];

  if (!hasPartialLiveRouteSetup) return issues;
  if (!providers.maps.configured) {
    issues.push('Map tiles are missing while live route generation is configured.');
  }
  if (!providers.geocoding.configured) {
    issues.push('Live geocoding is missing while live routing is configured.');
  }
  if (!providers.routing.configured) {
    issues.push('Live routing is missing while live geocoding is configured.');
  }

  return issues;
}

async function readPOIsForStartSearch(liveGeocodingConfigured: boolean) {
  const cachePath = getPOICachePath();

  if (liveGeocodingConfigured) {
    const status = getPOICacheStatus(cachePath);

    if (!status.cacheAvailable || status.count <= 0) return [];
  }

  return readPOICache(cachePath);
}

function setupStepsFor(
  providers: ReturnType<typeof getProviderConfiguration>,
  adminSecurity = adminSecurityFor(),
) {
  return [
    {
      id: 'maps',
      label: 'Configure production map tiles',
      status: providers.maps.configured ? 'ready' : 'missing',
      envVars: ['MAPTILER_API_KEY'],
      action: 'Create a MapTiler browser key, set MAPTILER_API_KEY, then redeploy so MapLibre can load production basemap tiles.',
    },
    {
      id: 'geocoding',
      label: 'Configure address search',
      status: providers.geocoding.configured ? 'ready' : 'missing',
      envVars: ['GEOAPIFY_API_KEY'],
      action: 'Create a Geoapify geocoding key and set GEOAPIFY_API_KEY so address search uses live Montréal results instead of seeded fallback data.',
    },
    {
      id: 'routing',
      label: 'Configure walking route geometry',
      status: providers.routing.configured ? 'ready' : 'missing',
      envVars: ['MAPBOX_ACCESS_TOKEN'],
      action: 'Create a Mapbox access token and set MAPBOX_ACCESS_TOKEN so generated loops follow real walking streets and paths.',
    },
    {
      id: 'poi-cache',
      label: 'Import Montréal POIs',
      status: providers.pois.cacheAvailable && providers.pois.count > 0 && providers.pois.coverageReady ? 'ready' : 'missing',
      envVars: ['POI_CACHE_PATH'],
      action: 'Set an admin token, then run Import POIs to cache Montréal OpenStreetMap cafés, parks, churches, viewpoints, toilets, and waterfront features.',
    },
    {
      id: 'persistence',
      label: 'Keep route and feedback history',
      status: providers.persistence.configured ? 'ready' : 'missing',
      envVars: ['ROUTE_STORE_PATH'],
      action: 'Keep JSON persistence enabled and set ROUTE_STORE_PATH if the default data/route-store.json path is not suitable for deployment.',
    },
    {
      id: 'admin-token',
      label: 'Secure admin tools',
      status: adminSecurity.ready ? 'ready' : 'missing',
      envVars: ['ADMIN_TOKEN'],
      action: 'Set ADMIN_TOKEN to a long non-placeholder value before using import, provider self-test, feedback review, or route debug tools.',
    },
  ];
}

function clientAddressFor(request: FastifyRequest) {
  const forwardedFor = request.headers['x-forwarded-for'];
  const forwardedAddress = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const firstForwardedAddress = forwardedAddress?.split(',')[0]?.trim();

  return firstForwardedAddress || request.headers['x-real-ip']?.toString() || request.ip;
}

function createClientRateLimiter(options: {
  maxEnvName: string;
  windowEnvName: string;
  defaultMaxRequests: number;
  defaultWindowMs: number;
}) {
  const maxRequests = positiveIntegerEnv(options.maxEnvName, options.defaultMaxRequests);
  const windowMs = positiveIntegerEnv(options.windowEnvName, options.defaultWindowMs);
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    check(request: FastifyRequest) {
      const now = Date.now();
      const key = clientAddressFor(request);
      const bucket = buckets.get(key);

      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true as const };
      }

      if (bucket.count >= maxRequests) {
        return {
          allowed: false as const,
          retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
        };
      }

      bucket.count += 1;
      return { allowed: true as const };
    },
  };
}

function createRouteGenerationRateLimiter() {
  return createClientRateLimiter({
    maxEnvName: 'ROUTE_GENERATION_RATE_LIMIT_MAX',
    windowEnvName: 'ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS',
    defaultMaxRequests: 30,
    defaultWindowMs: 60_000,
  });
}

function createGeocodeRateLimiter() {
  return createClientRateLimiter({
    maxEnvName: 'GEOCODE_RATE_LIMIT_MAX',
    windowEnvName: 'GEOCODE_RATE_LIMIT_WINDOW_MS',
    defaultMaxRequests: 60,
    defaultWindowMs: 60_000,
  });
}

const routeSmokeRequests: Array<{ id: string; label: string; request: MVPWalkRequest }> = [
  {
    id: 'mile-end-coffee',
    label: 'Mile End coffee loop',
    request: {
      cityId: 'montreal',
      start: {
        id: 'smoke-mile-end',
        label: 'Mile End',
        coordinate: { lat: 45.5234, lng: -73.5996 },
      },
      stepGoal: 5000,
      timeGoalMinutes: 45,
      mood: 'coffee',
      interests: ['cafes', 'architecture'],
      routeType: 'loop',
    },
  },
  {
    id: 'plateau-calm',
    label: 'Plateau calm green loop',
    request: {
      cityId: 'montreal',
      start: {
        id: 'smoke-plateau',
        label: 'Plateau Mont-Royal',
        coordinate: { lat: 45.5216, lng: -73.5747 },
      },
      stepGoal: 7000,
      timeGoalMinutes: 60,
      mood: 'green',
      interests: ['parks', 'cafes'],
      routeType: 'loop',
    },
  },
  {
    id: 'verdun-scenic',
    label: 'Verdun scenic waterfront loop',
    request: {
      cityId: 'montreal',
      start: {
        id: 'smoke-verdun',
        label: 'Verdun waterfront',
        coordinate: { lat: 45.4592, lng: -73.5673 },
      },
      stepGoal: 10000,
      timeGoalMinutes: 90,
      mood: 'scenic',
      interests: ['waterfront', 'parks'],
      routeType: 'loop',
    },
  },
];
const minimumLaunchRouteScore = 76;
const minimumRouteOptions = 5;
const liveRoutingProviders = new Set(['mapbox-directions', 'geoapify-routing']);

function routeIsLiveRoutingProvider(route: { provider: string }) {
  return liveRoutingProviders.has(route.provider);
}

function routeSummaryFor(route: ScoredRoute): RouteSummary {
  return {
    id: route.id,
    label: route.label,
    explanation: route.explanation,
    estimatedSteps: route.estimatedSteps,
    durationSeconds: route.durationSeconds,
    distanceMeters: route.distanceMeters,
    poiCount: route.pois.length,
    fitCategory: route.fitCategory,
    fitReason: route.fitReason,
  };
}

function plausibleWalkUpdate(
  walk: { route: ScoredRoute; elapsedSeconds: number; estimatedSteps: number },
  update: { elapsedSeconds?: number; estimatedSteps?: number; discoveredPoiIds?: string[] },
) {
  const elapsedSeconds = Math.max(0, update.elapsedSeconds ?? walk.elapsedSeconds);
  const routeDurationSeconds = Math.max(1, walk.route.durationSeconds);
  const routeProgressSteps = Math.round((elapsedSeconds / routeDurationSeconds) * walk.route.estimatedSteps);
  const maxEstimatedSteps = Math.max(1, Math.min(walk.route.estimatedSteps, routeProgressSteps));

  return {
    ...update,
    elapsedSeconds,
    estimatedSteps: Math.min(update.estimatedSteps ?? walk.estimatedSteps, maxEstimatedSteps),
  };
}

function routeGenerationNotice(
  providers: ReturnType<typeof getProviderConfiguration>,
  generation: { usedFallback: boolean; fallbackReason?: string },
) {
  if (generation.usedFallback) return generation.fallbackReason ?? null;
  if (!providers.routing.configured) {
    return 'Generated with seeded providers; configure live provider keys before launch.';
  }
  return null;
}

async function runRouteSmokeTests(dependencies: RouteEngineWithFallbackDependencies) {
  const checks = await Promise.all(routeSmokeRequests.map(async (scenario) => {
    const generation = await generateRouteCandidatesWithFallback(scenario.request, dependencies);
    const scored = rankScoredRoutes(
      generation.candidates.map((candidate) => scoreRouteCandidate(candidate, scenario.request, dependencies.city)),
    );
    const bestRoute = scored[0];
    const issues: string[] = [];

    if (generation.candidates.length === 0) {
      issues.push('No route candidates returned.');
    }

    if (generation.candidates.length > 0 && generation.candidates.length < minimumRouteOptions) {
      issues.push(`Fewer than ${minimumRouteOptions} route options returned.`);
    }

    if (bestRoute) {
      const minSteps = Math.round(scenario.request.stepGoal * 0.85);
      const maxSteps = Math.round(scenario.request.stepGoal * 1.15);

      if (bestRoute.estimatedSteps < minSteps || bestRoute.estimatedSteps > maxSteps) {
        issues.push(`Best route is outside the ±15% step target (${bestRoute.estimatedSteps} steps).`);
      }

      if (bestRoute.pois.length === 0) {
        issues.push('Best route has no visible POIs.');
      }

      if (bestRoute.score.total < minimumLaunchRouteScore) {
        issues.push(`Best route score is below launch quality (${Math.round(bestRoute.score.total)}/100; minimum ${minimumLaunchRouteScore}/100).`);
      }

      if (!routeIsLiveRoutingProvider(bestRoute)) {
        issues.push(`Best route used non-live routing provider ${bestRoute.provider}.`);
      }
    }

    if (generation.usedFallback) {
      issues.push(`Used fallback routing: ${generation.fallbackReason ?? 'reason unavailable'}`);
    }

    const hasHardFailure = generation.candidates.length === 0 || !bestRoute;

    return {
      id: scenario.id,
      label: scenario.label,
      status: hasHardFailure ? 'failed' : issues.length > 0 ? 'warn' : 'ok',
      routeCount: generation.candidates.length,
      issues,
      bestRoute: bestRoute ? {
        distanceMeters: bestRoute.distanceMeters,
        estimatedSteps: bestRoute.estimatedSteps,
        poiCount: bestRoute.pois.length,
        provider: bestRoute.provider,
        score: Math.round(bestRoute.score.total),
      } : null,
    };
  }));
  const passed = checks.filter((check) => check.status === 'ok').length;
  const failed = checks.length - passed;

  return {
    ok: failed === 0,
    checkedAt: new Date().toISOString(),
    passed,
    failed,
    checks,
  };
}

interface BuildServerOptions {
  poiProvider?: POIProvider;
  routingProvider?: RoutingProvider;
  fallbackRoutingProvider?: RoutingProvider;
  geocodingProvider?: GeocodingProvider;
  poiImporter?: typeof importOverpassPOIs;
}

export function buildServer(options: BuildServerOptions = {}) {
  const app = Fastify({ logger: false });
  const repository = process.env.DISABLE_ROUTE_STORE === 'true'
    ? new InMemoryRouteRepository()
    : new JsonRouteRepository(getRouteStorePath());
  const poiProvider = options.poiProvider ?? createPOIProvider();
  const routingProvider = options.routingProvider ?? createRoutingProvider();
  const fallbackRoutingProvider = options.fallbackRoutingProvider ?? createFallbackRoutingProvider();
  const geocodingProvider = options.geocodingProvider ?? createGeocodingProvider();
  const poiImporter = options.poiImporter ?? importOverpassPOIs;
  const seededGeocodingProvider = createSeedGeocodingProvider();
  const routeGenerationRateLimiter = createRouteGenerationRateLimiter();
  const geocodeRateLimiter = createGeocodeRateLimiter();

  app.register(cors, { origin: true });
  app.setErrorHandler((caught, _request, reply) => {
    const error = caught as { statusCode?: number; message?: string };
    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;

    if (statusCode >= 500) {
      app.log.error(error);
    }

    return reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Internal server error.' : error.message ?? 'Request failed.',
      action: statusCode >= 500 ? 'Check the API logs and provider configuration.' : undefined,
    });
  });

  app.get('/api/cities', async () => ({
    cities: [montrealCityProfile],
  }));

  app.get('/api/health/providers', async () => {
    const providers = getProviderConfiguration();
    const adminSecurity = adminSecurityFor();

    return {
      ok: true,
      ...liveReadinessFor(providers, adminSecurity),
      adminSecurity,
      city: montrealCityProfile.id,
      providers,
    };
  });

  app.get('/api/health/live', async (_request, reply) => {
    const providers = getProviderConfiguration();
    const adminSecurity = adminSecurityFor();
    const readiness = liveReadinessFor(providers, adminSecurity);

    return reply
      .code(readiness.liveReady ? 200 : 503)
      .send({
        ok: readiness.liveReady,
        ...readiness,
        adminSecurity,
        city: montrealCityProfile.id,
      });
  });

  app.get('/api/client-config', async () => ({
    city: montrealCityProfile.id,
    map: {
      provider: 'maptiler',
      mapTilerKey: getMapTilerKey(),
    },
    ops: {
      enabled: opsPanelEnabled(),
    },
  }));

  app.get('/api/geocode', async (request, reply) => {
    const rateLimit = geocodeRateLimiter.check(request);

    if (!rateLimit.allowed) {
      return reply
        .code(429)
        .header('retry-after', rateLimit.retryAfterSeconds.toString())
        .send({
          error: 'Too many geocoding requests.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        });
    }

    const query = z.object({ query: z.string().min(1), city: z.literal('montreal') }).safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ error: 'Invalid geocode query.' });
    }

    const providerConfiguration = getProviderConfiguration();
    const liveGeocodingConfigured = providerConfiguration.geocoding.configured;

    try {
      const places = await geocodingProvider.search(query.data.query, montrealCityProfile);

      if (places.length > 0) return { places, provider: providerConfiguration.geocoding.provider };

      const poiPlaces = searchPOIStartPlaces(
        query.data.query,
        await readPOIsForStartSearch(liveGeocodingConfigured),
        montrealCityProfile,
      );

      if (poiPlaces.length > 0) return { places: poiPlaces, provider: 'poi-cache' };

      if (liveGeocodingConfigured) {
        return {
          places: [],
          provider: 'geoapify',
        };
      }

      return {
        places: await seededGeocodingProvider.search(query.data.query, montrealCityProfile),
        provider: 'seed-fallback',
      };
    } catch (error) {
      const poiPlaces = searchPOIStartPlaces(
        query.data.query,
        await readPOIsForStartSearch(liveGeocodingConfigured),
        montrealCityProfile,
      );

      if (poiPlaces.length > 0) {
        return {
          places: poiPlaces,
          provider: 'poi-cache',
          fallbackReason: error instanceof Error ? error.message : 'Geocoding provider failed.',
        };
      }

      if (liveGeocodingConfigured) {
        return reply.code(502).send({
          error: 'Geocoding provider failed.',
          fallback: 'No cached Montréal POI matched the start query.',
          action: 'Check GEOAPIFY_API_KEY, provider quota, or try a more specific Montréal start.',
        });
      }

      return {
        places: await seededGeocodingProvider.search(query.data.query, montrealCityProfile),
        provider: 'seed-fallback',
        fallbackReason: error instanceof Error ? error.message : 'Geocoding provider failed.',
      };
    }
  });

  app.post('/api/routes/generate', async (request, reply) => {
    const rateLimit = routeGenerationRateLimiter.check(request);

    if (!rateLimit.allowed) {
      return reply
        .code(429)
        .header('retry-after', rateLimit.retryAfterSeconds.toString())
        .send({
          error: 'Too many route generation requests.',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        });
    }

    const parsed = routeRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid route request.', issues: parsed.error.issues });
    }

    const routeRequest: MVPWalkRequest = {
      ...parsed.data,
      start: {
        id: parsed.data.start.id ?? `start-${Date.now()}`,
        label: parsed.data.start.label,
        coordinate: parsed.data.start.coordinate,
      },
    };
    const validation = validateMVPWalkRequest(routeRequest, montrealCityProfile);

    if (!validation.valid) {
      return reply.code(400).send({
        error: 'Invalid route request.',
        issues: validation.errors,
      });
    }

    const providers = getProviderConfiguration();
    const liveRouteProviderConfigured = providers.geocoding.configured || providers.routing.configured;
    const liveRouteIssues = liveRouteSetupIssues(providers);
    const poiIssues = livePOICacheIssues(providers);

    if (liveRouteIssues.length > 0) {
      return reply.code(503).send({
        error: 'Live route setup is incomplete.',
        issues: liveRouteIssues,
        action: 'Configure MAPTILER_API_KEY, GEOAPIFY_API_KEY, and MAPBOX_ACCESS_TOKEN, or set USE_SEEDED_PROVIDERS=true for local seeded testing.',
      });
    }

    if (!providers.seededMode && liveRouteProviderConfigured && poiIssues.length > 0) {
      return reply.code(503).send({
        error: 'POI cache is not ready for live route generation.',
        issues: poiIssues,
        action: 'Run the Montréal POI import and confirm /api/health/live is ready before generating live routes.',
      });
    }

    const generation = await generateRouteCandidatesWithFallback(routeRequest, {
      city: montrealCityProfile,
      poiProvider,
      routingProvider,
      fallbackRoutingProvider,
    });

    if (providers.routing.configured && generation.usedFallback) {
      return reply.code(502).send({
        error: 'Live routing provider failed.',
        fallback: generation.fallbackReason ?? 'Routing provider failed.',
        action: 'Check MAPBOX_ACCESS_TOKEN, provider quota, or run the route smoke test before serving live routes.',
      });
    }

    if (generation.candidates.length === 0) {
      return reply.code(422).send({
        error: 'No route candidates found.',
        fallback: generation.fallbackReason ?? 'Try a different Montréal starting point or fewer interests.',
      });
    }

    if (generation.candidates.length < minimumRouteOptions) {
      return reply.code(422).send({
        error: 'Not enough route options found.',
        fallback: `Need at least ${minimumRouteOptions} route options, but generated ${generation.candidates.length}.${generation.fallbackReason ? ` ${generation.fallbackReason}` : ''}`,
        action: 'Try a different Montréal starting point, broader interests, or run route smoke tests before launch.',
      });
    }

    const requestId = `request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const scored = scopedRouteIds(rankScoredRoutes(
      generation.candidates.map((candidate) => scoreRouteCandidate(candidate, routeRequest, montrealCityProfile)),
    ), requestId);
    const topRoutes = scored.slice(0, 3);
    const remainingRoutes = scored.slice(3);

    try {
      repository.saveRouteRequest({
        id: requestId,
        createdAt: new Date().toISOString(),
        topRoutes,
        remainingRoutes,
        diagnostics: {
          usedFallback: generation.usedFallback,
          fallbackReason: generation.fallbackReason,
        },
      });
    } catch {
      return reply.code(503).send({
        error: 'Route persistence unavailable.',
        action: 'Check ROUTE_STORE_PATH and server write permissions before generating live routes.',
      });
    }

    return {
      requestId,
      topRoutes: topRoutes.map(routeSummaryFor),
      remainingRoutes: remainingRoutes.map(routeSummaryFor),
      fallback: routeGenerationNotice(providers, generation),
    };
  });

  app.post('/api/routes/:id/save', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const savedRoute = repository.saveRoute(params.id);

    if (!savedRoute) return reply.code(404).send({ error: 'Route not found.' });

    return reply.code(201).send({ saved: true, savedRoute });
  });

  app.get('/api/routes/saved', async () => ({
    savedRoutes: repository.getSavedRoutes().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }));

  app.post('/api/walks/:routeId/start', async (request, reply) => {
    const params = z.object({ routeId: z.string() }).parse(request.params);
    const walk = repository.startWalk(params.routeId);

    if (!walk) return reply.code(404).send({ error: 'Route not found.' });

    return reply.code(201).send({ walk });
  });

  app.patch('/api/walks/:walkId', async (request, reply) => {
    const params = z.object({ walkId: z.string() }).parse(request.params);
    const parsed = walkUpdateSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid walk update.', issues: parsed.error.issues });
    }

    const walk = repository.updateWalk(params.walkId, parsed.data);

    if (!walk) return reply.code(404).send({ error: 'Walk not found.' });

    return { walk };
  });

  app.post('/api/walks/:walkId/pois/:poiId', async (request, reply) => {
    const params = z.object({ walkId: z.string(), poiId: z.string() }).parse(request.params);
    const parsed = poiActionSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid POI action.', issues: parsed.error.issues });
    }

    if (!repository.getWalk(params.walkId)) return reply.code(404).send({ error: 'Walk not found.' });

    const poiAction = repository.savePOIAction(params.walkId, params.poiId, parsed.data.action);

    if (!poiAction) return reply.code(404).send({ error: 'POI not found.' });

    return reply.code(201).send({ saved: true, poiAction, walk: repository.getWalk(params.walkId) });
  });

  app.post('/api/walks/:walkId/complete', async (request, reply) => {
    const params = z.object({ walkId: z.string() }).parse(request.params);
    const parsed = walkUpdateSchema.omit({ status: true }).safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid walk completion.', issues: parsed.error.issues });
    }

    const currentWalk = repository.getWalk(params.walkId);
    if (!currentWalk) return reply.code(404).send({ error: 'Walk not found.' });

    const walk = repository.completeWalk(params.walkId, plausibleWalkUpdate(currentWalk, parsed.data));

    if (!walk) return reply.code(404).send({ error: 'Walk not found.' });

    return { walk, progress: repository.getProgress(walk.route.cityId) };
  });

  app.get('/api/progress', async (request, reply) => {
    const query = z.object({ city: z.literal('montreal') }).safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ error: 'Invalid progress query.' });
    }

    return { progress: repository.getProgress(query.data.city) };
  });

  app.get('/api/walks', async (request, reply) => {
    const query = z.object({
      city: z.literal('montreal'),
      status: z.literal('completed'),
    }).safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ error: 'Invalid walks query.' });
    }

    return { walks: repository.getCompletedWalkSummaries(query.data.city) };
  });

  app.get('/api/routes/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const route = repository.getRoute(params.id);

    if (!route) return reply.code(404).send({ error: 'Route not found.' });

    if (getProviderConfiguration().routing.configured && !routeIsLiveRoutingProvider(route)) {
      return reply.code(410).send({
        error: 'Saved route was generated by a non-live routing provider.',
        action: 'Generate a new route after live routing is configured.',
      });
    }

    return { route };
  });

  app.post('/api/routes/:id/feedback', async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const parsed = feedbackSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid feedback.', issues: parsed.error.issues });
    }

    if (!repository.getRoute(params.id)) {
      return reply.code(404).send({ error: 'Route not found.' });
    }

    let feedback;

    try {
      feedback = repository.saveFeedback(params.id, parsed.data.labels, parsed.data.note);
    } catch {
      return reply.code(503).send({
        error: 'Feedback persistence unavailable.',
        action: 'Check ROUTE_STORE_PATH and server write permissions before collecting live feedback.',
      });
    }

    return reply.code(201).send({ saved: true, feedback });
  });

  app.post('/api/admin/import-pois', async (request, reply) => {
    const adminAccess = adminAccessFor(request.headers['x-admin-token']);

    if (!adminAccess.allowed) {
      return reply.code(adminAccess.statusCode).send({ error: adminAccess.error });
    }

    try {
      const result = await poiImporter({ cachePath: getPOICachePath() });

      if (result.importErrors.length > 0) {
        return reply.code(502).send({
          imported: false,
          count: result.imported,
          source: result.source,
          cached: result.cached,
          importErrors: result.importErrors,
          error: `POI import errors: ${result.importErrors.join('; ')}`,
        });
      }

      return {
        imported: true,
        count: result.imported,
        source: result.source,
        cached: result.cached,
        categoryCounts: result.categoryCounts,
      };
    } catch (error) {
      return reply.code(502).send({
        imported: false,
        fallback: 'Existing cached or seeded POIs remain available.',
        error: error instanceof Error ? error.message : 'Overpass import failed.',
      });
    }
  });

  app.post('/api/admin/provider-self-test', async (request, reply) => {
    const adminAccess = adminAccessFor(request.headers['x-admin-token']);

    if (!adminAccess.allowed) {
      return reply.code(adminAccess.statusCode).send({ error: adminAccess.error });
    }

    return runProviderSelfTest();
  });

  app.post('/api/admin/route-smoke-test', async (request, reply) => {
    const adminAccess = adminAccessFor(request.headers['x-admin-token']);

    if (!adminAccess.allowed) {
      return reply.code(adminAccess.statusCode).send({ error: adminAccess.error });
    }

    return runRouteSmokeTests({
      city: montrealCityProfile,
      poiProvider,
      routingProvider,
      fallbackRoutingProvider,
    });
  });

  app.get('/api/admin/feedback', async (request, reply) => {
    const adminAccess = adminAccessFor(request.headers['x-admin-token']);

    if (!adminAccess.allowed) {
      return reply.code(adminAccess.statusCode).send({ error: adminAccess.error });
    }

    const feedback = repository.getFeedback().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const labelCounts = feedback.reduce<Record<string, number>>((counts, item) => {
      item.labels.forEach((label) => {
        counts[label] = (counts[label] ?? 0) + 1;
      });

      return counts;
    }, {});

    return {
      count: feedback.length,
      labelCounts,
      feedback,
    };
  });

  app.get('/api/admin/route-debug/:id', async (request, reply) => {
    const adminAccess = adminAccessFor(request.headers['x-admin-token']);

    if (!adminAccess.allowed) {
      return reply.code(adminAccess.statusCode).send({ error: adminAccess.error });
    }

    const params = z.object({ id: z.string() }).parse(request.params);
    const route = repository.getRoute(params.id);

    if (!route) return reply.code(404).send({ error: 'Route not found.' });
    return {
      routeId: route.id,
      provider: route.provider,
      debug: route.debug,
      score: route.score,
      diagnostics: repository.getRouteDiagnostics(route.id),
      waypointCount: route.debug.requestedWaypointCount ?? route.pois.length + 2,
      selectedPois: route.pois.map((poi) => ({
        id: poi.id,
        name: poi.name,
        category: poi.category,
      })),
    };
  });

  return app;
}
