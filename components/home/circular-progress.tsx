import { Colors, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  level?: number;
  colorScheme?: 'light' | 'dark';
  showXP?: boolean;
  currentXP?: number;
  nextLevelXP?: number;
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  children,
  level,
  colorScheme = 'light',
  showXP = true,
  currentXP = 0,
  nextLevelXP = 100,
}: CircularProgressProps) {
  const colors = Colors[colorScheme];
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = withTiming(
      circumference - (progress / 100) * circumference,
      { duration: 1000 }
    );
    return { strokeDashoffset };
  }, [progress, circumference]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorScheme === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress circle */}
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFFFFF"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
          strokeDasharray={circumference}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.content}>
        {children || (
          <View style={styles.defaultContent}>
            {level !== undefined && (
              <Text style={styles.levelText}>Lvl {level}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

interface CircularProgressWithAvatarProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  initials: string;
  level?: number;
  colorScheme?: 'light' | 'dark';
  currentXP?: number;
  nextLevelXP?: number;
}

export function CircularProgressWithAvatar({
  progress,
  size = 120,
  strokeWidth = 8,
  initials,
  level,
  colorScheme = 'light',
  currentXP = 0,
  nextLevelXP = 100,
}: CircularProgressWithAvatarProps) {
  const avatarSize = size - strokeWidth * 4;

  return (
    <View style={styles.avatarContainer}>
      <CircularProgress
        progress={progress}
        size={size}
        strokeWidth={strokeWidth}
        colorScheme={colorScheme}
        level={level}
        currentXP={currentXP}
        nextLevelXP={nextLevelXP}
      >
        <View style={[styles.avatar, { width: avatarSize, height: avatarSize }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </CircularProgress>
      {level !== undefined && (
        <Text style={styles.levelBelowText}>Level {level}</Text>
      )}
      <Text style={styles.xpText}>
        {currentXP} / {nextLevelXP} pts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultContent: {
    alignItems: 'center',
  },
  levelText: {
    ...Typography.h2,
    color: '#fff',
    fontWeight: '700',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h1,
    color: '#fff',
    fontWeight: '700',
    fontSize: 32,
  },
  levelBelowText: {
    ...Typography.h3,
    color: '#fff',
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  xpText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
