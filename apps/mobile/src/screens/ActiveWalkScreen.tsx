import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AppButton, FactPill, Message, Panel, Screen, ScreenTitle, SectionHeading } from '../components/Primitives';
import { RouteMapNative } from '../components/RouteMapNative';
import { useWalkApp } from '../state/WalkAppContext';
import { colors, spacing } from '../styles/tokens';
import { categoryLabel, humanDistance, reasonForPOI, poiStopTime } from '../utils/format';

function liveTrackingCopy(app: ReturnType<typeof useWalkApp>) {
  switch (app.liveWalk.status) {
    case 'idle':
      return 'Enable foreground location only while this walk is active.';
    case 'requesting':
      return 'Requesting foreground location permission...';
    case 'tracking':
      return `${humanDistance(app.liveWalk.distanceMeters)} tracked locally`;
    case 'paused':
      return 'Live tracking is paused. Resume when you want local progress updates.';
    case 'denied':
      return 'Location permission was denied. You can continue with estimated progress.';
    case 'error':
      return app.liveWalk.error || 'Location tracking failed. You can continue with estimated progress.';
    case 'unavailable':
      return 'Live tracking is unavailable on this device. Estimated progress is still available.';
    default:
      return 'Enable foreground location only while this walk is active.';
  }
}

export function ActiveWalkScreen() {
  const router = useRouter();
  const app = useWalkApp();
  const [showLowProgressConfirmation, setShowLowProgressConfirmation] = useState(false);
  const walk = app.walk;
  const route = walk?.route;
  const nextPOI = route?.pois.find((poi) => poi.id === app.nextPOIId) ?? route?.pois[0];

  async function completeWalk() {
    if (app.needsLowProgressConfirmation) {
      if (!showLowProgressConfirmation) {
        setShowLowProgressConfirmation(true);
      }
      return;
    }

    const ok = await app.completeWalk();
    if (ok) router.replace('/complete');
  }

  async function completeAnyway() {
    app.confirmLowProgressComplete();
    const ok = await app.completeWalk();
    if (ok) router.replace('/complete');
  }

  if (!walk || !route) {
    return (
      <Screen>
        <Message type="warning" text="Start a route before opening the walk companion." />
        <AppButton title="Back to explore" onPress={() => router.replace('/(tabs)')} />
      </Screen>
    );
  }

  return (
    <Screen fixedFooter={(
      showLowProgressConfirmation ? (
        <View style={styles.footerActions}>
          <AppButton
            title="Keep walking"
            variant="secondary"
            onPress={() => setShowLowProgressConfirmation(false)}
          />
          <AppButton title="Complete anyway" onPress={() => void completeAnyway()} />
        </View>
      ) : (
        <View style={styles.footerActions}>
          <AppButton
            title={walk.status === 'paused' ? 'Resume' : 'Pause'}
            variant="secondary"
            onPress={() => void app.updateWalkStatus(walk.status === 'paused' ? 'active' : 'paused')}
          />
          <AppButton title="Complete" onPress={() => void completeWalk()} />
        </View>
      )
    )}>
      {app.error ? <Message type="error" text={app.error} /> : null}
      <ScreenTitle title="Walk Companion" detail={route.label} />

      {app.activeProgress ? (
        <Panel>
          <SectionHeading title="Live progress" detail={app.activeProgress.source === 'gps' ? 'GPS' : 'Estimated'} />
          <Text style={styles.heroProgress}>{app.activeProgress.progressPercent}%</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${app.activeProgress.progressPercent}%` }]} /></View>
          <View style={styles.facts}>
            <FactPill>{humanDistance(app.activeProgress.distanceMeters)} walked</FactPill>
            <FactPill>{app.activeProgress.estimatedSteps} steps</FactPill>
            <FactPill>{Math.max(1, Math.round(app.activeProgress.elapsedSeconds / 60))} min</FactPill>
          </View>
        </Panel>
      ) : null}

      <RouteMapNative route={route} activePoiId={app.nextPOIId} completedPoiIds={app.discoveredPoiIds} compact />

      {app.nextMove ? (
        <Panel>
          <SectionHeading title="Next move" detail={app.nextMove.distanceLabel} />
          <Text style={styles.cardTitle}>{app.nextMove.title}</Text>
          <Text style={styles.body}>{app.nextMove.cue}</Text>
          <View style={styles.facts}>
            <FactPill>{app.nextMove.distanceLabel}</FactPill>
            <FactPill>{app.nextMove.etaLabel}</FactPill>
          </View>
        </Panel>
      ) : null}

      {app.timeGuardrail ? (
        <Panel>
          <SectionHeading title="Time guardrail" detail={app.timeGuardrail.status === 'on-track' ? 'On track' : 'Adjust'} />
          <Text style={styles.cardTitle}>{app.timeGuardrail.title}</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${app.timeGuardrail.progressPercent}%` }]} /></View>
          <View style={styles.facts}>
            <FactPill>{app.timeGuardrail.elapsedLabel}</FactPill>
            <FactPill>{app.timeGuardrail.remainingTimeLabel}</FactPill>
            <FactPill>{app.timeGuardrail.remainingDistanceLabel}</FactPill>
          </View>
          {app.timeGuardrail.status === 'running-long' ? (
            <Text style={styles.warning}>{app.timeGuardrail.warningLabel}</Text>
          ) : null}
        </Panel>
      ) : null}

      <View style={styles.bailouts}>
        {app.bailoutOptions.map((option) => (
          <Panel compact key={option.id}>
            <AppButton title={option.label} variant="secondary" onPress={() => app.chooseBailout(option.id)} />
            <Text style={styles.small}>{option.detail}</Text>
          </Panel>
        ))}
      </View>

      {app.activeWalkGuidance ? <Message type="status" text={app.activeWalkGuidance} /> : null}

      <Panel>
        <SectionHeading title="Live tracking" detail={app.liveWalk.status === 'tracking' ? 'On' : 'Optional'} />
        <Text style={styles.body}>{liveTrackingCopy(app)}</Text>
        {app.liveWalk.status === 'tracking' ? (
          <AppButton title="Pause tracking" variant="secondary" onPress={app.stopLiveTracking} />
        ) : (
          <AppButton title="Enable live tracking" variant="secondary" onPress={() => void app.enableLiveTracking()} />
        )}
      </Panel>

      {showLowProgressConfirmation ? (
        <Panel>
          <SectionHeading title="Complete walk?" detail="Low progress" />
          <Text style={styles.warning}>You have less than 20% progress and no completed discoveries. Complete this walk anyway?</Text>
        </Panel>
      ) : null}

      {nextPOI ? (
        <Panel>
          <SectionHeading title="Next discovery" detail={poiStopTime(nextPOI.category)} />
          <Text style={styles.cardTitle}>{nextPOI.name}</Text>
          <Text style={styles.body}>{reasonForPOI(nextPOI.category)}</Text>
          <View style={styles.facts}>
            <FactPill>{categoryLabel(nextPOI.category)}</FactPill>
          </View>
          <View style={styles.footerActions}>
            <AppButton title="Save" variant="secondary" onPress={() => void app.actOnPOI(nextPOI.id, 'save')} icon={<Ionicons name="bookmark-outline" size={16} color={colors.primary} />} />
            <AppButton title="Skip" variant="secondary" onPress={() => void app.actOnPOI(nextPOI.id, 'skip')} />
            <AppButton title={app.discoveredPoiIds.includes(nextPOI.id) ? 'Done' : 'Worth it'} disabled={app.discoveredPoiIds.includes(nextPOI.id)} onPress={() => void app.actOnPOI(nextPOI.id, 'discovered')} />
          </View>
        </Panel>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  heroProgress: {
    color: colors.secondary,
    fontSize: 34,
    fontWeight: '900',
  },
  body: {
    color: colors.muted,
    lineHeight: 21,
  },
  small: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  progressBar: {
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
  },
  warning: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontWeight: '800',
    padding: spacing.sm,
  },
  bailouts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
