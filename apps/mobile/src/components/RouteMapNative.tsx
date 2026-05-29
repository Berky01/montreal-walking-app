import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import type { ScoredRoute } from '@walking-app/shared';
import type MapView from 'react-native-maps';
import { colors, radius, spacing } from '../styles/tokens';

type AppConfigExtra = {
  hasAndroidGoogleMapsApiKey?: boolean;
};

type NativeMapModule = typeof import('react-native-maps');

function hasAndroidGoogleMapsApiKey() {
  if (Platform.OS === 'web') return false;

  const constants = Constants as { expoConfig?: { extra?: AppConfigExtra } } | undefined;
  const extra = constants?.expoConfig?.extra;

  return extra?.hasAndroidGoogleMapsApiKey ?? Boolean(process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY?.trim());
}

function getNativeMapModule(): NativeMapModule | null {
  if (Platform.OS === 'web') return null;

  return require('react-native-maps') as NativeMapModule;
}

export function RouteMapNative({
  route,
  activePoiId,
  completedPoiIds = [],
  compact = false,
}: {
  route: ScoredRoute;
  activePoiId?: string | null;
  completedPoiIds?: string[];
  compact?: boolean;
}) {
  const first = route.geometry[0];
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const hasGoogleMapsKey = hasAndroidGoogleMapsApiKey();
  const nativeMaps = getNativeMapModule();
  const coordinates = useMemo(
    () => route.geometry.map((point) => ({ latitude: point.lat, longitude: point.lng })),
    [route.geometry],
  );
  const latitudeDelta = 0.02;
  const longitudeDelta = 0.02;

  const fitRoute = useCallback(() => {
    if (!mapReady || !layoutReady || coordinates.length < 2) {
      return;
    }

    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: compact
        ? { top: 28, right: 28, bottom: 64, left: 28 }
        : { top: 44, right: 36, bottom: 88, left: 36 },
      animated: false,
    });
  }, [compact, coordinates, layoutReady, mapReady]);

  useEffect(() => {
    fitRoute();
  }, [fitRoute]);

  const mapLoadHandlers = {
    onError: () => setLoadFailed(true),
  };

  if (!first) {
    return (
      <View style={[styles.empty, compact ? styles.compact : null]}>
        <Text style={styles.emptyText}>Route map unavailable.</Text>
      </View>
    );
  }

  if (!hasGoogleMapsKey || !nativeMaps) {
    return (
      <View style={[styles.shell, compact ? styles.compact : null]}>
        <View style={styles.mapFallback}>
          <Text style={styles.emptyText}>
            {Platform.OS === 'web'
              ? 'Native map tiles are shown in the mobile app. Route details are still available.'
              : 'Add EXPO_ANDROID_GOOGLE_MAPS_API_KEY to render native map tiles.'}
          </Text>
          <View style={styles.stopPreview}>
            <View style={styles.stopDot} />
            {route.pois.slice(0, 6).map((poi, index) => (
              <View key={poi.id} style={styles.stopItem}>
                <Text style={styles.stopIndex}>{index + 1}</Text>
                <Text style={styles.stopName} numberOfLines={1}>{poi.name}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Route preview</Text>
          <Text style={styles.summaryText}>{route.pois.length} stops</Text>
        </View>
      </View>
    );
  }

  const MapView = nativeMaps.default;
  const { Marker, Polyline } = nativeMaps;

  return (
    <View style={[styles.shell, compact ? styles.compact : null]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: first.lat,
          longitude: first.lng,
          latitudeDelta,
          longitudeDelta,
        }}
        onLayout={() => {
          setLayoutReady(true);
          fitRoute();
        }}
        onMapReady={() => {
          setMapReady(true);
          fitRoute();
        }}
        {...mapLoadHandlers}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor={colors.primary}
          strokeWidth={5}
        />
        <Marker coordinate={{ latitude: first.lat, longitude: first.lng }} title="Start / finish" pinColor={colors.secondary} />
        {route.pois.slice(0, 8).map((poi, index) => (
          <Marker
            key={poi.id}
            coordinate={{ latitude: poi.coordinate.lat, longitude: poi.coordinate.lng }}
            title={`${index + 1}. ${poi.name}`}
            description={poi.category}
            pinColor={completedPoiIds.includes(poi.id) ? colors.secondary : poi.id === activePoiId ? colors.primaryContainer : colors.primary}
          />
        ))}
      </MapView>
      {loadFailed ? (
        <View style={styles.mapFallback}>
          <Text style={styles.emptyText}>Map could not load. Route details are still available.</Text>
        </View>
      ) : !mapReady ? (
        <View style={styles.mapFallback}>
          <Text style={styles.emptyText}>Loading map...</Text>
        </View>
      ) : null}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Route preview</Text>
        <Text style={styles.summaryText}>{route.pois.length} stops</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 260,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLow,
  },
  compact: {
    minHeight: 170,
  },
  empty: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLow,
  },
  emptyText: {
    color: colors.muted,
  },
  summary: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(249, 249, 252, 0.94)',
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  summaryText: {
    color: colors.text,
    fontWeight: '800',
  },
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLow,
    padding: spacing.lg,
  },
  stopPreview: {
    marginTop: spacing.md,
    width: '100%',
    gap: spacing.sm,
  },
  stopDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.secondary,
    alignSelf: 'center',
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    maxWidth: '88%',
  },
  stopIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '900',
  },
  stopName: {
    color: colors.text,
    fontWeight: '800',
    flexShrink: 1,
  },
});
