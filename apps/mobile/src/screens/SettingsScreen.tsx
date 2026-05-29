import { Switch, Text, View, StyleSheet } from 'react-native';
import { AppButton, Message, Panel, Screen, ScreenTitle, TextField } from '../components/Primitives';
import { useWalkApp } from '../state/WalkAppContext';
import { colors, spacing } from '../styles/tokens';
import { formatNumber } from '../utils/format';

export function SettingsScreen() {
  const app = useWalkApp();
  const savedRouteCount = app.savedRoutes.length;
  const completedWalkCount = app.completedWalks.length;
  const privacyMode = app.settings.privacyMode;
  const ledgerSummary = `${formatCount(savedRouteCount, 'saved route')} - ${formatCount(completedWalkCount, 'completed walk')} - ${privacyMode} privacy`;

  return (
    <Screen>
      <ScreenTitle title="Settings" detail="Local-first preferences" />
      <Panel>
        <TextField
          label="Weekly step goal"
          value={formatNumber(app.settings.weeklyStepGoal)}
          keyboardType="number-pad"
          onChangeText={(value) => app.updateSettings({ weeklyStepGoal: Number(value.replace(/\D/g, '')) || 0 })}
        />
        <ToggleRow
          label="Use kilometers"
          value={app.settings.distanceUnit === 'km'}
          onValueChange={(checked) => app.updateSettings({ distanceUnit: checked ? 'km' : 'mi' })}
        />
        <ToggleRow
          label="Daily walk reminder"
          value={app.settings.remindersEnabled}
          onValueChange={(checked) => app.updateSettings({ remindersEnabled: checked })}
        />
        <TextField
          label="Reminder time"
          value={app.settings.reminderTime}
          onChangeText={(value) => app.updateSettings({ reminderTime: value || '08:00' })}
          editable={app.settings.remindersEnabled}
        />
        <ToggleRow
          label="Reduce motion"
          value={app.settings.reducedMotion}
          onValueChange={(checked) => app.updateSettings({ reducedMotion: checked })}
        />
      </Panel>
      <Panel>
        <Text style={styles.heading}>Privacy</Text>
        <Text style={styles.body}>Location tracking is local-first. Raw GPS coordinates are not sent when a walk is completed.</Text>
      </Panel>
      <Panel>
        <Text style={styles.heading}>Privacy data ledger</Text>
        <Text style={styles.body}>{ledgerSummary}</Text>
        <View style={styles.ledgerGrid}>
          <View style={styles.ledgerItem}>
            <Text style={styles.ledgerValue}>{formatNumber(savedRouteCount)}</Text>
            <Text style={styles.ledgerLabel}>Saved routes</Text>
          </View>
          <View style={styles.ledgerItem}>
            <Text style={styles.ledgerValue}>{formatNumber(completedWalkCount)}</Text>
            <Text style={styles.ledgerLabel}>Completed walks</Text>
          </View>
          <View style={styles.ledgerItem}>
            <Text style={styles.ledgerValue}>{formatNumber(app.poiActions.length)}</Text>
            <Text style={styles.ledgerLabel}>POI actions</Text>
          </View>
        </View>
      </Panel>
      <Panel>
        <Text style={styles.heading}>Location permission</Text>
        <Text style={styles.body}>Location is requested only for live walk tracking. Permission can be changed in system settings.</Text>
      </Panel>
      <Panel>
        <Text style={styles.heading}>App health</Text>
        <Text style={styles.body}>Walking API: {app.apiHealth}</Text>
      </Panel>
      {app.status ? <Message type="status" text={app.status} /> : null}
      <AppButton title="Export data" variant="secondary" onPress={app.exportDataLedger} />
      <AppButton title="Delete local data" variant="ghost" onPress={app.deleteLocalData} />
      <AppButton title="Show onboarding again" variant="secondary" onPress={() => app.updateSettings({ onboardingComplete: false })} />
    </Screen>
  );
}

function formatCount(count: number, singular: string) {
  return `${formatNumber(count)} ${singular}${count === 1 ? '' : 's'}`;
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.secondaryContainer }} thumbColor={value ? colors.secondary : colors.surfaceHigh} />
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toggleLabel: {
    color: colors.muted,
    fontWeight: '800',
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
  ledgerGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ledgerItem: {
    flex: 1,
    gap: spacing.xs,
  },
  ledgerValue: {
    color: colors.secondary,
    fontSize: 22,
    fontWeight: '900',
  },
  ledgerLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
});
