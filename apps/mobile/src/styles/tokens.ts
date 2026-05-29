import { stitchTokens } from '@walking-app/shared';

export const colors = stitchTokens.color;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  pill: 999,
};

export const typography = {
  title: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '800' as const,
    color: colors.text,
  },
  screenTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800' as const,
    color: colors.text,
  },
  section: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800' as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
  small: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
    fontWeight: '700' as const,
  },
};

export const shadow = {
  shadowColor: '#2f3133',
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
