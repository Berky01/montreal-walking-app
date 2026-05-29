import { render, screen } from '@testing-library/react-native';
import { CompareScreen } from './CompareScreen';
import { useWalkApp } from '../state/WalkAppContext';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('../state/WalkAppContext', () => ({
  useWalkApp: jest.fn(),
}));

const mockUseWalkApp = useWalkApp as jest.Mock;

const baseRoute = {
  id: 'route-1',
  label: 'Best fit',
  explanation: 'A good route.',
  estimatedSteps: 8000,
  durationSeconds: 5400,
  distanceMeters: 6000,
  poiCount: 4,
  fitReason: 'Closest to your step goal.',
};

describe('CompareScreen', () => {
  it('uses the nearby loops title and preserves route fit labels', () => {
    mockUseWalkApp.mockReturnValue({
      error: '',
      openRouteDetail: jest.fn().mockResolvedValue(true),
      routeSummaries: [
        { ...baseRoute, id: 'best', label: 'Best fit', fitCategory: 'best-fit' },
        { ...baseRoute, id: 'shorter', label: 'Shorter loop', fitCategory: 'shorter' },
        { ...baseRoute, id: 'scenic', label: 'Scenic stretch', fitCategory: 'scenic' },
        { ...baseRoute, id: 'simple', label: 'Simple route', fitCategory: 'fewer-stops' },
      ],
    });

    render(<CompareScreen />);

    expect(screen.getByText('Nearby loops')).toBeTruthy();
    expect(screen.getByText('Best match')).toBeTruthy();
    expect(screen.getByText('Shorter')).toBeTruthy();
    expect(screen.getByText('Scenic')).toBeTruthy();
    expect(screen.getByText('Simpler')).toBeTruthy();
  });
});
