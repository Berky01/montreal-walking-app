import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { ScoredRoute } from './domain/mvpTypes';

const testRoute: ScoredRoute = {
  id: 'route-montreal-1',
  label: 'Coffee and green loop',
  cityId: 'montreal',
  geometry: [
    { lat: 45.5234, lng: -73.5996 },
    { lat: 45.524, lng: -73.598 },
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
    {
      id: 'poi-park',
      cityId: 'montreal',
      name: 'Pocket Park',
      category: 'parks',
      coordinate: { lat: 45.5238, lng: -73.5988 },
      source: 'osm-seed',
      moods: ['green'],
      interestTags: ['parks'],
      computedRouteValue: 82,
      lastImportedAt: '2026-05-26T00:00:00.000Z',
    },
  ],
  distanceMeters: 2400,
  durationSeconds: 1800,
  estimatedSteps: 3200,
  provider: 'test-routing',
  debug: {
    targetMeters: 2400,
    waypointStrategy: 'test',
    requestedWaypointCount: 4,
  },
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
  explanation: 'This loop fits your goal and adds two useful nearby discoveries.',
  scoreSummary: ['95/100 step fit', '88/100 interest fit'],
  fitCategory: 'best-fit',
  fitReason: 'Closest overall match for your goal, mood, and interests.',
  exportLinks: {
    googleMaps: 'https://maps.google.com/?api=1',
    gpx: '<gpx></gpx>',
  },
};

const defaultWalkRoute: ScoredRoute = {
  ...testRoute,
  label: 'Mile End loop',
};

