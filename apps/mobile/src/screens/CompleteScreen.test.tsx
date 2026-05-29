import { fireEvent, render, screen } from '@testing-library/react-native';
import { CompleteScreen } from './CompleteScreen';
import { useWalkApp } from '../state/WalkAppContext';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock('../state/WalkAppContext', () => ({
  useWalkApp: jest.fn(),
}));

const mockUseWalkApp = useWalkApp as jest.Mock;

const route = {
  id: 'route-1',
  label: 'Mile End loop',
  fitCategory: 'best-fit',
  fitReason: 'Closest to your step goal.',
  cityId: 'montreal',
  geometry: [],
  pois: [],
  distanceMeters: 2400,
  durationSeconds: 1800,
  estimatedSteps: 3200,
  provider: 'test',
  debug: { targetMeters: 2400, waypointStrategy: 'test' },
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

const walk = {
  id: 'walk-1',
  routeId: route.id,
  route,
  status: 'completed',
  startedAt: '2026-05-27T12:00:00.000Z',
  updatedAt: '2026-05-27T12:20:00.000Z',
  completedAt: '2026-05-27T12:20:00.000Z',
  elapsedSeconds: 1200,
  estimatedSteps: 500,
  discoveredPoiIds: ['poi-1'],
};

function renderComplete(overrides: Record<string, unknown> = {}) {
  mockUseWalkApp.mockReturnValue({
    status: '',
    walk,
    progress: {
      placesDiscovered: 12,
      estimatedNeighborhoodCoverage: 30,
    },
    feedbackLabels: [],
    feedbackNote: '',
    setFeedbackNote: jest.fn(),
    toggleFeedbackLabel: jest.fn(),
    submitFeedback: jest.fn().mockResolvedValue(true),
    ...overrides,
  });

  return render(<CompleteScreen />);
}

describe('CompleteScreen', () => {
  it('shows actual walked steps before planned and lifetime metrics', () => {
    renderComplete();

    expect(screen.getByText('500')).toBeTruthy();
    expect(screen.getByText('Actual walked steps')).toBeTruthy();
    expect(screen.getByText('3,200')).toBeTruthy();
    expect(screen.getByText('Planned route steps')).toBeTruthy();
    expect(screen.getByText('2.4 km planned distance')).toBeTruthy();
    expect(screen.getByText('Lifetime places discovered')).toBeTruthy();
  });

  it('warns when a completed walk is below twenty percent of planned steps', () => {
    renderComplete();

    expect(screen.getByText('This walk was shorter than planned, so completion metrics may look low.')).toBeTruthy();
  });

  it('explains why feedback cannot be saved until a chip is selected', () => {
    const submitFeedback = jest.fn();
    renderComplete({ submitFeedback });

    expect(screen.getByText('Select at least one route note to save feedback.')).toBeTruthy();
    fireEvent.press(screen.getByText('Save feedback'));

    expect(submitFeedback).not.toHaveBeenCalled();
  });

  it('shows the saved feedback status from app state', () => {
    renderComplete({ status: 'Feedback saved.' });

    expect(screen.getByText('Feedback saved.')).toBeTruthy();
  });
});
