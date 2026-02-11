import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { badges, Spacing } from '@/constants/theme';

const TIER_COLORS: Record<string, string> = {
  bronze: badges.bronze,
  silver: badges.silver,
  gold: badges.gold,
  platinum: badges.platinum,
  diamond: badges.diamond,
};

interface AchievementGlowIconProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  size?: number;
  delay?: number;
}

export function AchievementGlowIcon({
  tier,
  size = 80,
  delay = 0,
}: AchievementGlowIconProps) {
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);
  const iconScale = useSharedValue(0);
  const shinePosition = useSharedValue(-100);

  const tierColor = TIER_COLORS[tier] || badges.bronze;

  useEffect(() => {
    // Icon scale-in animation
    iconScale.value = withSequence(
      withTiming(0, { duration: delay }),
      withSpring(1, { damping: 8, stiffness: 150 })
    );

    // Continuous glow pulse
    glowScale.value = withSequence(
      withTiming(0, { duration: delay }),
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Glow opacity pulse
    glowOpacity.value = withSequence(
      withTiming(0, { duration: delay }),
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Shine sweep effect
    shinePosition.value = withSequence(
      withTiming(0, { duration: delay + 300 }),
      withSequence(
        withTiming(size + 100, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(-100, { duration: 0 })
      )
    );
  }, [delay, size]);

  const glowStyle = useAnimatedStyle(() => ({
    width: size * 1.5,
    height: size * 1.5,
    borderRadius: (size * 1.5) / 2,
    backgroundColor: tierColor,
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: tierColor,
    transform: [{ scale: iconScale.value }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: shinePosition.value,
    width: 40,
    height: size,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ rotate: '25deg' }],
    borderRadius: 20,
  }));

  return (
    <View style={[styles.container, { width: size * 1.5, height: size * 1.5 }]}>
      {/* Outer glow ring */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Main icon container */}
      <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
        {/* Trophy emoji/icon */}
        <Animated.Text style={styles.trophyIcon}>🏆</Animated.Text>

        {/* Shine sweep effect */}
        <Animated.View style={shineStyle} pointerEvents="none" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    blurRadius: 20,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  trophyIcon: {
    fontSize: 40,
    textAlign: 'center',
    lineHeight: 80,
  },
});
