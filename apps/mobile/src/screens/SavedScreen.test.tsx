import { render, screen } from '@testing-library/react-native';
import { SavedScreen } from './SavedScreen';
import { useWalkApp } from '../state/WalkAppContext';
import { defaultSettings } from '../platform/settingsStorage';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../state/WalkAppContext', () => ({
  useWalkApp: jest.fn(),
}));

const mockUseWalkApp = useWalkApp as jest.Mock;

const route = {
  id: 'route-mile-end',
  label: 'Mile End cafe loop',
  fitCategory: 'best-fit',
  fitReason: 'Balanced route.',
  cityId: 'montreal',
  geometry: [
    { lat: 45.52, lng: -73.59 },
    { lat: 45.53, lng: -73.58 },
  ],
  pois: [
    {
      id: 'poi-cafe',
      cityId: 'montreal',
      name: 'Cafe Olimpico',
      category: 'cafes',
      coordinate: { lat: 45.52, lng: -73.59 },
      source: 'curated',
      moods: ['calm'],
      interestTags: ['cafes'],
      computedRouteValue: 10,
      metadata: { neighborhood: 'Mile End' },
      lastImportedAt: '2026-05-01T00:00:00.000Z',
    },
    {
      id: 'poi-park',
      cityId: 'montreal',
      name: 'Pocket Park',
      category: 'parks',
      coordinate: { lat: 45.53, lng: -73.58 },
      source: 'curated',
      moods: ['calm'],
      interestTags: ['parks'],
      computedRouteValue: 8,
      lastImportedAt: '2026-05-01T00:00:00.000Z',
    },
  ],
  distanceMeters: 4200,
  durationSeconds: 3120,
  estimatedSteps: 5600,
  provider: 'test',
  debug: { targetMeters: 4200, waypointStrategy: 'test' },
  score: {
    total: 90,
    breakdown: {
      stepFit: 90,
      timeFit: 90,
      moodMatch: 90,
      interestMatch: 90,
      poiSpacing: 90,
      detourPenalty: 0,
      parkWaterfrontBonus: 0,
      excessTurnPenalty: 0,
    },
  },
  explanation: 'A good route.',
  scoreSummary: [],
  exportLinks: { googleMaps: 'https://example.test', gpx: '<gpx />' },
};

function renderSaved() {
  mockUseWalkApp.mockReturnValue({
    progress: { placesDiscovered: 4, savedRoutes: 1 },
    savedRoutes: [{
      id: 'saved-1',
      profileId: 'local',
      routeId: route.id,
      route,
      createdAt: '2026-05-26T14:00:00.000Z',
    }],
    poiActions: [
      {
        id: 'action-save',
        profileId: 'local',
        walkId: 'walk-1',
        routeId: route.id,
        poiId: 'poi-cafe',
        action: 'save',
        poi: { poiId: 'poi-cafe', routeId: route.id, name: 'Cafe Olimpico', category: 'cafes', coordinate: route.pois[0].coordinate },
        createdAt: '2026-05-26T15:00:00.000Z',
      },
      {
        id: 'action-skip',
        profileId: 'local',
        walkId: 'walk-1',
        routeId: route.id,
        poiId: 'poi-park',
        action: 'skip',
        poi: { poiId: 'poi-park', routeId: route.id, name: 'Pocket Park', category: 'parks', coordinate: route.pois[1].coordinate },
        createdAt: '2026-05-26T15:05:00.000Z',
      },
      {
        id: 'action-discovered',
        profileId: 'local',
        walkId: 'walk-1',
        routeId: route.id,
        poiId: 'poi-cafe',
        action: 'discovered',
        poi: { poiId: 'poi-cafe', routeId: route.id, name: 'Cafe Olimpico', category: 'cafes', coordinate: route.pois[0].coordinate },
        createdAt: '2026-05-26T15:10:00.000Z',
      },
    ],
    settings: defaultSettings,
    openRouteDetail: jest.fn().mockResolvedValue(true),
    loadRuntime: jest.fn(),
  });

  return render(<SavedScreen />);
}

describe('SavedScreen', () => {
  it('separates saved routes from recent discovery actions with readable identity', () => {
    renderSaved();

    expect(screen.getByText('Saved routes')).toBeTruthy();
    expect(screen.getByText('Recent discovery actions')).toBeTruthy();
    expect(screen.getByText('Saved May 26, 2026')).toBeTruthy();
    expect(screen.getByText('Mile End cafe loop')).toBeTruthy();
    expect(screen.getByText('Mile End start')).toBeTruthy();
    expect(screen.getByText('4.2 km')).toBeTruthy();
    expect(screen.getByText('52 min')).toBeTruthy();
    expect(screen.getByText('5,600 steps')).toBeTruthy();
    expect(screen.getByText('2 discoveries')).toBeTruthy();
    expect(screen.getByText('Saved Cafe Olimpico')).toBeTruthy();
    expect(screen.getByText('Skipped Pocket Park')).toBeTruthy();
    expect(screen.getByText('Marked Cafe Olimpico as worth it')).toBeTruthy();
  });
});
