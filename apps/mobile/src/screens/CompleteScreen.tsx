import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { feedbackOptions } from '@walking-app/shared';
import { AppButton, Chip, Message, Panel, Screen, ScreenTitle, TextField } from '../components/Primitives';
import { useWalkApp } from '../state/WalkAppContext';
import { colors, spacing } from '../styles/tokens';
import { formatNumber, humanDistance } from '../utils/format';

export function CompleteScreen() {
  const router = useRouter();
  const app = useWalkApp();
  const walk = app.walk;
  const plannedSteps = walk?.route.estimatedSteps ?? 0;
  const actualSteps = walk?.estimatedSteps ?? 0;
  const isShortWalk = walk ? actualSteps < plannedSteps * 0.2 : false;

  return (
    <Screen>
      <ScreenTitle
        title="Walk complete"
        detail={walk ? `${formatNumber(walk.estimatedSteps)} walked steps - ${walk.discoveredPoiIds.length} discoveries` : 'Nice walk.'}
      />
      {app.status === 'Feedback saved.' ? <Message type="status" text={app.status} /> : null}
      {walk ? (
        <Panel>
          <View style={styles.metricGrid}>
            <View style={styles.metric}>
              <Text style={styles.big}>{formatNumber(actualSteps)}</Text>
              <Text style={styles.label}>Actual walked steps</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.big}>{formatNumber(plannedSteps)}</Text>
              <Text style={styles.label}>Planned route steps</Text>
            </View>
          </View>
          <Text style={styles.body}>{humanDistance(walk.route.distanceMeters)} planned distance</Text>
          {isShortWalk ? (
            <Message type="warning" text="This walk was shorter than planned, so completion metrics may look low." />
          ) : null}
        </Panel>
      ) : null}
      <Panel>
        <Text style={styles.big}>{app.progress?.placesDiscovered ?? walk?.discoveredPoiIds.length ?? 0}</Text>
        <Text style={styles.label}>Lifetime places discovered</Text>
      </Panel>
      <Panel>
        <Text style={styles.heading}>Route feedback</Text>
        <View style={styles.wrap}>
          {feedbackOptions.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              selected={app.feedbackLabels.includes(option.id)}
              onPress={() => app.toggleFeedbackLabel(option.id)}
            />
          ))}
        </View>
        <TextField label="Note" value={app.feedbackNote} onChangeText={app.setFeedbackNote} />
        {app.feedbackLabels.length === 0 ? (
          <Text style={styles.body}>Select at least one route note to save feedback.</Text>
        ) : null}
        <AppButton title="Save feedback" disabled={app.feedbackLabels.length === 0} onPress={() => void app.submitFeedback()} />
      </Panel>
      <AppButton title="Plan another walk" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: {
    color: colors.secondary,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  label: {
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metric: {
    flex: 1,
    gap: spacing.xs,
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    lineHeight: 21,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
