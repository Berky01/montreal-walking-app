import { Text, View, StyleSheet } from 'react-native';
import type { POIActionRecord } from '@walking-app/shared';
import { useRouter } from 'expo-router';
import { AppButton, Message, Panel, Screen, ScreenTitle, SectionHeading } from '../components/Primitives';
import { SavedRouteCard } from '../components/RouteCards';
import { useWalkApp } from '../state/WalkAppContext';
import { colors, spacing } from '../styles/tokens';

export function SavedScreen() {
  const router = useRouter();
  const app = useWalkApp();

  return (
    <Screen>
      <ScreenTitle title="Saved discoveries" detail="Quiet progress, not a game" />
      <View style={styles.progress}>
        <Panel compact><Text style={styles.number}>{app.progress?.placesDiscovered ?? 0}</Text><Text style={styles.label}>places discovered</Text></Panel>
        <Panel compact><Text style={styles.number}>{app.progress?.savedRoutes ?? app.savedRoutes.length}</Text><Text style={styles.label}>routes saved</Text></Panel>
      </View>
      <SectionHeading title="Saved routes" detail={`${app.savedRoutes.length} total`} />
      {app.savedRoutes.length === 0 ? <Message type="warning" text="Saved routes will appear here after you bookmark a loop." /> : null}
      {app.savedRoutes.map((saved) => (
        <SavedRouteCard
          key={saved.id}
          route={saved.route}
          savedAt={saved.createdAt}
          onPress={() => {
            void app.openRouteDetail(saved.routeId).then((ok) => ok && router.push('/detail'));
          }}
        />
      ))}
      {app.poiActions.length > 0 ? (
        <Panel>
          <Text style={styles.heading}>Recent discovery actions</Text>
          {app.poiActions.slice(0, 3).map((action) => (
            <Text key={action.id} style={styles.body}>{poiActionLabel(action)}</Text>
          ))}
        </Panel>
      ) : null}
      <AppButton title="Refresh saved routes" variant="secondary" onPress={() => void app.loadRuntime()} />
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
  },
  body: {
    color: colors.muted,
  },
});

function poiActionLabel(action: POIActionRecord) {
  if (action.action === 'save') return `Saved ${action.poi.name}`;
  if (action.action === 'skip') return `Skipped ${action.poi.name}`;
  if (action.action === 'discovered') return `Marked ${action.poi.name} as worth it`;
  return action.poi.name;
}
