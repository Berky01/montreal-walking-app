import { describe, expect, it } from 'vitest';
import { runDeploymentDoctor } from './deploymentDoctor';

function createPublicRouteFixture(id: string) {
  return {
    id,
    provider: 'mapbox-directions',
    distanceMeters: 3750,
    durationSeconds: 2700,
    estimatedSteps: 5000,
    geometry: [
      { lat: 45.5234, lng: -73.5996 },
      { lat: 45.529, lng: -73.5902 },
      { lat: 45.5234, lng: -73.5996 },
    ],
    pois: [
      {
        id: `${id}-poi`,
        name: 'Cafe Olimpico',
        category: 'cafes',
        coordinate: { lat: 45.5247, lng: -73.5991 },
      },
    ],
    explanation: 'A live Montréal walking route with a coffee anchor.',
  };
}

function createPublicRouteSummary(id: string) {
  return {
    id,
    title: `Route ${id}`,
    distanceMeters: 3750,
    estimatedSteps: 5000,
  };
}

describe('deployment doctor', () => {
  it('passes when env, live readiness, provider tests, and route smoke tests are healthy', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });

      if (url === 'https://walk.example.com/api/health/providers') {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url === 'https://walk.example.com/api/health/live') {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
        });
      }

      if (url === 'https://walk.example.com/api/client-config') {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url === 'https://walk.example.com/api/health/live') {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
        });
      }

      if (url === 'https://walk.example.com/api/client-config') {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url === 'https://walk.example.com/api/admin/provider-self-test') {
        expect(init).toEqual(expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'content-type': 'application/json',
            'x-admin-token': 'doctor-secret',
          }),
          body: '{}',
        }));

        return Response.json({
          ok: true,
          checks: [
            { id: 'maptiler-style', label: 'MapTiler style', status: 'ok', message: 'ok' },
          ],
        });
      }

      if (url === 'https://walk.example.com/api/admin/route-smoke-test') {
        expect(init).toEqual(expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'content-type': 'application/json',
            'x-admin-token': 'doctor-secret',
          }),
          body: '{}',
        }));

        return Response.json({
          ok: true,
          passed: 3,
          failed: 0,
          checks: [],
        });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(true);
    expect(result.checks.every((check) => check.status === 'ok')).toBe(true);
    expect(calls.map((call) => call.url)).toEqual([
      'https://walk.example.com/api/health/providers',
      'https://walk.example.com/api/health/live',
      'https://walk.example.com/api/client-config',
      'https://walk.example.com/api/admin/provider-self-test',
      'https://walk.example.com/api/admin/route-smoke-test',
    ]);
  });

  it('fails when runtime client config does not expose a browser map key', async () => {
    const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url.endsWith('/api/client-config')) {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: '' },
          ops: { enabled: false },
        });
      }

      if (url.endsWith('/api/admin/provider-self-test')) {
        return Response.json({ ok: true, checks: [] });
      }

      if (url.endsWith('/api/admin/route-smoke-test')) {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'client-config',
        status: 'fail',
        message: 'Runtime client config is missing the browser MapTiler key.',
        action: 'Confirm MAPTILER_API_KEY is set in the running API environment and restart the API.',
      }),
    ]));
  });

  it('fails when runtime client config exposes a stale browser map key', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url.endsWith('/api/client-config')) {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'old-map-key' },
          ops: { enabled: false },
        });
      }

      if (url.endsWith('/api/admin/provider-self-test')) {
        return Response.json({ ok: true, checks: [] });
      }

      if (url.endsWith('/api/admin/route-smoke-test')) {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'current-map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'client-config',
        status: 'fail',
        message: 'Runtime client config exposes a different MapTiler key than the current environment.',
        action: 'Restart the API/frontend stack and confirm the reverse proxy reaches the current API service.',
      }),
    ]));
  });

  it('checks the public frontend and proxied API when a public base URL is provided', async () => {
    const calls: string[] = [];
    const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);

      if (url === 'https://walk.example.com/') {
        return new Response('<!doctype html><div id="root"></div>', {
          headers: { 'content-type': 'text/html' },
        });
      }

      if (url === 'https://walk.example.com/api/health/providers') {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url === 'https://walk.example.com/api/health/live') {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
        });
      }

      if (url === 'https://walk.example.com/api/client-config') {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url === 'https://walk.example.com/api/geocode?query=Station%20Laurier&city=montreal') {
        return Response.json({
          places: [
            {
              id: 'geoapify-station-laurier',
              label: 'Station Laurier, Montréal',
              coordinate: { lat: 45.5272, lng: -73.5893 },
            },
          ],
          provider: 'geoapify',
        });
      }

      if (url === 'https://walk.example.com/api/routes/generate') {
        expect(init).toEqual(expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }));
        expect(JSON.parse(String(init?.body))).toEqual(expect.objectContaining({
          cityId: 'montreal',
          stepGoal: 5000,
          routeType: 'loop',
          start: expect.objectContaining({
            coordinate: { lat: 45.5234, lng: -73.5996 },
          }),
        }));

        return Response.json({
          requestId: 'public-smoke-request',
          topRoutes: [
            createPublicRouteSummary('public-smoke-route-1'),
            createPublicRouteSummary('public-smoke-route-2'),
            createPublicRouteSummary('public-smoke-route-3'),
          ],
          remainingRoutes: [],
          fallback: null,
        });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-1') {
        return Response.json({ route: createPublicRouteFixture('public-smoke-route-1') });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-2') {
        return Response.json({ route: createPublicRouteFixture('public-smoke-route-2') });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-3') {
        return Response.json({ route: createPublicRouteFixture('public-smoke-route-3') });
      }

      if (url === 'http://127.0.0.1:5174/api/health/providers') {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url === 'http://127.0.0.1:5174/api/health/live') {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
        });
      }

      if (url === 'http://127.0.0.1:5174/api/client-config') {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url === 'http://127.0.0.1:5174/api/admin/provider-self-test') {
        return Response.json({ ok: true, checks: [] });
      }

      if (url === 'http://127.0.0.1:5174/api/admin/route-smoke-test') {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174',
      publicBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'public-frontend',
        status: 'ok',
        message: 'Public frontend is reachable.',
      }),
      expect.objectContaining({
        id: 'public-api-proxy',
        status: 'ok',
        message: 'Public API proxy reports live ready.',
      }),
      expect.objectContaining({
        id: 'public-live-health',
        status: 'ok',
        message: 'Public live health endpoint returned ready.',
      }),
      expect.objectContaining({
        id: 'public-client-config',
        status: 'ok',
        message: 'Public runtime client config exposes the browser map key.',
      }),
      expect.objectContaining({
        id: 'public-geocoding',
        status: 'ok',
        message: 'Public geocoding returned live Montréal results.',
      }),
      expect.objectContaining({
        id: 'public-route-generation',
        status: 'ok',
        message: 'Public route generation returned three usable live route options.',
      }),
    ]));
    expect(calls).toEqual(expect.arrayContaining([
      'https://walk.example.com/',
      'https://walk.example.com/api/health/providers',
      'https://walk.example.com/api/health/live',
      'https://walk.example.com/api/client-config',
      'https://walk.example.com/api/geocode?query=Station%20Laurier&city=montreal',
      'https://walk.example.com/api/routes/generate',
      'https://walk.example.com/api/routes/public-smoke-route-1',
      'https://walk.example.com/api/routes/public-smoke-route-2',
      'https://walk.example.com/api/routes/public-smoke-route-3',
    ]));
    expect(result.ok).toBe(true);
  });

  it('fails public route generation when fewer than three visible route options are returned', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url === 'https://walk.example.com/') {
        return new Response('<!doctype html><div id="root"></div>');
      }

      if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url.endsWith('/api/client-config')) {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url === 'https://walk.example.com/api/geocode?query=Station%20Laurier&city=montreal') {
        return Response.json({
          places: [
            {
              id: 'geoapify-station-laurier',
              label: 'Station Laurier, Montréal',
              coordinate: { lat: 45.5272, lng: -73.5893 },
            },
          ],
          provider: 'geoapify',
        });
      }

      if (url === 'https://walk.example.com/api/routes/generate') {
        return Response.json({
          requestId: 'public-smoke-request',
          topRoutes: [{ id: 'public-smoke-route', provider: 'mapbox-directions' }],
          remainingRoutes: [],
          fallback: null,
        });
      }

      if (url.endsWith('/api/admin/provider-self-test')) {
        return Response.json({ ok: true, checks: [] });
      }

      if (url.endsWith('/api/admin/route-smoke-test')) {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174',
      publicBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'public-route-generation',
        status: 'fail',
        message: 'Public route generation returned fewer than three visible route options.',
        action: 'Confirm public /api/routes/generate returns the three route options the MVP UI needs.',
      }),
    ]));
  });

  it('fails public route generation when a detail payload is missing', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url === 'https://walk.example.com/') {
        return new Response('<!doctype html><div id="root"></div>');
      }

      if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url.endsWith('/api/client-config')) {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url === 'https://walk.example.com/api/geocode?query=Station%20Laurier&city=montreal') {
        return Response.json({
          places: [
            {
              id: 'geoapify-station-laurier',
              label: 'Station Laurier, Montréal',
              coordinate: { lat: 45.5272, lng: -73.5893 },
            },
          ],
          provider: 'geoapify',
        });
      }

      if (url === 'https://walk.example.com/api/routes/generate') {
        return Response.json({
          requestId: 'public-smoke-request',
          topRoutes: [
            { id: 'public-smoke-route-1', provider: 'mapbox-directions' },
            { id: 'public-smoke-route-2', provider: 'mapbox-directions' },
            { id: 'public-smoke-route-3', provider: 'mapbox-directions' },
          ],
          remainingRoutes: [],
          fallback: null,
        });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-1') {
        return Response.json({ route: createPublicRouteFixture('public-smoke-route-1') });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-2') {
        return Response.json({ error: 'Route not found' }, { status: 404 });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-3') {
        return Response.json({ route: createPublicRouteFixture('public-smoke-route-3') });
      }

      if (url.endsWith('/api/admin/provider-self-test')) {
        return Response.json({ ok: true, checks: [] });
      }

      if (url.endsWith('/api/admin/route-smoke-test')) {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174',
      publicBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'public-route-generation',
        status: 'fail',
        message: 'Public route detail lookup failed for generated route options.',
        action: 'Confirm public /api/routes/:id returns detail payloads for generated route IDs.',
        details: ['Route 2 (public-smoke-route-2): detail returned 404'],
      }),
    ]));
  });

  it('fails public route generation when detail payloads are missing facts or geometry', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url === 'https://walk.example.com/') {
        return new Response('<!doctype html><div id="root"></div>');
      }

      if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url.endsWith('/api/client-config')) {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url === 'https://walk.example.com/api/geocode?query=Station%20Laurier&city=montreal') {
        return Response.json({
          places: [
            {
              id: 'geoapify-station-laurier',
              label: 'Station Laurier, Montréal',
              coordinate: { lat: 45.5272, lng: -73.5893 },
            },
          ],
          provider: 'geoapify',
        });
      }

      if (url === 'https://walk.example.com/api/routes/generate') {
        return Response.json({
          requestId: 'public-smoke-request',
          topRoutes: [
            createPublicRouteSummary('public-smoke-route-1'),
            createPublicRouteSummary('public-smoke-route-2'),
            createPublicRouteSummary('public-smoke-route-3'),
          ],
          remainingRoutes: [],
          fallback: null,
        });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-1') {
        return Response.json({
          route: {
            ...createPublicRouteFixture('public-smoke-route-1'),
            geometry: [],
          },
        });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-2') {
        return Response.json({ route: createPublicRouteFixture('public-smoke-route-2') });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-3') {
        return Response.json({ route: createPublicRouteFixture('public-smoke-route-3') });
      }

      if (url.endsWith('/api/admin/provider-self-test')) {
        return Response.json({ ok: true, checks: [] });
      }

      if (url.endsWith('/api/admin/route-smoke-test')) {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174',
      publicBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'public-route-generation',
        status: 'fail',
        message: 'Public route details are missing usable route facts or geometry.',
        action: 'Confirm public /api/routes/:id returns complete route detail payloads for the MVP route screen.',
        details: ['Route 1 (public-smoke-route-1)'],
      }),
    ]));
  });

  it('fails public route generation when detail payloads are missing POIs or explanations', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url === 'https://walk.example.com/') {
        return new Response('<!doctype html><div id="root"></div>');
      }

      if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url.endsWith('/api/client-config')) {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url === 'https://walk.example.com/api/geocode?query=Station%20Laurier&city=montreal') {
        return Response.json({
          places: [
            {
              id: 'geoapify-station-laurier',
              label: 'Station Laurier, Montréal',
              coordinate: { lat: 45.5272, lng: -73.5893 },
            },
          ],
          provider: 'geoapify',
        });
      }

      if (url === 'https://walk.example.com/api/routes/generate') {
        return Response.json({
          requestId: 'public-smoke-request',
          topRoutes: [
            createPublicRouteSummary('public-smoke-route-1'),
            createPublicRouteSummary('public-smoke-route-2'),
            createPublicRouteSummary('public-smoke-route-3'),
          ],
          remainingRoutes: [],
          fallback: null,
        });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-1') {
        return Response.json({
          route: { ...createPublicRouteFixture('public-smoke-route-1'), pois: [] },
        });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-2') {
        return Response.json({
          route: { ...createPublicRouteFixture('public-smoke-route-2'), explanation: '' },
        });
      }

      if (url === 'https://walk.example.com/api/routes/public-smoke-route-3') {
        return Response.json({ route: createPublicRouteFixture('public-smoke-route-3') });
      }

      if (url.endsWith('/api/admin/provider-self-test')) {
        return Response.json({ ok: true, checks: [] });
      }

      if (url.endsWith('/api/admin/route-smoke-test')) {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174',
      publicBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'public-route-generation',
        status: 'fail',
        message: 'Public route details are missing POIs or explanations.',
        action: 'Confirm public /api/routes/:id returns POI anchors and route explanations for the MVP route screen.',
        details: ['Route 1 (public-smoke-route-1)', 'Route 2 (public-smoke-route-2)'],
      }),
    ]));
  });

  it('fails public frontend checks when the reverse proxy does not serve the app shell', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url === 'https://walk.example.com/') {
        return Response.json({ ok: true });
      }

      if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url.endsWith('/api/client-config')) {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url.endsWith('/api/admin/provider-self-test')) {
        return Response.json({ ok: true, checks: [] });
      }

      if (url.endsWith('/api/admin/route-smoke-test')) {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174',
      publicBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'public-frontend',
        status: 'fail',
        message: 'Public frontend did not return the app shell.',
        action: 'Confirm the reverse proxy serves the frontend container, not an API response.',
      }),
    ]));
  });

  it('fails public deployment checks when the public URL is not HTTPS', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url === 'http://walk.example.com/') {
        return new Response('<!doctype html><div id="root"></div>');
      }

      if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url.endsWith('/api/client-config')) {
        return Response.json({
          city: 'montreal',
          map: { provider: 'maptiler', mapTilerKey: 'map-key' },
          ops: { enabled: false },
        });
      }

      if (url.endsWith('/api/admin/provider-self-test')) {
        return Response.json({ ok: true, checks: [] });
      }

      if (url.endsWith('/api/admin/route-smoke-test')) {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174',
      publicBaseUrl: 'http://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'public-https',
        status: 'fail',
        message: 'Public frontend URL is not HTTPS.',
        action: 'Serve the public app over HTTPS so browser geolocation and secure APIs work.',
      }),
    ]));
  });

  it('warns when the ops panel remains enabled for a public deployment check', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith('/api/health/providers')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
          providers: {},
        });
      }

      if (url.endsWith('/api/health/live')) {
        return Response.json({
          ok: true,
          liveReady: true,
          missingLiveProviders: [],
        });
      }

      if (url.endsWith('/api/admin/provider-self-test')) {
        return Response.json({ ok: true, checks: [] });
      }

      if (url.endsWith('/api/admin/route-smoke-test')) {
        return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
      }

      if (url === 'https://walk.example.com/') {
        return new Response('<!doctype html><div id="root"></div>');
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      publicBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        ENABLE_OPS_PANEL: 'true',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'env-ops-panel',
        status: 'warn',
        message: 'ENABLE_OPS_PANEL is enabled.',
        action: 'Set ENABLE_OPS_PANEL=false before public launch; enable it only temporarily for operator checks.',
      }),
    ]));
  });

  it('fails with actionable missing-env checks and skips admin probes when admin token is not configured', async () => {
    const calls: string[] = [];
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);
      calls.push(url);

      if (url.endsWith('/api/health/providers')) {
        return Response.json({
          ok: true,
          liveReady: false,
          missingLiveProviders: ['maps', 'geocoding', 'routing', 'admin token'],
          providers: {},
        });
      }

      if (url.endsWith('/api/health/live')) {
        return Response.json({
          ok: false,
          liveReady: false,
          missingLiveProviders: ['maps', 'geocoding', 'routing', 'admin token'],
        }, { status: 503 });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174/',
      env: {
        ADMIN_TOKEN: '',
        MAPTILER_API_KEY: '',
        GEOAPIFY_API_KEY: '',
        MAPBOX_ACCESS_TOKEN: '',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'env-admin-token', status: 'fail', action: expect.stringContaining('ADMIN_TOKEN') }),
      expect.objectContaining({ id: 'env-maptiler', status: 'fail', action: expect.stringContaining('MAPTILER_API_KEY') }),
      expect.objectContaining({ id: 'env-geoapify', status: 'fail', action: expect.stringContaining('GEOAPIFY_API_KEY') }),
      expect.objectContaining({ id: 'env-routing', status: 'fail', action: expect.stringContaining('GEOAPIFY_API_KEY') }),
      expect.objectContaining({
        id: 'health-providers',
        status: 'fail',
        action: 'Use /api/health/providers for setup steps, or enable ENABLE_OPS_PANEL=true temporarily and open ?ops=1.',
      }),
      expect.objectContaining({ id: 'provider-self-test', status: 'skip', action: expect.stringContaining('ADMIN_TOKEN') }),
      expect.objectContaining({ id: 'route-smoke-test', status: 'skip', action: expect.stringContaining('ADMIN_TOKEN') }),
    ]));
    expect(calls).toEqual([
      'http://127.0.0.1:5174/api/health/providers',
      'http://127.0.0.1:5174/api/health/live',
    ]);
  });

  it('fails provider key env checks when placeholder values are still present', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith('/api/health/providers')) {
        return Response.json({
          ok: true,
          liveReady: false,
          missingLiveProviders: ['maps', 'geocoding', 'routing'],
          providers: {},
        });
      }

      if (url.endsWith('/api/health/live')) {
        return Response.json({
          ok: false,
          liveReady: false,
          missingLiveProviders: ['maps', 'geocoding', 'routing'],
        }, { status: 503 });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'replace-with-maptiler-key',
        GEOAPIFY_API_KEY: 'your-geoapify-api-key',
        MAPBOX_ACCESS_TOKEN: 'mapbox-token-here',
      },
      fetcher,
    });

    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'env-maptiler',
        status: 'fail',
        message: 'MAPTILER_API_KEY is still a placeholder.',
      }),
      expect.objectContaining({
        id: 'env-geoapify',
        status: 'fail',
        message: 'GEOAPIFY_API_KEY is still a placeholder.',
      }),
      expect.objectContaining({
        id: 'env-routing',
        status: 'fail',
        message: 'No walking routing key is configured.',
      }),
    ]));
  });

  it('reports POI cache and persistence readiness separately from missing live provider keys', async () => {
    const fetcher = async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith('/api/health/providers')) {
        return Response.json({
          ok: true,
          liveReady: false,
          missingLiveProviders: ['maps', 'geocoding', 'routing', 'admin token'],
          providers: {
            pois: {
              cacheAvailable: true,
              count: 2750,
              coverageReady: true,
              missingCategories: [],
            },
            persistence: {
              configured: true,
              writable: true,
              storePath: 'data/route-store.json',
            },
          },
        });
      }

      if (url.endsWith('/api/health/live')) {
        return Response.json({
          ok: false,
          liveReady: false,
          missingLiveProviders: ['maps', 'geocoding', 'routing', 'admin token'],
        }, { status: 503 });
      }

      throw new Error(`Unexpected fetch ${url}`);
    };

    const result = await runDeploymentDoctor({
      apiBaseUrl: 'http://127.0.0.1:5174/',
      env: {
        ADMIN_TOKEN: '',
        MAPTILER_API_KEY: '',
        GEOAPIFY_API_KEY: '',
        MAPBOX_ACCESS_TOKEN: '',
      },
      fetcher,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'poi-cache',
        label: 'POI cache',
        status: 'ok',
        message: 'POI cache is ready with 2750 imported POIs.',
      }),
      expect.objectContaining({
        id: 'route-persistence',
        label: 'Route persistence',
        status: 'ok',
        message: 'Route persistence is writable at data/route-store.json.',
      }),
    ]));
  });

  it('times out API checks instead of hanging deployment doctor', async () => {
    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: '',
        MAPTILER_API_KEY: '',
        GEOAPIFY_API_KEY: '',
        MAPBOX_ACCESS_TOKEN: '',
      },
      fetcher: async () => new Promise<Response>(() => {}),
      timeoutMs: 1,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'health-providers',
        status: 'fail',
        message: 'Provider health timed out after 1ms.',
      }),
      expect.objectContaining({
        id: 'health-live',
        status: 'fail',
        message: 'Live health timed out after 1ms.',
      }),
    ]));
  });

  it('times out protected admin probes instead of hanging deployment doctor', async () => {
    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher: async (input) => {
        const url = String(input);

        if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
          return Response.json({
            ok: true,
            liveReady: true,
            missingLiveProviders: [],
          });
        }

        return new Promise<Response>(() => {});
      },
      timeoutMs: 1,
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'provider-self-test',
        status: 'fail',
        message: 'Provider self-test timed out after 1ms.',
      }),
      expect.objectContaining({
        id: 'route-smoke-test',
        status: 'fail',
        message: 'Route smoke test timed out after 1ms.',
      }),
    ]));
  });

  it('includes failing route smoke scenario details in the doctor result', async () => {
    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher: async (input) => {
        const url = String(input);

        if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
          return Response.json({
            ok: true,
            liveReady: true,
            missingLiveProviders: [],
          });
        }

        if (url.endsWith('/api/admin/provider-self-test')) {
          return Response.json({ ok: true, checks: [] });
        }

        if (url.endsWith('/api/admin/route-smoke-test')) {
          return Response.json({
            ok: false,
            passed: 1,
            failed: 2,
            checks: [
              {
                id: 'mile-end-coffee',
                label: 'Mile End coffee loop',
                status: 'warn',
                routeCount: 3,
                issues: ['Best route score is below launch quality (71/100; minimum 76/100).'],
              },
              {
                id: 'verdun-scenic',
                label: 'Verdun scenic waterfront loop',
                status: 'failed',
                routeCount: 0,
                issues: ['No route candidates returned.'],
              },
            ],
          });
        }

        throw new Error(`Unexpected fetch ${url}`);
      },
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'route-smoke-test',
        status: 'fail',
        message: 'Route smoke test failed with 2 failed scenario(s).',
        action: 'Enable ENABLE_OPS_PANEL=true temporarily, open ?ops=1, and inspect route smoke details.',
        details: [
          'Mile End coffee loop: Best route score is below launch quality (71/100; minimum 76/100).',
          'Verdun scenic waterfront loop: No route candidates returned.',
        ],
      }),
    ]));
  });

  it('includes failing provider self-test details in the doctor result', async () => {
    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: 'map-key',
        GEOAPIFY_API_KEY: 'geo-key',
        MAPBOX_ACCESS_TOKEN: 'route-key',
      },
      fetcher: async (input) => {
        const url = String(input);

        if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
          return Response.json({
            ok: true,
            liveReady: true,
            missingLiveProviders: [],
          });
        }

        if (url.endsWith('/api/admin/provider-self-test')) {
          return Response.json({
            ok: false,
            checks: [
              {
                id: 'geoapify-geocode',
                label: 'Geoapify geocoding',
                status: 'failed',
                message: 'Geoapify returned no Montréal geocoding candidates.',
              },
              {
                id: 'mapbox-walking-route',
                label: 'Mapbox walking route',
                status: 'skipped',
                message: 'Skipped because routing key is unavailable.',
              },
            ],
          });
        }

        if (url.endsWith('/api/admin/route-smoke-test')) {
          return Response.json({ ok: true, passed: 3, failed: 0, checks: [] });
        }

        throw new Error(`Unexpected fetch ${url}`);
      },
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'provider-self-test',
        status: 'fail',
        message: 'Provider self-test failed.',
        action: 'Enable ENABLE_OPS_PANEL=true temporarily, open ?ops=1, and inspect provider self-test details.',
        details: expect.arrayContaining([
          'Geoapify geocoding: Geoapify returned no Montréal geocoding candidates.',
        ]),
      }),
    ]));
  });

  it('includes skipped provider self-test details when live keys are missing', async () => {
    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: '',
        GEOAPIFY_API_KEY: '',
        MAPBOX_ACCESS_TOKEN: '',
      },
      fetcher: async (input) => {
        const url = String(input);

        if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
          return Response.json({
            ok: false,
            liveReady: false,
            missingLiveProviders: ['maps', 'geocoding', 'routing'],
            providers: {},
          }, { status: 503 });
        }

        if (url.endsWith('/api/admin/provider-self-test')) {
          return Response.json({
            ok: false,
            checks: [
              {
                id: 'maptiler-style',
                label: 'MapTiler style',
                status: 'skipped',
                message: 'MAPTILER_API_KEY is not configured.',
              },
              {
                id: 'geoapify-geocode',
                label: 'Geoapify geocoding',
                status: 'skipped',
                message: 'GEOAPIFY_API_KEY is not configured.',
              },
            ],
          });
        }

        if (url.endsWith('/api/admin/route-smoke-test')) {
          return Response.json({ ok: false, passed: 0, failed: 3, checks: [] });
        }

        throw new Error(`Unexpected fetch ${url}`);
      },
    });

    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'provider-self-test',
        status: 'fail',
        details: [
          'MapTiler style: MAPTILER_API_KEY is not configured.',
          'Geoapify geocoding: GEOAPIFY_API_KEY is not configured.',
        ],
      }),
    ]));
  });

  it('includes protected admin endpoint errors when doctor env and running API config disagree', async () => {
    const result = await runDeploymentDoctor({
      apiBaseUrl: 'https://walk.example.com',
      env: {
        ADMIN_TOKEN: 'doctor-secret',
        MAPTILER_API_KEY: '',
        GEOAPIFY_API_KEY: '',
        MAPBOX_ACCESS_TOKEN: '',
      },
      fetcher: async (input) => {
        const url = String(input);

        if (url.endsWith('/api/health/providers') || url.endsWith('/api/health/live')) {
          return Response.json({
            ok: false,
            liveReady: false,
            missingLiveProviders: ['maps', 'geocoding', 'routing', 'admin token'],
            providers: {},
          }, { status: 503 });
        }

        if (url.endsWith('/api/admin/provider-self-test')) {
          return Response.json({ error: 'Admin token is not configured.' }, { status: 503 });
        }

        if (url.endsWith('/api/admin/route-smoke-test')) {
          return Response.json({ error: 'Admin token is not configured.' }, { status: 503 });
        }

        throw new Error(`Unexpected fetch ${url}`);
      },
    });

    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'provider-self-test',
        status: 'fail',
        details: ['Admin token is not configured.'],
      }),
      expect.objectContaining({
        id: 'route-smoke-test',
        status: 'fail',
        details: ['Admin token is not configured.'],
      }),
    ]));
  });
});
