import { fireEvent, render, screen } from '@testing-library/react-native';
import { DetailScreen } from './DetailScreen';
import { useWalkApp } from '../state/WalkAppContext';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('../state/WalkAppContext', () => ({
  useWalkApp: jest.fn(),
}));

jest.mock('../platform/shareRoute', () => ({
  openExternalUrl: jest.fn(),
  shareGpx: jest.fn(),
}));

const mockUseWalkApp = useWalkApp as jest.Mock;

const route = {
  id: 'route-1',
  label: 'Best fit',
  fitCategory: 'best-fit',
  fitReason: 'Closest to your step goal.',
  cityId: 'montreal',
  geometry: [
    { lat: 45.52, lng: -73.59 },
    { lat: 45.53, lng: -73.58 },
  ],
  pois: [],
  distanceMeters: 6000,
  durationSeconds: 5400,
  estimatedSteps: 8000,
  provider: 'test',
  debug: { targetMeters: 6000, waypointStrategy: 'test' },
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

function renderDetail(overrides: Record<string, unknown> = {}) {
  mockUseWalkApp.mockReturnValue({
    error: '',
    status: '',
    selectedRoute: route,
    selectedGoal: { label: '10k steps' },
    nextPOIId: null,
    discoveredPoiIds: [],
    savedRouteIds: [],
    savingRouteIds: [],
    saveRoute: jest.fn().mockResolvedValue(true),
    startWalk: jest.fn().mockResolvedValue(true),
    reportError: jest.fn(),
    ...overrides,
  });

  return render(<DetailScreen />);
}

describe('DetailScreen', () => {
  it('shows a saved state instead of a dead save button', () => {
    renderDetail({ savedRouteIds: [route.id] });

    expect(screen.getByText('Saved')).toBeTruthy();
  });

  it('disables duplicate save taps while saving', () => {
    const saveRoute = jest.fn().mockResolvedValue(true);
    renderDetail({ saveRoute, savingRouteIds: [route.id] });

    fireEvent.press(screen.getByText('Saving'));

    expect(saveRoute).not.toHaveBeenCalled();
  });

  it('keeps export actions under share and export', () => {
    renderDetail();

    expect(screen.getByText('Start')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
    expect(screen.getByText('Share and export')).toBeTruthy();
    expect(screen.getByText('Maps')).toBeTruthy();
    expect(screen.getByText('GPX')).toBeTruthy();
  });

  it('shows route trust copy for confidence, map fallback, and opening hours', () => {
    renderDetail();

    expect(screen.getByText('Route trust')).toBeTruthy();
    expect(screen.getByText('Confidence 90%')).toBeTruthy();
    expect(screen.getByText('Confidence 90% based on step fit, stop spacing, and route shape.')).toBeTruthy();
    expect(screen.getByText('If map tiles are unavailable, the stop list and export links still work.')).toBeTruthy();
    expect(screen.getByText('Opening hours can change; check each stop before relying on it.')).toBeTruthy();
  });
});
