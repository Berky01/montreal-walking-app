import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ScoredRoute } from '../domain/mvpTypes';
import { JsonRouteRepository } from './repository';

const scoredRoute: ScoredRoute = {
  id: 'route-persisted',
  label: 'Recommended',
  cityId: 'montreal',
  geometry: [
    { lat: 45.5234, lng: -73.5996 },
    { lat: 45.524, lng: -73.599 },
  ],
  pois: [],
  distanceMeters: 1200,
  durationSeconds: 900,
  estimatedSteps: 1600,
  provider: 'seed-routing',
  debug: {
    targetMeters: 1200,
    waypointStrategy: 'test loop',
  },
  score: {
    total: 80,
    breakdown: {
      stepFit: 20,
      timeFit: 12,
      moodMatch: 12,
      interestMatch: 12,
      poiSpacing: 8,
      detourPenalty: 0,
      parkWaterfrontBonus: 8,
      excessTurnPenalty: 0,
    },
  },
  explanation: 'Test route',
  scoreSummary: ['Good step fit'],
  exportLinks: {
    googleMaps: 'https://maps.google.com',
    gpx: '<gpx />',
  },
};

describe('JSON route repository', () => {
  it('persists route requests and feedback across repository instances', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-routes-'));
    const storePath = join(tempDir, 'route-store.json');

    try {
      const firstRepository = new JsonRouteRepository(storePath);

      firstRepository.saveRouteRequest({
        id: 'request-1',
        createdAt: '2026-05-26T00:00:00.000Z',
        topRoutes: [scoredRoute],
        remainingRoutes: [],
        diagnostics: { usedFallback: false },
      });
      firstRepository.saveFeedback('route-persisted', ['great-route']);

      const secondRepository = new JsonRouteRepository(storePath);

      expect(secondRepository.getRoute('route-persisted')).toEqual(scoredRoute);
      expect(secondRepository.getFeedback()).toEqual([
        expect.objectContaining({
          routeId: 'route-persisted',
          labels: ['great-route'],
        }),
      ]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('prunes oldest route requests when the configured store limit is reached', async () => {
    const previousLimit = process.env.ROUTE_STORE_MAX_REQUESTS;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-routes-prune-'));
    const storePath = join(tempDir, 'route-store.json');

    process.env.ROUTE_STORE_MAX_REQUESTS = '2';

    try {
      const repository = new JsonRouteRepository(storePath);

      for (const id of ['oldest', 'middle', 'newest']) {
        repository.saveRouteRequest({
          id: `request-${id}`,
          createdAt: `2026-05-26T00:00:0${id.length}.000Z`,
          topRoutes: [{ ...scoredRoute, id: `route-${id}` }],
          remainingRoutes: [],
          diagnostics: { usedFallback: false },
        });
      }

      const reloadedRepository = new JsonRouteRepository(storePath);

      expect(reloadedRepository.getRoute('route-oldest')).toBeUndefined();
      expect(reloadedRepository.getRoute('route-middle')).toBeDefined();
      expect(reloadedRepository.getRoute('route-newest')).toBeDefined();
    } finally {
      if (previousLimit === undefined) delete process.env.ROUTE_STORE_MAX_REQUESTS;
      else process.env.ROUTE_STORE_MAX_REQUESTS = previousLimit;

      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('starts with an empty store when the JSON route store is corrupted', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-routes-corrupt-'));
    const storePath = join(tempDir, 'route-store.json');

    try {
      await writeFile(storePath, '{not-json');

      const repository = new JsonRouteRepository(storePath);

      expect(repository.getRoute('anything')).toBeUndefined();

      repository.saveRouteRequest({
        id: 'request-after-corruption',
        createdAt: '2026-05-26T00:00:00.000Z',
        topRoutes: [scoredRoute],
        remainingRoutes: [],
        diagnostics: { usedFallback: false },
      });

      const persisted = JSON.parse(await readFile(storePath, 'utf8')) as { routeRequests?: unknown[] };

      expect(persisted.routeRequests).toHaveLength(1);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('skips malformed stored route requests and feedback records', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-routes-malformed-'));
    const storePath = join(tempDir, 'route-store.json');

    try {
      await writeFile(storePath, JSON.stringify({
        routeRequests: [
          { id: 'bad-request-without-routes' },
          {
            id: 'request-valid',
            createdAt: '2026-05-26T00:00:00.000Z',
            topRoutes: [scoredRoute],
            remainingRoutes: [],
            diagnostics: { usedFallback: false },
          },
        ],
        feedback: [
          { id: 'bad-feedback-without-labels' },
          {
            id: 'feedback-valid',
            routeId: 'route-persisted',
            labels: ['great-route'],
            createdAt: '2026-05-26T00:00:00.000Z',
          },
        ],
      }, null, 2));

      const repository = new JsonRouteRepository(storePath);

      expect(repository.getRoute('route-persisted')).toEqual(scoredRoute);
      expect(repository.getFeedback()).toEqual([
        {
          id: 'feedback-valid',
          routeId: 'route-persisted',
          labels: ['great-route'],
          createdAt: '2026-05-26T00:00:00.000Z',
        },
      ]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('skips stored route requests with malformed route entries', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-routes-bad-route-entry-'));
    const storePath = join(tempDir, 'route-store.json');

    try {
      await writeFile(storePath, JSON.stringify({
        routeRequests: [
          {
            id: 'request-with-bad-route',
            createdAt: '2026-05-26T00:00:00.000Z',
            topRoutes: [null],
            remainingRoutes: [],
            diagnostics: { usedFallback: false },
          },
          {
            id: 'request-valid',
            createdAt: '2026-05-26T00:00:00.000Z',
            topRoutes: [scoredRoute],
            remainingRoutes: [],
            diagnostics: { usedFallback: false },
          },
        ],
        feedback: [],
      }, null, 2));

      const repository = new JsonRouteRepository(storePath);

      expect(repository.getRoute('route-persisted')).toEqual(scoredRoute);
      expect(repository.getRoute('missing')).toBeUndefined();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('skips stored route requests with non-finite route geometry', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-routes-bad-geometry-'));
    const storePath = join(tempDir, 'route-store.json');

    try {
      await writeFile(storePath, JSON.stringify({
        routeRequests: [
          {
            id: 'request-bad-geometry',
            createdAt: '2026-05-26T00:00:00.000Z',
            topRoutes: [
              {
                ...scoredRoute,
                id: 'route-bad-geometry',
                geometry: [
                  { lat: 45.5234, lng: -73.5996 },
                  { lat: 'not-a-number', lng: -73.598 },
                ],
              },
            ],
            remainingRoutes: [],
            diagnostics: { usedFallback: false },
          },
        ],
        feedback: [],
      }, null, 2));

      const repository = new JsonRouteRepository(storePath);

      expect(repository.getRoute('route-bad-geometry')).toBeUndefined();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('skips stored route requests with malformed route POIs', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-routes-bad-pois-'));
    const storePath = join(tempDir, 'route-store.json');

    try {
      await writeFile(storePath, JSON.stringify({
        routeRequests: [
          {
            id: 'request-bad-poi',
            createdAt: '2026-05-26T00:00:00.000Z',
            topRoutes: [
              {
                ...scoredRoute,
                id: 'route-bad-poi',
                pois: [
                  {
                    id: 'poi-bad',
                    name: 'Bad POI',
                    category: 'cafes',
                    coordinate: { lat: Number.NaN, lng: -73.598 },
                  },
                ],
              },
            ],
            remainingRoutes: [],
            diagnostics: { usedFallback: false },
          },
        ],
        feedback: [],
      }, null, 2));

      const repository = new JsonRouteRepository(storePath);

      expect(repository.getRoute('route-bad-poi')).toBeUndefined();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('skips stored route requests with malformed route facts, scores, or exports', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-routes-bad-facts-'));
    const storePath = join(tempDir, 'route-store.json');

    try {
      await writeFile(storePath, JSON.stringify({
        routeRequests: [
          {
            id: 'request-bad-facts',
            createdAt: '2026-05-26T00:00:00.000Z',
            topRoutes: [
              {
                ...scoredRoute,
                id: 'route-bad-facts',
                distanceMeters: 'far',
                score: {
                  total: Number.NaN,
                  breakdown: scoredRoute.score.breakdown,
                },
                exportLinks: {
                  googleMaps: '',
                  gpx: '',
                },
              },
            ],
            remainingRoutes: [],
            diagnostics: { usedFallback: false },
          },
        ],
        feedback: [],
      }, null, 2));

      const repository = new JsonRouteRepository(storePath);

      expect(repository.getRoute('route-bad-facts')).toBeUndefined();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('persists saved routes, walk sessions, POI actions, and progress across instances', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-progress-'));
    const storePath = join(tempDir, 'route-store.json');
    const routeWithPOI: ScoredRoute = {
      ...scoredRoute,
      id: 'route-with-poi',
      pois: [
        {
          id: 'poi-cafe',
          cityId: 'montreal',
          name: 'Cafe Test',
          category: 'cafes',
          coordinate: { lat: 45.524, lng: -73.598 },
          source: 'osm-seed',
          moods: ['coffee'],
          interestTags: ['cafes'],
          computedRouteValue: 80,
          lastImportedAt: '2026-05-26T00:00:00.000Z',
        },
      ],
    };

    try {
      const firstRepository = new JsonRouteRepository(storePath);

      firstRepository.saveRouteRequest({
        id: 'request-progress',
        createdAt: '2026-05-26T00:00:00.000Z',
        topRoutes: [routeWithPOI],
        remainingRoutes: [],
        diagnostics: { usedFallback: false },
      });

      const savedRoute = firstRepository.saveRoute(routeWithPOI.id);
      const walk = firstRepository.startWalk(routeWithPOI.id);

      expect(savedRoute?.route.id).toBe(routeWithPOI.id);
      expect(walk?.route.id).toBe(routeWithPOI.id);
      expect(walk).toBeDefined();

      const poiAction = firstRepository.savePOIAction(walk!.id, 'poi-cafe', 'discovered');
      const completed = firstRepository.completeWalk(walk!.id, {
        elapsedSeconds: 900,
        estimatedSteps: 1600,
        discoveredPoiIds: ['poi-cafe'],
      });

      expect(poiAction?.poi).toEqual(expect.objectContaining({
        poiId: 'poi-cafe',
        name: 'Cafe Test',
        category: 'cafes',
      }));
      expect(completed?.status).toBe('completed');

      const secondRepository = new JsonRouteRepository(storePath);

      expect(secondRepository.getSavedRoutes()).toHaveLength(1);
      expect(secondRepository.getWalk(walk!.id)).toEqual(expect.objectContaining({
        status: 'completed',
        discoveredPoiIds: ['poi-cafe'],
      }));
      expect(secondRepository.getProgress()).toEqual(expect.objectContaining({
        placesDiscovered: 1,
        loopsCompleted: 1,
        savedRoutes: 1,
      }));
      expect(secondRepository.getCompletedWalkSummaries()).toEqual([
        expect.objectContaining({
          id: walk!.id,
          routeId: routeWithPOI.id,
          routeLabel: routeWithPOI.label,
          status: 'completed',
          estimatedSteps: 1600,
          discoveredCount: 1,
        }),
      ]);
      expect(JSON.stringify(secondRepository.getCompletedWalkSummaries())).not.toContain('coordinates');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('keeps a saved route snapshot after route request pruning removes the generated route', async () => {
    const previousMax = process.env.ROUTE_STORE_MAX_REQUESTS;
    const tempDir = await mkdtemp(join(tmpdir(), 'walking-saved-snapshot-'));
    const storePath = join(tempDir, 'route-store.json');

    process.env.ROUTE_STORE_MAX_REQUESTS = '1';

    try {
      const repository = new JsonRouteRepository(storePath);

      repository.saveRouteRequest({
        id: 'request-old',
        createdAt: '2026-05-26T00:00:00.000Z',
        topRoutes: [scoredRoute],
        remainingRoutes: [],
        diagnostics: { usedFallback: false },
      });
      repository.saveRoute(scoredRoute.id);
      repository.saveRouteRequest({
        id: 'request-new',
        createdAt: '2026-05-27T00:00:00.000Z',
        topRoutes: [{ ...scoredRoute, id: 'route-new' }],
        remainingRoutes: [],
        diagnostics: { usedFallback: false },
      });

      expect(repository.getRoute(scoredRoute.id)).toEqual(scoredRoute);
      expect(repository.getSavedRoutes()[0].route.id).toBe(scoredRoute.id);
    } finally {
      if (previousMax === undefined) delete process.env.ROUTE_STORE_MAX_REQUESTS;
      else process.env.ROUTE_STORE_MAX_REQUESTS = previousMax;

      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
