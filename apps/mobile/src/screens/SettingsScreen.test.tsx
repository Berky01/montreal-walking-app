import { fireEvent, render, screen } from '@testing-library/react-native';
import { SettingsScreen } from './SettingsScreen';
import { useWalkApp } from '../state/WalkAppContext';
import { defaultSettings } from '../platform/settingsStorage';

jest.mock('../state/WalkAppContext', () => ({
  useWalkApp: jest.fn(),
}));

const mockUseWalkApp = useWalkApp as jest.Mock;

function renderSettings(overrides: Record<string, unknown> = {}) {
  mockUseWalkApp.mockReturnValue({
    status: '',
    error: '',
    apiHealth: 'ready',
    savedRoutes: [],
    completedWalks: [],
    poiActions: [],
    settings: defaultSettings,
    updateSettings: jest.fn(),
    exportDataLedger: jest.fn(),
    deleteLocalData: jest.fn(),
    ...overrides,
  });

  return render(<SettingsScreen />);
}

describe('SettingsScreen', () => {
  it('renders local-first mobile settings', () => {
    renderSettings();

    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Weekly step goal')).toBeTruthy();
    expect(screen.getByDisplayValue('30,000')).toBeTruthy();
    expect(screen.getByText('Use kilometers')).toBeTruthy();
    expect(screen.getByText('Privacy')).toBeTruthy();
  });

  it('keeps reminder time disabled when reminders are off', () => {
    renderSettings({
      settings: {
        ...defaultSettings,
        remindersEnabled: false,
        reminderTime: '07:30',
      },
    });

    expect(screen.getByDisplayValue('07:30').props.editable).toBe(false);
  });

  it('shows privacy ledger, permission, health, and data actions', () => {
    const exportDataLedger = jest.fn();
    const deleteLocalData = jest.fn();
    renderSettings({
      exportDataLedger,
      deleteLocalData,
      savedRoutes: [{ routeId: 'route-1' }],
      completedWalks: [{ id: 'walk-1' }],
      status: 'Local walk data cleared on this device.',
    });

    expect(screen.getByText('Privacy data ledger')).toBeTruthy();
    expect(screen.getByText('1 saved route - 1 completed walk - local-first privacy')).toBeTruthy();
    expect(screen.getByText('Location permission')).toBeTruthy();
    expect(screen.getByText('App health')).toBeTruthy();
    expect(screen.getByText('Local walk data cleared on this device.')).toBeTruthy();

    fireEvent.press(screen.getByText('Export data'));
    fireEvent.press(screen.getByText('Delete local data'));

    expect(exportDataLedger).toHaveBeenCalledTimes(1);
    expect(deleteLocalData).toHaveBeenCalledTimes(1);
  });
});
