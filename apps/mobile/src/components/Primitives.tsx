import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, typography } from '../styles/tokens';

export function Screen({ children, fixedFooter }: PropsWithChildren<{ fixedFooter?: ReactNode }>) {
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);
  const footerSafePadding = Math.max(insets.bottom, spacing.sm) + spacing.sm;
  const bottomPadding = fixedFooter ? spacing.lg : 110;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={fixedFooter && footerHeight > 0 ? { marginBottom: footerHeight } : undefined}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {fixedFooter ? (
        <View
          onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
          style={[styles.fixedFooter, { paddingBottom: footerSafePadding }]}
        >
          {fixedFooter}
        </View>
      ) : null}
    </View>
  );
}

export function Panel({ children, compact = false }: PropsWithChildren<{ compact?: boolean }>) {
  return <View style={[styles.panel, compact ? styles.panelCompact : null]}>{children}</View>;
}

export function ScreenTitle({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) {
  return (
    <View style={styles.titleBlock}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.body}>{detail}</Text> : null}
    </View>
  );
}

export function SectionHeading({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
    </View>
  );
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.primaryButton : variant === 'secondary' ? styles.secondaryButton : styles.ghostButton,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      {icon}
      <Text style={[
        styles.buttonText,
        variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText,
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected ? styles.chipSelected : null, pressed ? styles.pressed : null]}
    >
      {icon}
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        editable={editable}
        style={[styles.input, !editable ? styles.inputDisabled : null]}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

export function Message({ type, text }: { type: 'error' | 'status' | 'warning'; text: string }) {
  return (
    <View style={[
      styles.message,
      type === 'error' ? styles.errorMessage : type === 'warning' ? styles.warningMessage : styles.statusMessage,
    ]}>
      <Text style={styles.messageText}>{text}</Text>
    </View>
  );
}

export function FactPill({ children }: PropsWithChildren) {
  return (
    <View style={styles.factPill}>
      <Text style={styles.factPillText}>{children}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 110,
  },
  fixedFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: spacing.sm,
  },
  panel: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceLowest,
    padding: spacing.md,
  },
  panelCompact: {
    padding: spacing.sm,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  title: typography.title,
  body: typography.body,
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  sectionTitle: typography.section,
  sectionDetail: {
    ...typography.small,
    color: colors.primary,
  },
  button: {
    minHeight: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadow,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghostButton: {
    backgroundColor: colors.surfaceLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  buttonText: {
    fontWeight: '800',
    fontSize: 15,
  },
  primaryButtonText: {
    color: colors.onPrimary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.78,
  },
  chip: {
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryContainer,
  },
  chipText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 13,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: typography.small,
  input: {
    minHeight: 48,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surfaceLow,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.55,
  },
  message: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  errorMessage: {
    backgroundColor: '#ffdad6',
    borderColor: colors.error,
    borderWidth: 1,
  },
  warningMessage: {
    backgroundColor: '#eae1d4',
    borderColor: colors.outlineVariant,
    borderWidth: 1,
  },
  statusMessage: {
    backgroundColor: '#eff8ee',
    borderColor: colors.secondaryContainer,
    borderWidth: 1,
  },
  messageText: {
    color: colors.text,
    lineHeight: 20,
  },
  factPill: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  factPillText: {
    ...typography.small,
    color: colors.muted,
  },
});
