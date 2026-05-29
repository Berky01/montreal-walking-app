import { fireEvent, render, screen } from '@testing-library/react-native';
import { ExploreScreen } from './ExploreScreen';
import { useWalkApp } from '../state/WalkAppContext';
import { defaultSettings } from '../platform/settingsStorage';
import { goalPresets } from '../state/goals';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../state/WalkAppContext', () => ({
  useWalkApp: jest.fn(),
}));

const mockUseWalkApp = useWalkApp as jest.Mock;
const mockPush = jest.fn();

function renderExplore(overrides: Record<string, unknown> = {}) {
  mockUseWalkApp.mockReturnValue({
    apiBaseUrlError: '',
    apiHealth: 'ready',
    error: '',
    status: '',
    settings: { ...defaultSettings, onboardingComplete: true },
    updateSettings: jest.fn(),
    isBusy: false,
    selectedGoal: goalPresets[0],
    selectedGoalId: goalPresets[0].id,
    setSelectedGoalId: jest.fn(),
    startInput: 'Mile End',
    setStartInput: jest.fn(),
    startCandidates: [],
    setStartPlaceFromCandidate: jest.fn(),
    selectedInterests: ['parks', 'cafes'],
    toggleInterest: jest.fn(),
    lookupStart: jest.fn(),
    generateRoutes: jest.fn().mockResolvedValue(true),
    progress: {
      placesDiscovered: 3,
      estimatedNeighborhoodCoverage: 30,
    },
    ...overrides,
  });

  return render(<ExploreScreen />);
}

describe('ExploreScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the native planning surface and fixed CTA copy', () => {
    renderExplore();

    expect(screen.getByText('Find a loop that fits today')).toBeTruthy();
    expect(screen.getByText('Choose a goal')).toBeTruthy();
    expect(screen.getByText('Nearby loops')).toBeTruthy();
    expect(screen.getByText('Find loops for 30 min')).toBeTruthy();
  });

  it('shows the local-first privacy onboarding before dismissal', () => {
    renderExplore({
      settings: { ...defaultSettings, onboardingComplete: false },
    });

    expect(screen.getByText('Walk privately')).toBeTruthy();
    expect(screen.getByText('Location tracking only runs during an active walk. Raw GPS trails stay off the server.')).toBeTruthy();
  });

  it('does not navigate to compare when route generation fails', async () => {
    renderExplore({
      generateRoutes: jest.fn().mockResolvedValue(false),
    });

    fireEvent.press(screen.getByText('Find loops for 30 min'));

    await expect(screen.findByText('Find loops for 30 min')).resolves.toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
