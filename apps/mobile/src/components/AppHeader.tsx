import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../styles/tokens';
import { useWalkApp } from '../state/WalkAppContext';

export function AppHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { startPlace, loadRuntime } = useWalkApp();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) + spacing.sm }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open saved discoveries" onPress={() => router.push('/(tabs)/saved')} style={styles.iconButton}>
        <Ionicons name="bookmark-outline" size={20} color={colors.text} />
      </Pressable>
      <View style={styles.headerText}>
        <Text style={styles.title}>Plateau Mont-Royal</Text>
        <Text style={styles.subtitle}>{startPlace.label}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Refresh" onPress={() => void loadRuntime()} style={styles.iconButton}>
        <Ionicons name="refresh" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLow,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 17,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
