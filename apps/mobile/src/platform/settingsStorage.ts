import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalUserSettings {
  onboardingComplete: boolean;
  weeklyStepGoal: number;
  remindersEnabled: boolean;
  reminderTime: string;
  distanceUnit: 'km' | 'mi';
  reducedMotion: boolean;
  privacyMode: 'local-first';
}

export const settingsStorageKey = 'walking-app:settings:v1';

export const defaultSettings: LocalUserSettings = {
  onboardingComplete: false,
  weeklyStepGoal: 30000,
  remindersEnabled: false,
  reminderTime: '08:00',
  distanceUnit: 'km',
  reducedMotion: false,
  privacyMode: 'local-first',
};

interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export function normalizeSettings(parsed: Partial<LocalUserSettings>): LocalUserSettings {
  return {
    ...defaultSettings,
    ...parsed,
    weeklyStepGoal: Number.isFinite(parsed.weeklyStepGoal) && parsed.weeklyStepGoal! >= 1000
      ? Math.round(parsed.weeklyStepGoal!)
      : defaultSettings.weeklyStepGoal,
    distanceUnit: parsed.distanceUnit === 'mi' ? 'mi' : 'km',
    privacyMode: 'local-first',
  };
}

export function createSettingsStorage(storage: KeyValueStorage = AsyncStorage) {
  return {
    async load() {
      try {
        const raw = await storage.getItem(settingsStorageKey);
        if (!raw) return defaultSettings;
        return normalizeSettings(JSON.parse(raw) as Partial<LocalUserSettings>);
      } catch {
        return defaultSettings;
      }
    },
    async save(settings: LocalUserSettings) {
      await storage.setItem(settingsStorageKey, JSON.stringify(normalizeSettings(settings)));
    },
  };
}
