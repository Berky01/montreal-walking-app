import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { interestOptions } from '@walking-app/shared';
import type { Interest } from '@walking-app/shared';
import { useWalkApp } from '../state/WalkAppContext';
import { goalPresets } from '../state/goals';
import { AppButton, Chip, Message, Panel, Screen, ScreenTitle, SectionHeading, TextField } from '../components/Primitives';
import { colors, spacing } from '../styles/tokens';
import { formatNumber } from '../utils/format';

const interestIcons: Record<Interest, keyof typeof Ionicons.glyphMap> = {
  parks: 'leaf-outline',
  cafes: 'cafe-outline',
  architecture: 'location-outline',
  churches: 'location-outline',
  viewpoints: 'sparkles-outline',
  waterfront: 'compass-outline',
  'public-toilets': 'location-outline',
  transit: 'navigate-outline',
};

export function ExploreScreen() {
  const router = useRouter();
  const app = useWalkApp();

  return (
    <Screen
      fixedFooter={(
        <AppButton
          title={app.isBusy ? 'Finding loops' : `Find loops for ${app.selectedGoal.label}`}
          disabled={app.isBusy || Boolean(app.apiBaseUrlError)}
          onPress={() => void app.generateRoutes().then((ok) => {
            if (ok) router.push('/compare');
          })}
          icon={<Ionicons name="footsteps-outline" size={18} color={colors.onPrimary} />}
        />
      )}
    >
      {app.apiBaseUrlError ? <Message type="warning" text={app.apiBaseUrlError} /> : null}
      {app.apiHealth === 'unavailable' && app.error ? <Message type="warning" text={app.error} /> : null}
      {app.error && app.apiHealth !== 'unavailable' ? <Message type="error" text={app.error} /> : null}
      {app.status ? <Message type="status" text={app.status} /> : null}

      {!app.settings.onboardingComplete && (
        <Panel>
          <Text style={styles.eyebrow}>Local-first</Text>
          <Text style={styles.onboardingTitle}>Walk privately</Text>
          <Text style={styles.body}>Location tracking only runs during an active walk. Raw GPS trails stay off the server.</Text>
          <AppButton title="Start planning" onPress={() => app.updateSettings({ onboardingComplete: true })} />
        </Panel>
      )}

      <ScreenTitle
        eyebrow="Plateau Mont-Royal"
        title="Find a loop that fits today"
        detail="Choose a walking goal, start near Mile End, and compare practical discovery loops."
      />

      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <TextField label="Start near" value={app.startInput} onChangeText={app.setStartInput} />
        </View>
        <AppButton title="" onPress={() => void app.lookupStart()} icon={<Ionicons name="search" size={20} color={colors.onPrimary} />} />
      </View>
      {app.startCandidates.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {app.startCandidates.slice(0, 4).map((place) => (
            <Chip key={place.id ?? place.label} label={place.label} onPress={() => app.setStartPlaceFromCandidate(place)} />
          ))}
        </ScrollView>
      )}

      <View style={styles.section}>
        <SectionHeading
          title="Choose a goal"
          detail={`${formatNumber(app.selectedGoal.stepGoal)} steps · about ${app.selectedGoal.timeGoalMinutes} min`}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {goalPresets.map((goal) => (
            <Chip
              key={goal.id}
              selected={goal.id === app.selectedGoalId}
              label={`${goal.label}  ${goal.title}`}
              onPress={() => app.setSelectedGoalId(goal.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Nearby loops" />
        <View style={styles.wrap}>
          {interestOptions.map((option) => (
            <Chip
              key={option.id}
              selected={app.selectedInterests.includes(option.id)}
              label={option.label}
              onPress={() => app.toggleInterest(option.id)}
              icon={<Ionicons name={interestIcons[option.id]} size={16} color={colors.text} />}
            />
          ))}
        </View>
      </View>

      <View style={styles.progressGrid}>
        <Panel compact>
          <Text style={styles.progressNumber}>{app.progress?.placesDiscovered ?? 0}</Text>
          <Text style={styles.progressLabel}>places discovered</Text>
        </Panel>
        <Panel compact>
          <Text style={styles.progressNumber}>{app.progress?.estimatedNeighborhoodCoverage ?? 0}%</Text>
          <Text style={styles.progressLabel}>estimated local coverage</Text>
        </Panel>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  onboardingTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    lineHeight: 21,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
  },
  section: {
    gap: spacing.md,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  progressGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressNumber: {
    color: colors.secondary,
    fontSize: 24,
    fontWeight: '800',
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
