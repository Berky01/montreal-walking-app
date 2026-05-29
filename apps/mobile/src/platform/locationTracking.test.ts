import { createLocationTracker } from './locationTracking';

describe('location tracker adapter', () => {
  it('reports denied when foreground permission is not granted', async () => {
    const tracker = createLocationTracker({
      requestForegroundPermissionsAsync: async () => ({ status: 'denied' }),
      watchPositionAsync: jest.fn(),
    });

    await expect(tracker.start(jest.fn())).resolves.toEqual({
      status: 'denied',
      error: 'Location permission was denied.',
    });
  });

  it('subscribes to foreground location updates when permission is granted', async () => {
    const remove = jest.fn();
    const onUpdate = jest.fn();
    const watchPositionAsync = jest.fn(async (_options, callback) => {
      callback({
        coords: {
          latitude: 45.5,
          longitude: -73.56,
          accuracy: 8,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
      return { remove };
    });
    const tracker = createLocationTracker({
      requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
      watchPositionAsync,
    });

    const result = await tracker.start(onUpdate);

    expect(result.status).toBe('tracking');
    expect(onUpdate).toHaveBeenCalledWith({ lat: 45.5, lng: -73.56 });
    result.stop?.();
    expect(remove).toHaveBeenCalled();
  });
});
