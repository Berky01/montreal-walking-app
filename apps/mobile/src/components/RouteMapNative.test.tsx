import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { View } from 'react-native';
import type { ScoredRoute } from '@walking-app/shared';
import { RouteMapNative } from './RouteMapNative';

const mockFitToCoordinates = jest.fn();
var mockExpoConstants = { expoConfig: { extra: {} as Record<string, unknown> } };

jest.mock('expo-constants', () => ({
  __esModule: true,
  get default() {
    return mockExpoConstants;
  },
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockMap = React.forwardRef(({ children, onLayout, onMapReady, ...props }: { children?: React.ReactNode; onLayout?: () => void; onMapReady?: () => void }, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({ fitToCoordinates: mockFitToCoordinates }));
    React.useEffect(() => {
      onLayout?.();
      onMapReady?.();
    }, [onLayout, onMapReady]);
    return React.createElement(View, { ...props, testID: 'native-map' }, children);
  });

  MockMap.Marker = (props: object) => React.createElement(View, props);
  MockMap.Polyline = (props: object) => React.createElement(View, props);

  return {
    __esModule: true,
    default: MockMap,
    Marker: MockMap.Marker,
    Polyline: MockMap.Polyline,
  };
});

const route = {
  id: 'route-1',
  label: 'Loop with a far midpoint',
  cityId: 'montreal',
  geometry: [
    { lat: 45.5234, lng: -73.5996 },
    { lat: 45.61, lng: -73.49 },
    { lat: 45.5235, lng: -73.5997 },
  ],
  pois: [],
  distanceMeters: 5000,
  durationSeconds: 3600,
  estimatedSteps: 6667,
  provider: 'seed-routing-provider',
  debug: { targetMeters: 5000, waypointStrategy: 'test loop' },
  score: {
    total: 80,
    breakdown: {
      stepFit: 90,
      timeFit: 80,
      moodMatch: 70,
      interestMatch: 70,
      poiSpacing: 80,
      detourPenalty: 4,
      parkWaterfrontBonus: 0,
      excessTurnPenalty: 0,
    },
  },
  explanation: 'Good loop.',
  scoreSummary: ['90/100 step fit'],
  exportLinks: { googleMaps: '#', gpx: '<gpx></gpx>' },
} satisfies ScoredRoute;

describe('RouteMapNative', () => {
  beforeEach(() => {
    mockFitToCoordinates.mockClear();
    mockExpoConstants.expoConfig = { extra: {} };
    process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY = 'test-map-key';
  });

  it('fits the native viewport using every route geometry point', async () => {
    render(<RouteMapNative route={route} />);

    await waitFor(() => expect(mockFitToCoordinates).toHaveBeenCalled());

    expect(mockFitToCoordinates).toHaveBeenCalledWith(
      [
        { latitude: 45.5234, longitude: -73.5996 },
        { latitude: 45.61, longitude: -73.49 },
        { latitude: 45.5235, longitude: -73.5997 },
      ],
      expect.objectContaining({
        animated: false,
        edgePadding: expect.objectContaining({
          top: expect.any(Number),
          right: expect.any(Number),
          bottom: expect.any(Number),
          left: expect.any(Number),
        }),
      }),
    );
  });

  it('keeps the compact empty fallback for routes without geometry', () => {
    render(<RouteMapNative route={{ ...route, geometry: [] }} compact />);

    expect(screen.getByText('Route map unavailable.')).toBeTruthy();
  });

  it('shows an error fallback when the native map reports a load failure', () => {
    render(<RouteMapNative route={route} />);

    act(() => {
      screen.getByTestId('native-map').props.onError();
    });

    expect(screen.getByText('Map could not load. Route details are still available.')).toBeTruthy();
  });

  it('shows an explicit fallback when the Android Google Maps key is missing', () => {
    delete process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY;

    render(<RouteMapNative route={route} />);

    expect(screen.getByText('Add EXPO_ANDROID_GOOGLE_MAPS_API_KEY to render native map tiles.')).toBeTruthy();
    expect(mockFitToCoordinates).not.toHaveBeenCalled();
  });

  it('uses the public Expo config boolean instead of requiring the raw key at runtime', async () => {
    delete process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY;
    mockExpoConstants.expoConfig = { extra: { hasAndroidGoogleMapsApiKey: true } };

    render(<RouteMapNative route={route} />);

    await waitFor(() => expect(mockFitToCoordinates).toHaveBeenCalled());
    expect(screen.queryByText('Add EXPO_ANDROID_GOOGLE_MAPS_API_KEY to render native map tiles.')).toBeNull();
  });
});
