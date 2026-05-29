import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton, FactPill, Message, Panel, Screen, ScreenTitle } from '../components/Primitives';
import { useWalkApp } from '../state/WalkAppContext';
import { colors, spacing } from '../styles/tokens';
import { formatNumber } from '../utils/format';

export function HistoryScreen() {
  const router = useRouter();
  const app = useWalkApp();

  return (
    <Screen>
      <ScreenTitle title="Walk history" detail="Completed loops and saved progress" />
      <View style={styles.progress}>
        <Panel compact><Text style={styles.number}>{app.progress?.loopsCompleted ?? app.completedWalks.length}</Text><Text style={styles.label}>loops completed</Text></Panel>
        <Panel compact><Text style={styles.number}>{formatNumber(app.settings.weeklyStepGoal)}</Text><Text style={styles.label}>weekly step goal</Text></Panel>
      </View>
      {app.completedWalks.length === 0 ? (
        <Panel>
          <Text style={styles.heading}>Your journey starts here</Text>
          <Text style={styles.body}>Walk history stays local-first on this device until you choose to export it.</Text>
          <View style={styles.facts}>
            <FactPill>0 loops completed</FactPill>
            <FactPill>0 actual steps</FactPill>
            <FactPill>0 discoveries</FactPill>
          </View>
          <AppButton title="Find a loop to start" onPress={() => router.push('/')} />
          <AppButton title="View saved routes" variant="secondary" onPress={() => router.push('/saved')} />
        </Panel>
      ) : null}
      {app.completedWalks.map((walk) => {
        const plannedRoute = app.savedRoutes.find((saved) => saved.routeId === walk.routeId)?.route;

        return (
          <Panel key={walk.id}>
            <Text style={styles.kicker}>Completed {formatDate(walk.completedAt)}</Text>
            <Text style={styles.heading}>{walk.routeLabel}</Text>
            <View style={styles.facts}>
              <FactPill>{Math.round(walk.elapsedSeconds / 60)} min elapsed</FactPill>
              <FactPill>{formatNumber(walk.estimatedSteps)} actual steps</FactPill>
              {plannedRoute ? <FactPill>{formatNumber(plannedRoute.estimatedSteps)} planned steps</FactPill> : null}
              <FactPill>{walk.discoveredCount} discoveries</FactPill>
            </View>
          </Panel>
        );
      })}
      <AppButton title="Refresh history" variant="secondary" onPress={() => void app.loadRuntime()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  number: {
    color: colors.secondary,
    fontSize: 24,
    fontWeight: '900',
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  heading: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    lineHeight: 20,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
