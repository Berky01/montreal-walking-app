import { describe, expect, it } from 'vitest';
import { buildBailoutOptions, buildNextMove, buildTimeGuardrail } from './walkCompanion';
import type { ScoredRoute, WalkSessionRecord } from './mvpTypes';

const route: ScoredRoute = {
  id: 'route-1',
  label: 'Mile End loop',
  cityId: 'montreal',
  geometry: [{ lat: 45.52, lng: -73.59 }],
  pois: [{
    id: 'poi-1',
    cityId: 'montreal',
    name: 'Cafe stop',
    category: 'cafes',
    coordinate: { lat: 45.521, lng: -73.591 },
    source: 'curated',
    moods: ['coffee'],
    interestTags: ['cafes'],
    computedRouteValue: 10,
    lastImportedAt: '2026-01-01T00:00:00.000Z',
  }],
  distanceMeters: 2400,
  durationSeconds: 1800,
  estimatedSteps: 3200,
  provider: 'seed',
  debug: { targetMeters: 2400, waypointStrategy: 'test' },
  score: {
    total: 88,
    breakdown: {
      stepFit: 1,
      timeFit: 1,
      moodMatch: 1,
      interestMatch: 1,
      poiSpacing: 1,
      detourPenalty: 0,
      parkWaterfrontBonus: 0,
      excessTurnPenalty: 0,
    },
  },
  explanation: 'A practical coffee loop.',
  scoreSummary: [],
  exportLinks: {
    googleMaps: 'https://maps.example/route',
    gpx: '<gpx />',
  },
};

it('builds mobile companion summaries from shared route data', () => {
  const startedAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const walk: WalkSessionRecord = {
    id: 'walk-1',
    profileId: 'local',
    routeId: route.id,
    route,
    status: 'active',
    startedAt,
    updatedAt: startedAt,
    elapsedSeconds: 0,
    estimatedSteps: 800,
    discoveredPoiIds: [],
  };

  expect(buildNextMove(route, route.pois[0]).title).toContain('Cafe stop');
  expect(buildTimeGuardrail(walk, route).progressPercent).toBeGreaterThan(0);
  expect(buildBailoutOptions(route).map((option) => option.id)).toEqual(['shortcut', 'return', 'transit']);
});

it('does not claim time remains after the planned duration has elapsed', () => {
  const startedAt = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  const walk: WalkSessionRecord = {
    id: 'walk-1',
    profileId: 'local',
    routeId: route.id,
    route,
    status: 'active',
    startedAt,
    updatedAt: startedAt,
    elapsedSeconds: 45 * 60,
    estimatedSteps: 1800,
    discoveredPoiIds: [],
  };

  expect(buildTimeGuardrail(walk, route).remainingTimeLabel).toBe('0 min left');
});
