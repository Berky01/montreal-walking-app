import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppButton, FactPill, Message, Panel, Screen, ScreenTitle, SectionHeading } from '../components/Primitives';
import { RouteMapNative } from '../components/RouteMapNative';
import { useWalkApp } from '../state/WalkAppContext';
import { colors, spacing } from '../styles/tokens';
import { categoryLabel, humanDistance, poiStopTime } from '../utils/format';
import { openExternalUrl, shareGpx } from '../platform/shareRoute';

export function DetailScreen() {
  const router = useRouter();
  const app = useWalkApp();
  const route = app.selectedRoute;

  if (!route) {
    return (
      <Screen>
        <Message type="warning" text="No route selected." />
        <AppButton title="Back to routes" onPress={() => router.replace('/compare')} />
      </Screen>
    );
  }

  const isSaved = app.savedRouteIds.includes(route.id);
  const isSaving = app.savingRouteIds.includes(route.id);
  const saveTitle = isSaved ? 'Saved' : isSaving ? 'Saving' : 'Save';
  const routeConfidence = Math.round(route.score.total);

  return (
    <Screen>
      {app.error ? <Message type="error" text={app.error} /> : null}
      {app.status ? <Message type="status" text={app.status} /> : null}
      <ScreenTitle title={route.label} detail={`For your ${app.selectedGoal.label} walk`} />
      <RouteMapNative route={route} activePoiId={app.nextPOIId} completedPoiIds={app.discoveredPoiIds} />
      <Panel>
        <SectionHeading title="Why this route" />
        <Text style={styles.body}>{route.fitReason ?? route.explanation}</Text>
        <View style={styles.facts}>
          <FactPill>{humanDistance(route.distanceMeters)}</FactPill>
          <FactPill>{route.estimatedSteps} steps</FactPill>
          <FactPill>{route.pois.length} stops</FactPill>
        </View>
      </Panel>
      <Panel>
        <SectionHeading title="Route trust" detail={`Confidence ${routeConfidence}%`} />
        <View style={styles.trustRows}>
          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark" color={colors.secondary} size={18} />
            <Text style={styles.body}>Confidence {routeConfidence}% based on step fit, stop spacing, and route shape.</Text>
          </View>
          <View style={styles.trustRow}>
            <Ionicons name="map" color={colors.primary} size={18} />
            <Text style={styles.body}>If map tiles are unavailable, the stop list and export links still work.</Text>
          </View>
          <View style={styles.trustRow}>
            <Ionicons name="time" color={colors.primary} size={18} />
            <Text style={styles.body}>Opening hours can change; check each stop before relying on it.</Text>
          </View>
        </View>
      </Panel>
      <Panel>
        <SectionHeading title={`${route.pois.length} discoveries on this loop`} />
        {route.pois.slice(0, 6).map((poi, index) => (
          <View key={poi.id} style={styles.poiRow}>
            <Text style={styles.poiIndex}>{index + 1}</Text>
            <View style={styles.poiText}>
              <Text style={styles.poiName}>{poi.name}</Text>
              <Text style={styles.poiMeta}>{categoryLabel(poi.category)} · {poiStopTime(poi.category)} stop</Text>
            </View>
          </View>
        ))}
      </Panel>
      <View style={styles.actions}>
        <AppButton title="Start" onPress={() => void app.startWalk(route).then((ok) => ok && router.push('/active'))} icon={<Ionicons name="play" color={colors.onPrimary} size={18} />} />
        <AppButton title={saveTitle} variant="secondary" disabled={isSaved || isSaving} onPress={() => void app.saveRoute(route)} />
      </View>
      <Panel>
        <SectionHeading title="Share and export" />
        <View style={styles.actions}>
          <AppButton title="Maps" variant="secondary" onPress={() => void openExternalUrl(route.exportLinks.googleMaps)} />
          <AppButton
            title="GPX"
            variant="secondary"
            onPress={() => void shareGpx(route).catch((caught) => {
              app.reportError(caught instanceof Error ? caught.message : 'Could not share GPX.');
            })}
          />
        </View>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    lineHeight: 21,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  poiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  poiIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '900',
  },
  poiText: {
    flex: 1,
  },
  poiName: {
    color: colors.text,
    fontWeight: '800',
  },
  poiMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    gap: spacing.sm,
  },
  trustRows: {
    gap: spacing.sm,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
});
