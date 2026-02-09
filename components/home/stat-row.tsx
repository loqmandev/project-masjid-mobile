import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

type StatVariant = 'default' | 'primary' | 'gold' | 'streak';

interface StatRowProps {
  icon: string;
  value: number | string;
  label: string;
  variant?: StatVariant;
  colorScheme: 'light' | 'dark';
}

const ICON_SIZE = 20;

export function StatRow({ icon, value, label, variant = 'default', colorScheme }: StatRowProps) {
  const colors = Colors[colorScheme];

  const getIconColor = (): string => {
    switch (variant) {
      case 'gold':
        return colors.gold;
      case 'streak':
        return '#FF6B35';
      default:
        return 'rgba(255,255,255,0.9)';
    }
  };

  const iconColor = getIconColor();

  return (
    <View style={styles.row}>
      <IconSymbol name={icon} size={ICON_SIZE} color={iconColor} />
      <Text style={[styles.value, { color: '#fff' }]}>{value}</Text>
      <Text style={[styles.label, { color: 'rgba(255,255,255,0.85)' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  value: {
    ...Typography.body,
    fontWeight: '700',
    minWidth: 40,
  },
  label: {
    ...Typography.body,
    fontWeight: '500',
  },
});
