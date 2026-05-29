import { render, screen } from '@testing-library/react-native';
import { HistoryScreen } from './HistoryScreen';
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

const savedRoute = {
  id: 'route-mile-end',
  label: 'Mile End cafe loop',
  fitCategory: 'best-fit',
  fitReason: 'Balanced route.',
  cityId: 'montreal',
  geometry: [],
  pois: [],
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

function renderHistory(overrides: Record<string, unknown> = {}) {
  mockUseWalkApp.mockReturnValue({
    progress: { loopsCompleted: 1, placesDiscovered: 2 },
    completedWalks: [{
      id: 'walk-1',
      routeId: savedRoute.id,
      routeLabel: savedRoute.label,
      status: 'completed',
      startedAt: '2026-05-25T12:00:00.000Z',
      completedAt: '2026-05-25T12:46:00.000Z',
      elapsedSeconds: 2760,
      estimatedSteps: 4900,
      discoveredCount: 2,
    }],
    savedRoutes: [{
      id: 'saved-1',
      profileId: 'local',
      routeId: savedRoute.id,
      route: savedRoute,
      createdAt: '2026-05-24T12:00:00.000Z',
    }],
    settings: defaultSettings,
    loadRuntime: jest.fn(),
    ...overrides,
  });

  return render(<HistoryScreen />);
}

describe('HistoryScreen', () => {
  it('shows completed walk identity with actual and planned metrics', () => {
    renderHistory();

    expect(screen.getByText('Completed May 25, 2026')).toBeTruthy();
    expect(screen.getByText('Mile End cafe loop')).toBeTruthy();
    expect(screen.getByText('46 min elapsed')).toBeTruthy();
    expect(screen.getByText('4,900 actual steps')).toBeTruthy();
    expect(screen.getByText('5,600 planned steps')).toBeTruthy();
    expect(screen.getByText('2 discoveries')).toBeTruthy();
  });

  it('shows useful local-first empty history actions and zero-progress placeholders', () => {
    renderHistory({
      progress: null,
      completedWalks: [],
      savedRoutes: [],
    });

    expect(screen.getByText('Your journey starts here')).toBeTruthy();
    expect(screen.getByText('Find a loop to start')).toBeTruthy();
    expect(screen.getByText('View saved routes')).toBeTruthy();
    expect(screen.getByText('Walk history stays local-first on this device until you choose to export it.')).toBeTruthy();
    expect(screen.getByText('0 loops completed')).toBeTruthy();
    expect(screen.getByText('0 actual steps')).toBeTruthy();
    expect(screen.getByText('0 discoveries')).toBeTruthy();
  });
});
