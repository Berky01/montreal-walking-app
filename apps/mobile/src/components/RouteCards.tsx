import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RouteSummary, ScoredRoute } from '@walking-app/shared';
import { colors, radius, spacing, typography } from '../styles/tokens';
import { formatNumber, humanDistance } from '../utils/format';
import { FactPill } from './Primitives';

export function RouteSummaryCard({
  route,
  onPress,
}: {
  route: RouteSummary;
  index?: number;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.kicker}>{route.label}</Text>
        <Text style={styles.badge}>{categoryLabel(route.fitCategory)}</Text>
      </View>
      <Text style={styles.title}>{route.label}</Text>
      <Text style={styles.body}>{route.fitReason ?? route.explanation}</Text>
      <View style={styles.facts}>
        <FactPill>{formatNumber(route.estimatedSteps)} steps</FactPill>
        <FactPill>{Math.round(route.durationSeconds / 60)} min</FactPill>
        <FactPill>{humanDistance(route.distanceMeters)}</FactPill>
        <FactPill>{route.poiCount} stops</FactPill>
      </View>
    </Pressable>
  );
}

export function SavedRouteCard({
  route,
  savedAt,
  onPress,
}: {
  route: ScoredRoute;
  savedAt?: string;
  onPress: () => void;
}) {
  const startAnchor = firstNeighborhoodAnchor(route);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      {savedAt ? <Text style={styles.kicker}>Saved {formatDate(savedAt)}</Text> : null}
      <Text style={styles.title}>{route.label}</Text>
      {startAnchor ? <Text style={styles.body}>{startAnchor} start</Text> : null}
      <View style={styles.facts}>
        <FactPill>{humanDistance(route.distanceMeters)}</FactPill>
        <FactPill>{Math.round(route.durationSeconds / 60)} min</FactPill>
        <FactPill>{formatNumber(route.estimatedSteps)} steps</FactPill>
        <FactPill>{route.pois.length} discoveries</FactPill>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceLowest,
    padding: spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kicker: typography.small,
  badge: {
    ...typography.small,
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  body: typography.body,
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

function categoryLabel(category: RouteSummary['fitCategory']) {
  if (category === 'best-fit') return 'Best match';
  if (category === 'shorter') return 'Shorter';
  if (category === 'scenic') return 'Scenic';
  if (category === 'fewer-stops') return 'Simpler';
  return 'Route';
}

function firstNeighborhoodAnchor(route: ScoredRoute) {
  const neighborhood = route.pois
    .map((poi) => poi.metadata?.neighborhood)
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return neighborhood?.trim() ?? null;
}

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
