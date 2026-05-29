import * as Location from 'expo-location';
import type { Coordinate } from '@walking-app/shared';

export type LiveTrackingStatus = 'idle' | 'tracking' | 'paused' | 'denied' | 'unavailable' | 'error';

export interface LocationStartResult {
  status: LiveTrackingStatus;
  error?: string;
  stop?: () => void;
}

interface LocationLike {
  requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  watchPositionAsync: typeof Location.watchPositionAsync;
}

export function createLocationTracker(location: LocationLike = Location) {
  return {
    async start(onUpdate: (coordinate: Coordinate) => void): Promise<LocationStartResult> {
      try {
        const permission = await location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          return { status: 'denied', error: 'Location permission was denied.' };
        }

        const subscription = await location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 15,
            timeInterval: 5000,
          },
          (position) => {
            onUpdate({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
        );

        return {
          status: 'tracking',
          stop: () => subscription.remove(),
        };
      } catch (error) {
        return {
          status: 'error',
          error: error instanceof Error ? error.message : 'Location tracking failed.',
        };
      }
    },
  };
}
