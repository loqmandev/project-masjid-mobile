import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Colors, BorderRadius, Spacing, primary, gold } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  variant?: 'primary' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function ProgressBar({
  progress,
  showLabel = false,
  variant = 'primary',
  size = 'md',
  label,
}: ProgressBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const clampedProgress = Math.min(100, Math.max(0, progress));

  const sizeStyles = {
    sm: { height: 4 },
    md: { height: 8 },
    lg: { height: 12 },
  };

  const variantColors = {
    primary: {
      background: colors.primaryLight,
      fill: colors.primary,
    },
    gold: {
      background: gold[100],
      fill: gold[500],
    },
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${clampedProgress}%`, {
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    };
  });

  return (
    <View style={styles.container}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {label}
            </Text>
          )}
          {showLabel && (
            <Text style={[styles.percentage, { color: colors.text }]}>
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.track,
          sizeStyles[size],
          { backgroundColor: variantColors[variant].background },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            sizeStyles[size],
            { backgroundColor: variantColors[variant].fill },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BorderRadius.full,
  },
});