function mockJson(body: unknown, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function mockText(body: string, ok = false, status = 500, contentType = 'text/plain') {
  return {
    ok,
    status,
    headers: new Headers({ 'content-type': contentType }),
    json: async () => {
      throw new SyntaxError('Unexpected token');
    },
    text: async () => body,
  } as unknown as Response;
}

function mockEmpty(ok = false, status = 500) {
  return {
    ok,
    status,
    headers: new Headers({ 'content-type': 'text/plain' }),
    json: async () => {
      throw new SyntaxError('Unexpected end of JSON input');
    },
    text: async () => '',
  } as unknown as Response;
}

function routeSummaryFor(route: ScoredRoute) {
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

function installDefaultFetch(
  routeRequests: Array<Record<string, unknown>> = [],
  options: { walkRoute?: ScoredRoute } = {},
) {
  const walkRoute = options.walkRoute ?? defaultWalkRoute;

  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);

    if (url === '/api/client-config') {
      return mockJson({
        city: 'montreal',
        map: { provider: 'maptiler', mapTilerKey: '' },
        ops: { enabled: false },
      });
    }

    if (url === '/api/progress?city=montreal') {
      return mockJson({
        progress: {
          profileId: 'local',
          cityId: 'montreal',
          placesDiscovered: 18,
          loopsCompleted: 5,
          savedRoutes: 1,
          estimatedNeighborhoodCoverage: 42,
          savedDiscoveries: [],
        },
      });
    }

    if (url === '/api/routes/saved') {
      return mockJson({ savedRoutes: [] });
    }

    if (url === '/api/walks?city=montreal&status=completed') {
      return mockJson({ walks: [] });
    }

    if (url.startsWith('/api/geocode')) {
      return mockJson({
        places: [
          { id: 'place-mile-end', label: 'Mile End', coordinate: { lat: 45.5234, lng: -73.5996 } },
        ],
        provider: 'seed',
      });
    }

    if (url === '/api/routes/route-montreal-1') {
      return mockJson({ route: testRoute });
    }

    if (url === '/api/routes/generate') {
      routeRequests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return mockJson({
        requestId: 'request-1',
        topRoutes: [routeSummaryFor(testRoute)],
        remainingRoutes: [],
        fallback: null,
      });
    }

    if (url === '/api/routes/route-montreal-1/save') {
      return mockJson({
        saved: true,
        savedRoute: {
          id: 'saved-route-montreal-1',
          profileId: 'local',
          routeId: testRoute.id,
          route: testRoute,
          createdAt: '2026-05-27T12:00:00.000Z',
        },
      }, true, 201);
    }

    if (url === '/api/walks/route-montreal-1/start') {
      return mockJson({
        walk: {
          id: 'walk-1',
          profileId: 'local',
          routeId: walkRoute.id,
          route: walkRoute,
          status: 'active',
          startedAt: new Date(Date.now() - 120_000).toISOString(),
          updatedAt: new Date().toISOString(),
          elapsedSeconds: 0,
          estimatedSteps: 0,
          discoveredPoiIds: [],
        },
      }, true, 201);
    }

    if (url === '/api/walks/walk-1/pois/poi-cafe') {
      const body = JSON.parse(String(init?.body)) as { action: 'save' | 'skip' | 'discovered' };

      return mockJson({
        saved: true,
        poiAction: {
          id: 'poi-action-1',
          profileId: 'local',
          walkId: 'walk-1',
          routeId: testRoute.id,
          poiId: 'poi-cafe',
          action: body.action,
          poi: {
            poiId: 'poi-cafe',
            routeId: testRoute.id,
            name: 'Cafe Olimpico',
            category: 'cafes',
            coordinate: { lat: 45.524, lng: -73.598 },
          },
          createdAt: '2026-05-27T12:01:00.000Z',
        },
        walk: {
          id: 'walk-1',
          profileId: 'local',
          routeId: testRoute.id,
          route: testRoute,
          status: 'active',
          startedAt: new Date(Date.now() - 120_000).toISOString(),
          updatedAt: new Date().toISOString(),
          elapsedSeconds: 60,
          estimatedSteps: 400,
          discoveredPoiIds: body.action === 'discovered' ? ['poi-cafe'] : [],
        },
      }, true, 201);
    }

    if (url === '/api/walks/walk-1/pois/poi-park') {
      const body = JSON.parse(String(init?.body)) as { action: 'save' | 'skip' | 'discovered' };

      return mockJson({
        saved: true,
        poiAction: {
          id: 'poi-action-2',
          profileId: 'local',
          walkId: 'walk-1',
          routeId: testRoute.id,
          poiId: 'poi-park',
          action: body.action,
          poi: {
            poiId: 'poi-park',
            routeId: testRoute.id,
            name: 'Pocket Park',
            category: 'parks',
            coordinate: { lat: 45.5238, lng: -73.5988 },
          },
          createdAt: '2026-05-27T12:03:00.000Z',
        },
        walk: {
          id: 'walk-1',
          profileId: 'local',
          routeId: testRoute.id,
          route: testRoute,
          status: 'active',
          startedAt: new Date(Date.now() - 180_000).toISOString(),
          updatedAt: new Date().toISOString(),
          elapsedSeconds: 180,
          estimatedSteps: 600,
          discoveredPoiIds: body.action === 'discovered' ? ['poi-park'] : [],
        },
      }, true, 201);
    }

    if (url === '/api/walks/walk-1') {
      const body = JSON.parse(String(init?.body)) as { status: 'active' | 'paused'; elapsedSeconds: number; estimatedSteps: number };

      return mockJson({
        walk: {
          id: 'walk-1',
          profileId: 'local',
          routeId: testRoute.id,
          route: testRoute,
          status: body.status,
          startedAt: new Date(Date.now() - 300_000).toISOString(),
          updatedAt: new Date().toISOString(),
          elapsedSeconds: body.elapsedSeconds,
          estimatedSteps: body.estimatedSteps,
          discoveredPoiIds: [],
        },
      });
    }

    if (url === '/api/walks/walk-1/complete') {
      return mockJson({
        walk: {
          id: 'walk-1',
          profileId: 'local',
          routeId: testRoute.id,
          route: testRoute,
          status: 'completed',
          startedAt: new Date(Date.now() - 120_000).toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          elapsedSeconds: 120,
          estimatedSteps: 3200,
          discoveredPoiIds: ['poi-cafe'],
        },
        progress: {
          profileId: 'local',
          cityId: 'montreal',
          placesDiscovered: 19,
          loopsCompleted: 6,
          savedRoutes: 1,
          estimatedNeighborhoodCoverage: 46,
          savedDiscoveries: [],
        },
      });
    }

    if (url === '/api/routes/route-montreal-1/feedback') {
      return mockJson({ saved: true, feedback: { id: 'feedback-1', routeId: testRoute.id } }, true, 201);
    }

    throw new Error(`Unexpected fetch ${url}`);
  });
}

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a discovery-first home screen and keeps ops hidden by default', async () => {
    installDefaultFetch();

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Find a loop that fits today' })).toBeInTheDocument();
    expect(screen.getByText('Choose a goal')).toBeInTheDocument();
    expect(screen.getByText('Nearby loops')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    expect(screen.getByLabelText('Start near')).toHaveValue('Mile End');
    expect(screen.getByRole('button', { name: /Find loops for 30 min/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /After-work 30/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('Live setup incomplete')).not.toBeInTheDocument();
    expect(await screen.findByText('18')).toBeInTheDocument();
    expect(screen.queryByText(/murals|markets|quest|badge|level/i)).not.toBeInTheDocument();
  });

  it('generates goal-first routes using only supported interests', async () => {
    const user = userEvent.setup();
    const routeRequests: Array<Record<string, unknown>> = [];
    installDefaultFetch(routeRequests);

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));

    expect(await screen.findByRole('heading', { name: 'Nearby loops' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Coffee and green loop/ })).toBeInTheDocument();
    expect(screen.getByText('Best match')).toBeInTheDocument();
    expect(screen.getByText('2 discoveries')).toBeInTheDocument();
    expect(screen.queryByText('91/100')).not.toBeInTheDocument();
    expect(routeRequests[0]).toEqual(expect.objectContaining({
      cityId: 'montreal',
      stepGoal: 3200,
      timeGoalMinutes: 30,
      mood: 'calm',
      interests: ['parks', 'cafes'],
      routeType: 'loop',
    }));
  });

  it('lets a user save a route, start a walk, discover a POI, complete, and leave feedback', async () => {
    const user = userEvent.setup();
    const fetchSpy = installDefaultFetch();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));
    await user.click(await screen.findByRole('button', { name: /Coffee and green loop/ }));

    expect(await screen.findByRole('heading', { name: 'Coffee and green loop' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Save/ }));
    expect(await screen.findByText('Route saved.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Start/ }));
    expect(await screen.findByRole('heading', { name: 'Walk Companion' })).toBeInTheDocument();
    expect(screen.getByText('Mile End loop')).toBeInTheDocument();
    expect(screen.getByText('GPS local')).toBeInTheDocument();
    expect(screen.getByText('Head toward Cafe Olimpico')).toBeInTheDocument();
    expect(screen.getByText(/Continue toward the highlighted stop/)).toBeInTheDocument();
    expect(screen.getByText('On track for 30 min')).toBeInTheDocument();
    expect(screen.getByText(/Running long\? Shortcut saves/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Route progress/ })).toHaveAttribute('aria-valuenow');
    expect(screen.getByText('Shortcut')).toBeInTheDocument();
    expect(screen.getByText('Return')).toBeInTheDocument();
    expect(screen.getByText('Transit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shortcut save/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Worth it/ })).toBeInTheDocument();
    expect(screen.queryByText('Estimated route progress')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Active walk' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Cafe Olimpico').length).toBeGreaterThan(0);
    expect(screen.queryByText('Goal progress')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Worth it/ }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/walks/walk-1/pois/poi-cafe', expect.objectContaining({ method: 'POST' })));

    await user.click(screen.getByRole('button', { name: /Complete/ }));
    expect(await screen.findByRole('heading', { name: 'Walk complete' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Great route' }));
    await user.type(screen.getByLabelText('Note'), 'Good after-work option.');
    await user.click(screen.getByRole('button', { name: 'Save feedback' }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/routes/route-montreal-1/feedback', expect.objectContaining({ method: 'POST' })));
    expect(await screen.findByText('Feedback saved.')).toBeInTheDocument();
  });

  it('uses the active walk route for companion POIs, next move, and bailout summaries', async () => {
    const user = userEvent.setup();
    const walkOnlyRoute: ScoredRoute = {
      ...testRoute,
      label: 'Walk route from start response',
      distanceMeters: 3600,
      durationSeconds: 2400,
      estimatedSteps: 4800,
      pois: [
        {
          ...testRoute.pois[0],
          id: 'poi-walk-only',
          name: 'Walk-only mural',
        },
      ],
    };
    installDefaultFetch([], { walkRoute: walkOnlyRoute });

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));
    await user.click(await screen.findByRole('button', { name: /Coffee and green loop/ }));
    await user.click(await screen.findByRole('button', { name: /Start/ }));

    expect(await screen.findByText('Walk route from start response')).toBeInTheDocument();
    expect(screen.getByText('Head toward Walk-only mural')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Walk-only mural' })).toBeInTheDocument();
    expect(screen.getByText('save 12 min')).toBeInTheDocument();
    expect(screen.queryByText('Head toward Cafe Olimpico')).not.toBeInTheDocument();
    expect(screen.queryByText('save 9 min')).not.toBeInTheDocument();
  });

  it('shows non-destructive shortcut and bailout guidance during a walk', async () => {
    const user = userEvent.setup();
    const fetchSpy = installDefaultFetch();
    const expectNoBailoutSideEffects = () => {
      const calledUrls = fetchSpy.mock.calls.map(([input]) => String(input));

      expect(calledUrls).not.toContain('/api/walks/walk-1/complete');
      expect(calledUrls).not.toEqual(expect.arrayContaining([expect.stringContaining('/api/walks/walk-1/pois/')]));
      expect(screen.getByRole('heading', { name: 'Walk Companion' })).toBeInTheDocument();
    };

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Start planning' }));
    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));
    await user.click(await screen.findByRole('button', { name: /Coffee and green loop/ }));
    await user.click(await screen.findByRole('button', { name: /Start/ }));

    await user.click(screen.getByRole('button', { name: /Shortcut save/ }));
    expect(await screen.findByRole('status')).toHaveTextContent('Shortcut preview: follow the highlighted route back after the next stop.');
    expectNoBailoutSideEffects();

    await user.click(screen.getByRole('button', { name: /Return/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Return guidance: turn back toward the start point when the route feels familiar.');
    expectNoBailoutSideEffects();

    await user.click(screen.getByRole('button', { name: /Transit/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Transit nearby: bus 80 is the closest low-effort exit.');
    expectNoBailoutSideEffects();

    await user.click(screen.getByRole('button', { name: /Complete/ }));
    expect(await screen.findByRole('heading', { name: 'Walk complete' })).toBeInTheDocument();
    expect(screen.queryByText('Transit nearby: bus 80 is the closest low-effort exit.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Plan another walk' }));
    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));
    await user.click(await screen.findByRole('button', { name: /Coffee and green loop/ }));
    await user.click(await screen.findByRole('button', { name: /Start/ }));

    expect(await screen.findByRole('heading', { name: 'Walk Companion' })).toBeInTheDocument();
    expect(screen.queryByText('Transit nearby: bus 80 is the closest low-effort exit.')).not.toBeInTheDocument();
  });

  it('pauses active elapsed time and resumes from the stored elapsed anchor', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-05-27T12:00:00.000Z'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchSpy = installDefaultFetch();

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Start planning' }));
    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));
    await user.click(await screen.findByRole('button', { name: /Coffee and green loop/ }));
    await user.click(await screen.findByRole('button', { name: /Start/ }));

    vi.setSystemTime(new Date('2026-05-27T12:03:00.000Z'));
    await user.click(screen.getByRole('button', { name: /^Pause$/ }));

    const pauseCall = fetchSpy.mock.calls.find(([url, init]) => url === '/api/walks/walk-1' && String(init?.body).includes('"paused"'));
    expect(JSON.parse(String(pauseCall?.[1]?.body))).toEqual({
      status: 'paused',
      elapsedSeconds: 300,
      estimatedSteps: 533,
    });

    vi.setSystemTime(new Date('2026-05-27T12:20:00.000Z'));
    await user.click(await screen.findByRole('button', { name: /^Resume$/ }));

    const resumeCall = fetchSpy.mock.calls.find(([url, init]) => url === '/api/walks/walk-1' && String(init?.body).includes('"active"'));
    expect(JSON.parse(String(resumeCall?.[1]?.body))).toEqual({
      status: 'active',
      elapsedSeconds: 300,
      estimatedSteps: 533,
    });

    vi.useRealTimers();
  });

  it('renders a no-route recovery state', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url === '/api/client-config') return mockJson({ map: { mapTilerKey: '' }, ops: { enabled: false } });
      if (url === '/api/progress?city=montreal') return mockJson({ progress: null });
      if (url === '/api/routes/saved') return mockJson({ savedRoutes: [] });
      if (url === '/api/walks?city=montreal&status=completed') return mockJson({ walks: [] });
      if (url === '/api/routes/generate') return mockJson({
        error: 'No route candidates found.',
        fallback: 'Try a different Montreal starting point.',
      }, false, 422);

      throw new Error(`Unexpected fetch ${url}`);
    });

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));

    expect(await screen.findByRole('heading', { name: 'No matching loops yet' })).toBeInTheDocument();
    expect(screen.getByText(/Try a shorter goal/)).toBeInTheDocument();
  });

  it('shows a service outage instead of raw parse errors for empty API failures', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url === '/api/client-config') return mockEmpty(false, 500);
      if (url === '/api/progress?city=montreal') return mockJson({ progress: null });
      if (url === '/api/routes/saved') return mockJson({ savedRoutes: [] });
      if (url === '/api/walks?city=montreal&status=completed') return mockJson({ walks: [] });
      if (url === '/api/routes/generate') return mockText('', false, 500);

      throw new Error(`Unexpected fetch ${url}`);
    });

    render(<App />);

    expect(await screen.findByText(/Walking service is unavailable/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));

    expect(await screen.findByText(/Route service is unavailable/)).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected end of JSON input|Failed to execute 'json'/)).not.toBeInTheDocument();
    expect(screen.queryByText('Building discovery loops...')).not.toBeInTheDocument();
  });

  it('shows saved discoveries and progress without game-like labels', async () => {
    const user = userEvent.setup();
    installDefaultFetch();

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Saved' }));

    const savedRegion = await screen.findByRole('heading', { name: 'Saved discoveries' });
    expect(savedRegion).toBeInTheDocument();
    expect(screen.getByText('places discovered')).toBeInTheDocument();
    expect(screen.getByText('loops completed')).toBeInTheDocument();
    expect(screen.queryByText(/badge|quest|level/i)).not.toBeInTheDocument();
  });

  it('opens history and settings from bottom navigation', async () => {
    const user = userEvent.setup();
    installDefaultFetch();

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'History' }));
    expect(await screen.findByRole('heading', { name: 'Walk history' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'History' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Weekly step goal')).toHaveValue(30000);
  });

  it('persists onboarding and local-first settings', async () => {
    const user = userEvent.setup();
    installDefaultFetch();

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Walk privately' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start planning' }));
    expect(screen.queryByRole('heading', { name: 'Walk privately' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.clear(screen.getByLabelText('Weekly step goal'));
    await user.type(screen.getByLabelText('Weekly step goal'), '42000');

    expect(JSON.parse(window.localStorage.getItem('walking-app:settings:v1') ?? '{}')).toEqual(
      expect.objectContaining({
        onboardingComplete: true,
        weeklyStepGoal: 42000,
        distanceUnit: 'km',
      }),
    );
  });

  it('tracks live walking locally without sending GPS coordinates to completion', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-05-27T12:00:00.000Z'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const watchPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 45.5235,
          longitude: -73.5995,
          accuracy: 12,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
      success({
        coords: {
          latitude: 45.524,
          longitude: -73.598,
          accuracy: 12,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now() + 10_000,
      } as GeolocationPosition);
      return 7;
    });
    const clearWatch = vi.fn();
    Object.defineProperty(window.navigator, 'geolocation', {
      value: { watchPosition, clearWatch },
      configurable: true,
    });
    const fetchSpy = installDefaultFetch();

    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Start planning' }));
    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));
    await user.click(await screen.findByRole('button', { name: /Coffee and green loop/ }));
    await user.click(await screen.findByRole('button', { name: /Start/ }));
    await user.click(await screen.findByRole('button', { name: /Enable live tracking/ }));

    expect(await screen.findByText(/Live tracking on/)).toBeInTheDocument();
    expect(screen.getByText('GPS local')).toBeInTheDocument();
    expect(screen.getByText(/tracked locally/)).toBeInTheDocument();
    vi.setSystemTime(new Date('2026-05-27T12:35:00.000Z'));
    await user.click(screen.getByRole('button', { name: /Complete/ }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/walks/walk-1/complete', expect.objectContaining({ method: 'POST' })));
    const completeCall = fetchSpy.mock.calls.find(([url]) => url === '/api/walks/walk-1/complete');
    const completeBody = JSON.parse(String(completeCall?.[1]?.body));
    expect(completeBody).toEqual({
      elapsedSeconds: expect.any(Number),
      estimatedSteps: expect.any(Number),
      discoveredPoiIds: expect.any(Array),
    });
    expect(completeBody.elapsedSeconds).toBeGreaterThan(testRoute.durationSeconds);
    expect(completeBody.estimatedSteps).toBe(173);
    expect(JSON.stringify(completeBody)).not.toMatch(/latitude|longitude|lat|lng|coordinate|coordinates/i);
    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  it('loads a shared route link into route detail', async () => {
    installDefaultFetch();
    window.history.pushState({}, '', '/?route=route-montreal-1');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Coffee and green loop' })).toBeInTheDocument();
    expect(screen.getByText(/For your 30 min walk/)).toBeInTheDocument();
  });

  it('advances to the next POI after skipping the active discovery', async () => {
    const user = userEvent.setup();
    installDefaultFetch();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));
    await user.click(await screen.findByRole('button', { name: /Coffee and green loop/ }));
    await user.click(await screen.findByRole('button', { name: /Start/ }));
    await user.click(await screen.findByRole('button', { name: /Skip/ }));

    expect(await screen.findByRole('heading', { name: 'Pocket Park' })).toBeInTheDocument();
  });

  it('shows return-to-start guidance after the last discovery is skipped', async () => {
    const user = userEvent.setup();
    installDefaultFetch();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /Find loops for 30 min/ }));
    await user.click(await screen.findByRole('button', { name: /Coffee and green loop/ }));
    await user.click(await screen.findByRole('button', { name: /Start/ }));
    await user.click(await screen.findByRole('button', { name: /Skip/ }));
    await user.click(await screen.findByRole('button', { name: /Skip/ }));

    expect(await screen.findByText('Return to your start point')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cafe Olimpico' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pocket Park' })).not.toBeInTheDocument();
  });
});
