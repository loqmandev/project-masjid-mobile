import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { Colors, BorderRadius, Spacing, badges } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const variantStyles: Record<string, { bg: string; text: string }> = {
    default: { bg: colors.primaryLight, text: colors.primary },
    success: { bg: '#E8F5E9', text: colors.success },
    warning: { bg: '#FFF3E0', text: colors.warning },
    error: { bg: '#FFEBEE', text: colors.error },
    bronze: { bg: '#FBE9E7', text: badges.bronze },
    silver: { bg: '#ECEFF1', text: '#546E7A' },
    gold: { bg: '#FFF8E1', text: '#F57F17' },
    platinum: { bg: '#ECEFF1', text: '#37474F' },
    diamond: { bg: '#E0F7FA', text: '#00838F' },
  };

  const sizeStyles = {
    sm: {
      paddingVertical: 2,
      paddingHorizontal: Spacing.sm,
      fontSize: 10,
    },
    md: {
      paddingVertical: 4,
      paddingHorizontal: Spacing.sm + 2,
      fontSize: 12,
    },
  };

  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: currentVariant.bg,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: currentVariant.text,
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
