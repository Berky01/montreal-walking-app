const buildConfig = require('./app.config');

describe('Expo app config', () => {
  const originalEnv = process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY;
  const originalAliasEnv = process.env.GOOGLE_MAPS_API_KEY;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY;
    } else {
      process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY = originalEnv;
    }

    if (originalAliasEnv === undefined) {
      delete process.env.GOOGLE_MAPS_API_KEY;
    } else {
      process.env.GOOGLE_MAPS_API_KEY = originalAliasEnv;
    }
  });

  it('preserves app metadata while wiring react-native-maps to the Android key env var', () => {
    process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY = 'android-map-key';
    delete process.env.GOOGLE_MAPS_API_KEY;

    const config = buildConfig({ config: {} });

    expect(config.name).toBe('Montreal Walk Scout');
    expect(config.slug).toBe('montreal-walk-scout');
    expect(config.android.permissions).toEqual(['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION']);
    expect(config.extra.router.origin).toBe(false);
    expect(config.extra.hasAndroidGoogleMapsApiKey).toBe(true);
    expect(config.plugins).toContain('expo-router');
    expect(config.plugins).toContain('expo-sharing');
    expect(config.plugins).toContainEqual([
      'react-native-maps',
      { androidGoogleMapsApiKey: 'android-map-key' },
    ]);
  });

  it('supports GOOGLE_MAPS_API_KEY as a local alias without exposing the key in extra config', () => {
    delete process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY;
    process.env.GOOGLE_MAPS_API_KEY = 'alias-map-key';

    const config = buildConfig({ config: {} });

    expect(config.extra.hasAndroidGoogleMapsApiKey).toBe(true);
    expect(JSON.stringify(config.extra)).not.toContain('alias-map-key');
    expect(config.plugins).toContainEqual([
      'react-native-maps',
      { androidGoogleMapsApiKey: 'alias-map-key' },
    ]);
  });
});
