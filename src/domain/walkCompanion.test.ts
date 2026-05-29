import { describe, expect, it, vi } from 'vitest';
import type { ScoredRoute, WalkSessionRecord } from './mvpTypes';
import {
  buildBailoutOptions,
  buildNextMove,
  buildTimeGuardrail,
  shortcutEstimateFor,
} from './walkCompanion';

const route = {
  id: 'route-1',
  label: 'Test loop',
  cityId: 'montreal',
  geometry: [
    { lat: 45.5234, lng: -73.5996 },
    { lat: 45.524, lng: -73.598 },
    { lat: 45.5238, lng: -73.5988 },
    { lat: 45.5234, lng: -73.5996 },
  ],
  pois: [
    {
      id: 'poi-cafe',
      cityId: 'montreal',
      name: 'Cafe Olimpico',
      category: 'cafes',
      coordinate: { lat: 45.524, lng: -73.598 },
      source: 'osm-seed',
      moods: ['coffee'],
      interestTags: ['cafes'],
      computedRouteValue: 88,
      lastImportedAt: '2026-05-26T00:00:00.000Z',
    },
  ],
  distanceMeters: 2400,
  durationSeconds: 1800,
  estimatedSteps: 3200,
  provider: 'test',
  debug: { targetMeters: 2400, waypointStrategy: 'test' },
  score: {
    total: 91,
    breakdown: {
      stepFit: 95,
      timeFit: 90,
      moodMatch: 90,
      interestMatch: 88,
      poiSpacing: 85,
      detourPenalty: 0,
      parkWaterfrontBonus: 8,
      excessTurnPenalty: 0,
    },
  },
  explanation: 'Test route',
  scoreSummary: [],
  exportLinks: { googleMaps: 'https://maps.google.com', gpx: '<gpx />' },
} satisfies ScoredRoute;

function walk(startedAt: string): WalkSessionRecord {
  return {
    id: 'walk-1',
    profileId: 'local',
    routeId: route.id,
    route,
    status: 'active',
    startedAt,
    updatedAt: startedAt,
    elapsedSeconds: 0,
    estimatedSteps: 0,
    discoveredPoiIds: [],
  };
}

describe('walkCompanion', () => {
  it('builds the primary next move from the next POI', () => {
    const move = buildNextMove(route, route.pois[0]);

    expect(move.title).toBe('Head toward Cafe Olimpico');
    expect(move.distanceLabel).toBe('600 m');
    expect(move.etaLabel).toBe('8 min');
    expect(move.cue).toBe('Continue toward the highlighted stop, then slow down as you approach Cafe Olimpico.');
  });

  it('builds on-track time guardrail metrics from the walk start time', () => {
    vi.setSystemTime(new Date('2026-05-27T12:12:00.000Z'));

    const guardrail = buildTimeGuardrail(walk('2026-05-27T12:00:00.000Z'), route);

    expect(guardrail.status).toBe('on-track');
    expect(guardrail.title).toBe('On track for 30 min');
    expect(guardrail.elapsedLabel).toBe('12 min walked');
    expect(guardrail.remainingTimeLabel).toBe('18 min left');
    expect(guardrail.remainingDistanceLabel).toBe('1.4 km remaining');
    expect(guardrail.progressPercent).toBe(40);

    vi.useRealTimers();
  });

  it('marks the walk as running long when step progress lags elapsed time', () => {
    vi.setSystemTime(new Date('2026-05-27T12:24:00.000Z'));

    const activeWalk = walk('2026-05-27T12:00:00.000Z');
    activeWalk.elapsedSeconds = 24 * 60;
    activeWalk.estimatedSteps = 1800;

    const guardrail = buildTimeGuardrail(activeWalk, route);

    expect(guardrail.status).toBe('running-long');
    expect(guardrail.title).toBe('Running longer than planned');
    expect(guardrail.remainingTimeLabel).toBe('6 min left');
    expect(guardrail.remainingDistanceLabel).toBe('1.1 km remaining');
    expect(guardrail.progressPercent).toBe(56);

    vi.useRealTimers();
  });

  it('uses stored elapsed time while a walk is paused', () => {
    vi.setSystemTime(new Date('2026-05-27T12:45:00.000Z'));

    const pausedWalk = walk('2026-05-27T12:00:00.000Z');
    pausedWalk.status = 'paused';
    pausedWalk.updatedAt = '2026-05-27T12:10:00.000Z';
    pausedWalk.elapsedSeconds = 10 * 60;
    pausedWalk.estimatedSteps = 1000;

    const guardrail = buildTimeGuardrail(pausedWalk, route);

    expect(guardrail.elapsedLabel).toBe('10 min walked');
    expect(guardrail.remainingTimeLabel).toBe('20 min left');
    expect(guardrail.progressPercent).toBe(31);

    vi.useRealTimers();
  });

  it('does not claim time remains after the planned duration has elapsed', () => {
    vi.setSystemTime(new Date('2026-05-27T12:45:00.000Z'));

    const overdueWalk = walk('2026-05-27T12:00:00.000Z');
    overdueWalk.elapsedSeconds = 45 * 60;
    overdueWalk.estimatedSteps = 1800;

    const guardrail = buildTimeGuardrail(overdueWalk, route);

    expect(guardrail.status).toBe('running-long');
    expect(guardrail.remainingTimeLabel).toBe('0 min left');

    vi.useRealTimers();
  });

  it('creates conservative shortcut and bailout labels', () => {
    expect(shortcutEstimateFor(route).label).toBe('Shortcut saves 9 min');
    expect(buildBailoutOptions(route)).toEqual([
      { id: 'shortcut', label: 'Shortcut', detail: 'save 9 min' },
      { id: 'return', label: 'Return', detail: '1.2 km' },
      { id: 'transit', label: 'Transit', detail: 'bus 80 nearby' },
    ]);
  });
});
