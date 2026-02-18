/**
 * Demo Banner Component
 *
 * Displays a banner when the user is in demo mode.
 * This helps App Store reviewers know they are in demo mode.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from './icon-symbol';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface DemoBannerProps {
  light?: boolean; // Light variant for smaller displays
}

export function DemoBanner({ light = false }: DemoBannerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        styles.container,
        light ? styles.containerLight : styles.containerFull,
        { backgroundColor: colors.primary + '20', borderColor: colors.primary },
      ]}
    >
      <IconSymbol name="star.fill" size={light ? 12 : 14} color={colors.primary} />
      <Text
        style={[
          light ? styles.textLight : styles.textFull,
          { color: colors.primary },
        ]}
      >
        Demo Mode - Review Account
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  containerFull: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  containerLight: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  textFull: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  textLight: {
    ...Typography.caption,
    fontWeight: '600',
  },
});

/**
 * Hook to check if current user is in demo mode
 */
export async function isDemoUser(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const { isDemoEmail } = await import('@/lib/demo-mode');
  return isDemoEmail(email);
}
