import { describe, expect, it } from 'vitest';
import { montrealCityProfile } from './cityProfiles';
import { createSeedPOIProvider } from './providers/seedPOIProvider';
import { createSeedRoutingProvider } from './providers/seedRoutingProvider';
import {
  generateRouteCandidates,
  metersForWalkTarget,
  validateMVPWalkRequest,
} from './routeEngine';
import { rankScoredRoutes, scoreRouteCandidate } from './routeScoring';
import type { MVPWalkRequest, POI, RoutingProvider, ScoredRoute } from './mvpTypes';

const mileEndRequest: MVPWalkRequest = {
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
};

describe('MVP route domain', () => {
  it('rejects starts outside the Montréal city bounds', () => {
    const result = validateMVPWalkRequest({
      ...mileEndRequest,
      start: {
        label: 'Toronto',
        coordinate: { lat: 43.6532, lng: -79.3832 },
      },
    }, montrealCityProfile);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Start point must be inside Montréal.');
  });

  it('rejects non-finite start coordinates before route generation', () => {
    const result = validateMVPWalkRequest({
      ...mileEndRequest,
      start: {
        label: 'Invalid start',
        coordinate: { lat: Number.POSITIVE_INFINITY, lng: -73.5996 },
      },
    }, montrealCityProfile);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Start point coordinates must be finite numbers.');
  });

  it('rejects non-finite walk goals before route generation', () => {
    const result = validateMVPWalkRequest({
      ...mileEndRequest,
      stepGoal: Number.NaN,
      timeGoalMinutes: Number.POSITIVE_INFINITY,
    }, montrealCityProfile);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Choose between 1,500 and 20,000 steps.');
    expect(result.errors).toContain('Choose between 15 and 240 minutes.');
  });

  it('converts steps and time into a primary target distance', () => {
    const target = metersForWalkTarget(mileEndRequest, montrealCityProfile);

    expect(target.primaryMeters).toBe(6000);
    expect(target.timeSanityMeters).toBe(5670);
    expect(target.minMeters).toBe(5100);
    expect(target.maxMeters).toBe(6900);
  });

  it('accepts omitted time goals and derives a walk duration from the step goal', () => {
    const stepOnlyRequest: MVPWalkRequest = {
      ...mileEndRequest,
      timeGoalMinutes: undefined,
    };

    const validation = validateMVPWalkRequest(stepOnlyRequest, montrealCityProfile);
    const target = metersForWalkTarget(stepOnlyRequest, montrealCityProfile);

    expect(validation.valid).toBe(true);
    expect(target.primaryMeters).toBe(6000);
    expect(target.timeSanityMeters).toBe(5994);
  });

  it('scores step-only requests against the derived walk duration', () => {
    const stepOnlyRequest: MVPWalkRequest = {
      ...mileEndRequest,
      timeGoalMinutes: undefined,
    };
    const start = mileEndRequest.start.coordinate;
    const scored = scoreRouteCandidate({
      id: 'derived-duration-route',
      label: 'Derived duration loop',
      cityId: 'montreal',
      geometry: [start, { lat: start.lat + 0.01, lng: start.lng + 0.01 }, start],
      pois: [],
      distanceMeters: 6000,
      durationSeconds: 74 * 60,
      estimatedSteps: 8000,
      provider: 'test-routing',
      debug: {
        targetMeters: 6000,
        waypointStrategy: 'test',
      },
    }, stepOnlyRequest, montrealCityProfile);

    expect(scored.score.breakdown.timeFit).toBe(100);
  });

  it('generates 5 to 10 loop route candidates that return to the start', async () => {
    const routes = await generateRouteCandidates(mileEndRequest, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider: createSeedRoutingProvider(),
    });

    expect(routes.length).toBeGreaterThanOrEqual(5);
    expect(routes.length).toBeLessThanOrEqual(10);
    expect(routes.every((route) => route.geometry[0] === route.geometry.at(-1))).toBe(true);
    expect(routes[0].pois.length).toBeGreaterThan(0);
  });

  it('does not repeat the same POI inside a sparse route candidate', async () => {
    const sparsePois: POI[] = [
      {
        id: 'sparse-cafe',
        cityId: 'montreal',
        name: 'Sparse Cafe',
        category: 'cafes',
        coordinate: { lat: 45.524, lng: -73.599 },
        source: 'curated',
        moods: ['coffee'],
        interestTags: ['cafes'],
        computedRouteValue: 80,
        lastImportedAt: '2026-05-26T00:00:00.000Z',
      },
      {
        id: 'sparse-architecture',
        cityId: 'montreal',
        name: 'Sparse Architecture',
        category: 'architecture',
        coordinate: { lat: 45.525, lng: -73.598 },
        source: 'curated',
        moods: ['historic'],
        interestTags: ['architecture'],
        computedRouteValue: 75,
        lastImportedAt: '2026-05-26T00:00:00.000Z',
      },
    ];
    const waypointGroups: string[][] = [];
    const routingProvider: RoutingProvider = {
      async walkingRoute(input) {
        waypointGroups.push(input.waypoints.map((waypoint) => waypoint.id));

        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / montrealCityProfile.defaultWalkingSpeedMps),
          provider: 'test-routing',
        };
      },
    };

    await generateRouteCandidates(mileEndRequest, {
      city: montrealCityProfile,
      poiProvider: {
        async findNearby() {
          return sparsePois;
        },
      },
      routingProvider,
    });

    expect(waypointGroups.length).toBeGreaterThanOrEqual(5);
    expect(waypointGroups.every((group) => new Set(group).size === group.length)).toBe(true);
  });

  it('adds hidden loop-shaping anchors to routing requests without exposing them as POIs', async () => {
    const routedWaypointIds: string[][] = [];
    const routedWaypointCoordinates: string[][] = [];
    const routingProvider: RoutingProvider = {
      async walkingRoute(input) {
        routedWaypointIds.push(input.waypoints.map((waypoint) => waypoint.id));
        routedWaypointCoordinates.push(input.waypoints.map((waypoint) => `${waypoint.coordinate.lat},${waypoint.coordinate.lng}`));

        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / montrealCityProfile.defaultWalkingSpeedMps),
          provider: 'test-routing',
        };
      },
    };

    const routes = await generateRouteCandidates(mileEndRequest, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider,
    });

    expect(routedWaypointIds[0].some((id) => id.startsWith('route-anchor-'))).toBe(true);
    expect(routes[0].pois.some((poi) => poi.id.startsWith('route-anchor-'))).toBe(false);
    expect(routes[0].debug.requestedWaypointCount).toBeGreaterThan(routes[0].pois.length + 2);

    const scored = scoreRouteCandidate(routes[0], mileEndRequest, montrealCityProfile);
    const hiddenAnchorIndex = routedWaypointIds[0].findIndex((id) => id.startsWith('route-anchor-'));
    const googleMapsUrl = new URL(scored.exportLinks.googleMaps);

    expect(googleMapsUrl.searchParams.get('waypoints')).toContain(routedWaypointCoordinates[0][hiddenAnchorIndex]);
  });

  it('generates basic fallback loops when no nearby POIs match the request', async () => {
    const routedWaypointIds: string[][] = [];
    const routingProvider: RoutingProvider = {
      async walkingRoute(input) {
        routedWaypointIds.push(input.waypoints.map((waypoint) => waypoint.id));

        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / montrealCityProfile.defaultWalkingSpeedMps),
          provider: 'test-routing',
        };
      },
    };

    const routes = await generateRouteCandidates(mileEndRequest, {
      city: montrealCityProfile,
      poiProvider: {
        async findNearby() {
          return [];
        },
      },
      routingProvider,
    });

    expect(routes.length).toBeGreaterThanOrEqual(5);
    expect(routes[0].pois).toEqual([]);
    expect(routes[0].debug.fallbackReason).toContain('No matching POIs');
    expect(routes[0].debug.waypointStrategy).toContain('without visible POIs');
    expect(routedWaypointIds[0].every((id) => id.startsWith('route-anchor-'))).toBe(true);
  });

  it('skips failed candidate routes while keeping other route options', async () => {
    let attempt = 0;
    const routingProvider: RoutingProvider = {
      async walkingRoute(input) {
        attempt += 1;

        if (attempt === 2) throw new Error('Provider rejected one candidate');

        return {
          geometry: [input.start, ...input.waypoints.map((waypoint) => waypoint.coordinate), input.start],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / montrealCityProfile.defaultWalkingSpeedMps),
          provider: 'test-routing',
        };
      },
    };

    const routes = await generateRouteCandidates(mileEndRequest, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider,
    });

    expect(routes).toHaveLength(7);
    expect(routes.map((route) => route.id)).not.toContain('route-montreal-2');
    expect(routes[0].debug.skippedCandidateErrors).toContain('route-montreal-2: Provider rejected one candidate');
  });

  it('scores step-fit mood-matched routes above poor-fit alternatives', async () => {
    const routes = await generateRouteCandidates(mileEndRequest, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider: createSeedRoutingProvider(),
    });

    const scored = routes
      .map((route) => scoreRouteCandidate(route, mileEndRequest, montrealCityProfile))
      .sort((a, b) => b.score.total - a.score.total);

    expect(scored[0].score.breakdown.stepFit).toBeGreaterThan(70);
    expect(scored[0].explanation).toContain('step goal');
    expect(scored[0].exportLinks.gpx).toContain('<gpx');
  });

  it('assigns route differentiators from metrics instead of rank position', () => {
    const makeRoute = (id: string, label: string, total: number): ScoredRoute => ({
      id,
      label,
      cityId: 'montreal',
      geometry: [mileEndRequest.start.coordinate, mileEndRequest.start.coordinate],
      pois: [],
      distanceMeters: id === 'longer' ? 9500 : id === 'shorter' ? 3600 : 6500,
      durationSeconds: 1000,
      estimatedSteps: id === 'longer' ? 12500 : id === 'shorter' ? 4800 : 8600,
      provider: 'test',
      debug: { targetMeters: 1000, waypointStrategy: 'test' },
      score: {
        total,
        breakdown: {
          stepFit: total,
          timeFit: total,
          moodMatch: total,
          interestMatch: total,
          poiSpacing: total,
          detourPenalty: 0,
          parkWaterfrontBonus: 0,
          excessTurnPenalty: 0,
        },
      },
      explanation: 'test',
      scoreSummary: [],
      exportLinks: { googleMaps: 'https://example.com', gpx: `<gpx><name>${label}</name></gpx>` },
    });

    const ranked = rankScoredRoutes([
      makeRoute('shorter', 'Seed label', 85),
      makeRoute('best', 'Seed label', 95),
      makeRoute('longer', 'Seed label', 75),
    ]);

    expect(ranked.map((route) => [route.id, route.fitCategory, route.label])).toEqual([
      ['best', 'best-fit', 'Best fit'],
      ['shorter', 'shorter', 'Shorter loop'],
      ['longer', 'scenic', 'Scenic stretch'],
    ]);
    expect(ranked[1].fitReason).toContain('shorter');
    expect(ranked[2].fitReason).not.toContain('shorter');
    expect(ranked[0].exportLinks.gpx).toContain('<name>Best fit</name>');
  });

  it('does not call a scenic same-length route roomier', () => {
    const makeRoute = (id: string, parkWaterfrontBonus: number, total: number): ScoredRoute => ({
      id,
      label: 'Seed label',
      cityId: 'montreal',
      geometry: [mileEndRequest.start.coordinate, mileEndRequest.start.coordinate],
      pois: [],
      distanceMeters: 6500,
      durationSeconds: 5000,
      estimatedSteps: 8600,
      provider: 'test',
      debug: { targetMeters: 6500, waypointStrategy: 'test' },
      score: {
        total,
        breakdown: {
          stepFit: total,
          timeFit: total,
          moodMatch: total,
          interestMatch: total,
          poiSpacing: total,
          detourPenalty: 0,
          parkWaterfrontBonus,
          excessTurnPenalty: 0,
        },
      },
      explanation: 'test',
      scoreSummary: [],
      exportLinks: { googleMaps: 'https://example.com', gpx: '<gpx />' },
    });

    const ranked = rankScoredRoutes([
      makeRoute('best', 0, 95),
      makeRoute('scenic', 18, 85),
    ]);

    expect(ranked[1].fitCategory).toBe('scenic');
    expect(ranked[1].fitReason).toContain('park or waterfront');
    expect(ranked[1].fitReason).not.toContain('roomier');
  });

  it('exports compact Google Maps links from route stops instead of full provider geometry', async () => {
    const [route] = await generateRouteCandidates(mileEndRequest, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider: createSeedRoutingProvider(),
    });
    const denseGeometry = Array.from({ length: 180 }, (_, index) => ({
      lat: 45.5234 + index * 0.00001,
      lng: -73.5996 + index * 0.00001,
    }));
    const scored = scoreRouteCandidate({
      ...route,
      geometry: [route.geometry[0], ...denseGeometry, route.geometry[0]],
    }, mileEndRequest, montrealCityProfile);
    const googleMapsUrl = new URL(scored.exportLinks.googleMaps);

    expect(scored.exportLinks.googleMaps.length).toBeLessThan(700);
    expect(scored.exportLinks.googleMaps).toContain('/maps/dir/?api=1');
    expect(scored.exportLinks.googleMaps).toContain('travelmode=walking');
    expect(scored.exportLinks.googleMaps).toContain('waypoints=');
    expect(scored.exportLinks.googleMaps).toContain('%7C');
    expect(scored.exportLinks.googleMaps).not.toContain('|');
    expect(googleMapsUrl.searchParams.get('origin')).toBe(`${route.geometry[0].lat},${route.geometry[0].lng}`);
    expect(googleMapsUrl.searchParams.get('waypoints')).toContain(`${route.pois[0].coordinate.lat},${route.pois[0].coordinate.lng}`);
    expect(scored.exportLinks.googleMaps).not.toContain('45.524');
  });

  it('exports GPX with named POI waypoints and escaped XML text', async () => {
    const [route] = await generateRouteCandidates(mileEndRequest, {
      city: montrealCityProfile,
      poiProvider: {
        async findNearby() {
          return [
            {
              id: 'cafe-special',
              cityId: 'montreal',
              name: 'Café & Bakery <Mile End>',
              category: 'cafes',
              coordinate: { lat: 45.5241, lng: -73.6002 },
              source: 'curated',
              moods: ['coffee'],
              interestTags: ['cafes'],
              computedRouteValue: 95,
              lastImportedAt: '2026-05-26T00:00:00.000Z',
            },
          ];
        },
      },
      routingProvider: createSeedRoutingProvider(),
    });
    const scored = scoreRouteCandidate({
      ...route,
      label: 'Coffee & Architecture <Loop>',
    }, mileEndRequest, montrealCityProfile);

    expect(scored.exportLinks.gpx).toContain('<name>Coffee &amp; Architecture &lt;Loop&gt;</name>');
    expect(scored.exportLinks.gpx).toContain('<wpt lat="45.5241" lon="-73.6002">');
    expect(scored.exportLinks.gpx).toContain('<name>1. Café &amp; Bakery &lt;Mile End&gt;</name>');
    expect(scored.exportLinks.gpx).not.toContain('Café & Bakery <Mile End>');
  });

  it('scores fallback routes with no visible POIs without producing invalid numbers', () => {
    const start = mileEndRequest.start.coordinate;
    const scored = scoreRouteCandidate({
      id: 'no-poi-route',
      label: 'Fallback loop',
      cityId: 'montreal',
      geometry: [start, { lat: start.lat + 0.01, lng: start.lng + 0.01 }, start],
      pois: [],
      distanceMeters: 6000,
      durationSeconds: 4200,
      estimatedSteps: 8000,
      provider: 'fallback-routing',
      debug: {
        targetMeters: 6000,
        waypointStrategy: 'fallback',
        fallbackReason: 'No POIs matched the request.',
      },
    }, mileEndRequest, montrealCityProfile);

    expect(Number.isFinite(scored.score.total)).toBe(true);
    expect(Object.values(scored.score.breakdown).every(Number.isFinite)).toBe(true);
    expect(scored.score.breakdown.moodMatch).toBe(0);
    expect(scored.score.breakdown.interestMatch).toBe(0);
    expect(scored.explanation).toContain('without matching POI anchors');
  });
});
