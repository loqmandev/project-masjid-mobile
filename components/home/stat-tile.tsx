import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

type StatVariant = 'default' | 'primary' | 'gold' | 'streak';

interface StatTileProps {
  icon: string;
  value: number | string;
  label: string;
  variant?: StatVariant;
}

const ICON_SIZE = 28;

export function StatTile({ icon, value, label, variant = 'default' }: StatTileProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getVariantStyles = (): { bg: string; iconColor: string } => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primary + '15', iconColor: colors.primary };
      case 'gold':
        return { bg: colors.gold + '15', iconColor: colors.gold };
      case 'streak':
        return { bg: '#FF6B35' + '15', iconColor: '#FF6B35' };
      default:
        return { bg: colors.primary + '15', iconColor: colors.primary };
    }
  };

  const { bg, iconColor } = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colorScheme === 'light' ? '#000' : undefined,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: bg }]}>
        <IconSymbol name={icon} size={ICON_SIZE} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    // Shadow for elevation effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    ...Typography.h2,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  },
  label: {
    ...Typography.caption,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
