import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { ActiveWalkScreen } from './ActiveWalkScreen';
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

jest.mock('../components/RouteMapNative', () => ({
  RouteMapNative: () => null,
}));

const mockUseWalkApp = useWalkApp as jest.Mock;

const route = {
  id: 'route-1',
  label: 'Mile End loop',
  fitCategory: 'best-fit',
  fitReason: 'Closest to your step goal.',
  cityId: 'montreal',
  geometry: [
    { lat: 45.52, lng: -73.59 },
    { lat: 45.53, lng: -73.58 },
  ],
  pois: [
    { id: 'poi-1', name: 'Cafe Olimpico', category: 'cafe', coordinate: { lat: 45.52, lng: -73.59 } },
  ],
  distanceMeters: 3000,
  durationSeconds: 2400,
  estimatedSteps: 4000,
  provider: 'test',
  debug: { targetMeters: 3000, waypointStrategy: 'test' },
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
  status: 'active',
  startedAt: '2026-05-27T12:00:00.000Z',
  updatedAt: '2026-05-27T12:01:00.000Z',
  completedAt: null,
  elapsedSeconds: 60,
  estimatedSteps: 500,
  discoveredPoiIds: [],
};

function renderActive(overrides: Record<string, unknown> = {}) {
  const completeWalk = jest.fn().mockResolvedValue(true);
  const actOnPOI = jest.fn().mockResolvedValue(undefined);
  const confirmLowProgressComplete = jest.fn();

  mockUseWalkApp.mockReturnValue({
    error: '',
    walk,
    liveWalk: { status: 'idle', distanceMeters: 0, estimatedSteps: 0, error: '' },
    activeProgress: {
      elapsedSeconds: 60,
      estimatedSteps: 500,
      distanceMeters: 375,
      progressPercent: 13,
      source: 'time',
    },
    nextMove: { title: 'Head north', cue: 'Walk toward the next cafe.', distanceLabel: '200 m', etaLabel: '3 min' },
    timeGuardrail: null,
    bailoutOptions: [
      { id: 'shortcut', label: 'Shortcut', detail: 'Cut back after the next stop.' },
      { id: 'return', label: 'Return', detail: 'Head back toward the start.' },
      { id: 'transit', label: 'Transit', detail: 'Use the closest bus.' },
    ],
    activeWalkGuidance: '',
    chooseBailout: jest.fn(),
    nextPOIId: 'poi-1',
    discoveredPoiIds: [],
    needsLowProgressConfirmation: true,
    confirmLowProgressComplete,
    updateWalkStatus: jest.fn().mockResolvedValue(undefined),
    completeWalk,
    actOnPOI,
    stopLiveTracking: jest.fn(),
    enableLiveTracking: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  render(<ActiveWalkScreen />);

  return { completeWalk, actOnPOI, confirmLowProgressComplete };
}

describe('ActiveWalkScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('changes bailout guidance from buttons without completing the walk or changing POIs', () => {
    const completeWalk = jest.fn().mockResolvedValue(true);
    const actOnPOI = jest.fn().mockResolvedValue(undefined);

    function ActiveHarness() {
      const [activeWalkGuidance, setActiveWalkGuidance] = useState('');

      mockUseWalkApp.mockReturnValue({
        error: '',
        walk,
        liveWalk: { status: 'idle', distanceMeters: 0, estimatedSteps: 0, error: '' },
        activeProgress: {
          elapsedSeconds: 60,
          estimatedSteps: 500,
          distanceMeters: 375,
          progressPercent: 13,
          source: 'time',
        },
        nextMove: { title: 'Head north', cue: 'Walk toward the next cafe.', distanceLabel: '200 m', etaLabel: '3 min' },
        timeGuardrail: null,
        bailoutOptions: [
          { id: 'shortcut', label: 'Shortcut', detail: 'Cut back after the next stop.' },
          { id: 'return', label: 'Return', detail: 'Head back toward the start.' },
          { id: 'transit', label: 'Transit', detail: 'Use the closest bus.' },
        ],
        activeWalkGuidance,
        chooseBailout: (optionId: string) => {
          if (optionId === 'shortcut') setActiveWalkGuidance('Shortcut preview: follow the highlighted route back after the next stop.');
          if (optionId === 'return') setActiveWalkGuidance('Return guidance: head back toward the start point when the route feels familiar.');
          if (optionId === 'transit') setActiveWalkGuidance('Transit handoff: bus 80 is the closest low-effort exit.');
        },
        nextPOIId: 'poi-1',
        discoveredPoiIds: [],
        needsLowProgressConfirmation: true,
        confirmLowProgressComplete: jest.fn(),
        updateWalkStatus: jest.fn().mockResolvedValue(undefined),
        completeWalk,
        actOnPOI,
        stopLiveTracking: jest.fn(),
        enableLiveTracking: jest.fn().mockResolvedValue(undefined),
      });

      return <ActiveWalkScreen />;
    }

    render(<ActiveHarness />);

    fireEvent.press(screen.getByText('Shortcut'));
    expect(screen.getByText('Shortcut preview: follow the highlighted route back after the next stop.')).toBeTruthy();

    fireEvent.press(screen.getByText('Return'));
    expect(screen.getByText('Return guidance: head back toward the start point when the route feels familiar.')).toBeTruthy();

    fireEvent.press(screen.getByText('Transit'));
    expect(screen.getByText('Transit handoff: bus 80 is the closest low-effort exit.')).toBeTruthy();
    expect(screen.getByText('Cafe Olimpico')).toBeTruthy();
    expect(completeWalk).not.toHaveBeenCalled();
    expect(actOnPOI).not.toHaveBeenCalled();
  });

  it('asks for low-progress confirmation before completing a short walk', async () => {
    const { completeWalk, confirmLowProgressComplete } = renderActive();

    fireEvent.press(screen.getByText('Complete'));

    expect(screen.getByText('You have less than 20% progress and no completed discoveries. Complete this walk anyway?')).toBeTruthy();
    expect(completeWalk).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Complete anyway'));

    expect(confirmLowProgressComplete).toHaveBeenCalledTimes(1);
    expect(completeWalk).toHaveBeenCalledTimes(1);
    await expect(screen.findByText('Complete anyway')).resolves.toBeTruthy();
    expect(mockReplace).toHaveBeenCalledWith('/complete');
  });
});
