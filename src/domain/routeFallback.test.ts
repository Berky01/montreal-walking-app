import { describe, expect, it } from 'vitest';
import { montrealCityProfile } from './cityProfiles';
import { createSeedPOIProvider } from './providers/seedPOIProvider';
import { createSeedRoutingProvider } from './providers/seedRoutingProvider';
import { generateRouteCandidatesWithFallback } from './routeEngine';
import type { MVPWalkRequest, RoutingProvider } from './mvpTypes';

const request: MVPWalkRequest = {
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
};

describe('route fallback diagnostics', () => {
  it('falls back to seeded routing and records provider failure details', async () => {
    const failingProvider: RoutingProvider = {
      async walkingRoute() {
        throw new Error('Mapbox quota exceeded');
      },
    };

    const result = await generateRouteCandidatesWithFallback(request, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider: failingProvider,
      fallbackRoutingProvider: createSeedRoutingProvider(),
    });

    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toContain('Mapbox quota exceeded');
    expect(result.candidates[0].debug.fallbackReason).toContain('Mapbox quota exceeded');
  });

  it('falls back when primary routing returns too few candidate routes', async () => {
    let primaryAttempts = 0;
    const unstableProvider: RoutingProvider = {
      async walkingRoute(input) {
        primaryAttempts += 1;

        if (primaryAttempts > 2) {
          throw new Error('Mapbox rejected candidate');
        }

        return {
          geometry: [
            input.start,
            ...input.waypoints.map((waypoint) => waypoint.coordinate),
            input.start,
          ],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / 1.35),
          provider: 'unstable-mapbox',
        };
      },
    };

    const result = await generateRouteCandidatesWithFallback(request, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider: unstableProvider,
      fallbackRoutingProvider: createSeedRoutingProvider(),
    });

    expect(result.usedFallback).toBe(true);
    expect(result.candidates.length).toBeGreaterThanOrEqual(5);
    expect(result.candidates[0].provider).toBe('seed-routing-provider');
    expect(result.fallbackReason).toContain('Primary routing returned only 2 candidate');
    expect(result.fallbackReason).toContain('Mapbox rejected candidate');
    expect(result.candidates[0].debug.fallbackReason).toContain('Primary routing returned only 2 candidate');
  });

  it('requires at least five primary route options before accepting live routing', async () => {
    let primaryAttempts = 0;
    const fourOptionProvider: RoutingProvider = {
      async walkingRoute(input) {
        primaryAttempts += 1;

        if (primaryAttempts > 4) {
          throw new Error('Mapbox could not produce another candidate');
        }

        return {
          geometry: [
            input.start,
            ...input.waypoints.map((waypoint) => waypoint.coordinate),
            input.start,
          ],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / 1.35),
          provider: 'mapbox-directions',
        };
      },
    };

    const result = await generateRouteCandidatesWithFallback(request, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider: fourOptionProvider,
      fallbackRoutingProvider: createSeedRoutingProvider(),
    });

    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toContain('Primary routing returned only 4 candidate');
    expect(result.candidates.length).toBeGreaterThanOrEqual(5);
  });

  it('falls back when primary routing returns paths that do not loop back to the start', async () => {
    const openRouteProvider: RoutingProvider = {
      async walkingRoute(input) {
        return {
          geometry: [
            input.start,
            { lat: input.start.lat + 0.01, lng: input.start.lng + 0.01 },
            { lat: input.start.lat + 0.02, lng: input.start.lng + 0.02 },
          ],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / 1.35),
          provider: 'open-route-provider',
        };
      },
    };

    const result = await generateRouteCandidatesWithFallback(request, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider: openRouteProvider,
      fallbackRoutingProvider: createSeedRoutingProvider(),
    });

    expect(result.usedFallback).toBe(true);
    expect(result.candidates[0].provider).toBe('seed-routing-provider');
    expect(result.fallbackReason).toContain('Routed path does not return to the start.');
  });

  it('falls back when primary routing returns geometry outside Montréal bounds', async () => {
    const outOfBoundsRouteProvider: RoutingProvider = {
      async walkingRoute(input) {
        return {
          geometry: [
            input.start,
            { lat: 43.6532, lng: -79.3832 },
            input.start,
          ],
          distanceMeters: input.targetMeters,
          durationSeconds: Math.round(input.targetMeters / 1.35),
          provider: 'out-of-bounds-route-provider',
        };
      },
    };

    const result = await generateRouteCandidatesWithFallback(request, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider: outOfBoundsRouteProvider,
      fallbackRoutingProvider: createSeedRoutingProvider(),
    });

    expect(result.usedFallback).toBe(true);
    expect(result.candidates[0].provider).toBe('seed-routing-provider');
    expect(result.fallbackReason).toContain('Routed path leaves Montréal bounds.');
  });

  it('returns controlled diagnostics when both primary and fallback routing fail', async () => {
    const primaryProvider: RoutingProvider = {
      async walkingRoute() {
        throw new Error('Mapbox quota exceeded');
      },
    };
    const fallbackProvider: RoutingProvider = {
      async walkingRoute() {
        throw new Error('Seed routing unavailable');
      },
    };

    const result = await generateRouteCandidatesWithFallback(request, {
      city: montrealCityProfile,
      poiProvider: createSeedPOIProvider(),
      routingProvider: primaryProvider,
      fallbackRoutingProvider: fallbackProvider,
    });

    expect(result.usedFallback).toBe(true);
    expect(result.candidates).toEqual([]);
    expect(result.fallbackReason).toContain('Mapbox quota exceeded');
    expect(result.fallbackReason).toContain('Seed routing unavailable');
  });
});
