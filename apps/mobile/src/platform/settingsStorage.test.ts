import { createSettingsStorage, defaultSettings } from './settingsStorage';

describe('settings storage adapter', () => {
  it('returns defaults when storage is empty', async () => {
    const storage = createSettingsStorage({
      getItem: jest.fn(async () => null),
      setItem: jest.fn(),
    });

    await expect(storage.load()).resolves.toEqual(defaultSettings);
  });

  it('normalizes invalid persisted values', async () => {
    const storage = createSettingsStorage({
      getItem: jest.fn(async () => JSON.stringify({
        weeklyStepGoal: 0,
        distanceUnit: 'yards',
        remindersEnabled: true,
      })),
      setItem: jest.fn(),
    });

    await expect(storage.load()).resolves.toMatchObject({
      weeklyStepGoal: defaultSettings.weeklyStepGoal,
      distanceUnit: 'km',
      remindersEnabled: true,
    });
  });
});
