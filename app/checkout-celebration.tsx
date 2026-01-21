import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Confetti, ConfettiMethods } from 'react-native-fast-confetti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Colors, Spacing, Typography, gold, primary } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type CelebrationParams = {
  pointsEarned: string;
  basePoints: string;
  bonusPoints: string;
  isPrayerTime: string;
  isFirstVisit: string;
  masjidName: string;
};

// Animated counter component that counts up from 0 to target
function AnimatedPointsCounter({ targetPoints }: { targetPoints: number }) {
  const [displayPoints, setDisplayPoints] = useState(0);
  const scale = useSharedValue(1);

  // Animate the number counting up using JS timer
  useEffect(() => {
    const duration = 1500;
    const startDelay = 200;
    const startTime = Date.now() + startDelay;
    let animationFrame: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed < 0) {
        // Still in delay period
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentValue = Math.round(easedProgress * targetPoints);

      setDisplayPoints(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Animation complete - trigger scale pulse
        scale.value = withSequence(
          withSpring(1.15, { damping: 8 }),
          withSpring(1, { damping: 10 })
        );
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [targetPoints, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.pointsNumber, animatedStyle]}>
      +{displayPoints}
    </Animated.Text>
  );
}

// Animated emoji that scales in with delay
function AnimatedEmoji({
  emoji,
  delay,
  style,
}: {
  emoji: string;
  delay: number;
  style?: object;
}) {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(-15);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 8, stiffness: 150 })
    );
    rotation.value = withDelay(
      delay,
      withSequence(
        withTiming(15, { duration: 200 }),
        withTiming(-10, { duration: 150 }),
        withTiming(0, { duration: 100 })
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.Text style={[styles.celebrationEmoji, style, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

export default function CheckoutCelebrationScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<CelebrationParams>();
  const confettiRef = React.useRef<ConfettiMethods>(null);

  // Parse params
  const pointsEarned = parseInt(params.pointsEarned || '0', 10);
  const basePoints = parseInt(params.basePoints || '0', 10);
  const bonusPoints = parseInt(params.bonusPoints || '0', 10);
  const isPrayerTime = params.isPrayerTime === 'true';
  const isFirstVisit = params.isFirstVisit === 'true';
  const masjidName = params.masjidName || 'Masjid';

  // Animation values
  const containerScale = useSharedValue(0.8);
  const containerOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  // Trigger haptic and entrance animation on mount
  useEffect(() => {
    // Trigger haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Start entrance animations
    overlayOpacity.value = withTiming(1, { duration: 300 });
    containerOpacity.value = withTiming(1, { duration: 400 });
    containerScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Play confetti animation
    confettiRef.current?.restart();
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const handleContinue = () => {
    // Animate out then navigate to main page
    overlayOpacity.value = withTiming(0, { duration: 200 });
    containerOpacity.value = withTiming(0, { duration: 200 });
    containerScale.value = withTiming(0.9, { duration: 200 });

    setTimeout(() => {
      router.replace('/(tabs)');
    }, 250);
  };

  // Determine celebration message
  const getMessage = () => {
    if (pointsEarned >= 20) return 'AMAZING!';
    if (pointsEarned >= 15) return 'GREAT JOB!';
    return 'WELL DONE!';
  };

  // Determine subtitle message
  const getSubtitle = () => {
    if (isPrayerTime && isFirstVisit) {
      return 'Prayer time bonus + First visit!';
    }
    if (isPrayerTime) {
      return 'Prayer time bonus earned!';
    }
    if (isFirstVisit) {
      return 'First visit to this masjid!';
    }
    return 'Every visit counts!';
  };

  return (
    <View style={styles.container}>
      {/* Dark overlay */}
      <Animated.View
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }, overlayStyle]}
      />

      {/* Confetti animation */}
      <Confetti
        ref={confettiRef}
        count={150}
        fallDuration={4000}
        flakeSize={{ width: 12, height: 12 }}
        autoplay={false}
      />

      {/* Content */}
      <Animated.View
        style={[styles.content, { backgroundColor: colors.card }, containerStyle]}
      >
        {/* Main celebration text */}
        <Text style={[styles.celebrationTitle, { color: gold[500] }]}>
          {getMessage()}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {getSubtitle()}
        </Text>

        {/* Points counter */}
        <View style={styles.pointsContainer}>
          <AnimatedPointsCounter targetPoints={pointsEarned} />
          <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>
            points earned
          </Text>
        </View>

        {/* Points breakdown card */}
        <Card variant="outlined" padding="md" style={styles.breakdownCard}>
          <Text style={[styles.breakdownTitle, { color: colors.textSecondary }]}>
            POINTS BREAKDOWN
          </Text>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.text }]}>
              Base visit
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              {basePoints} pts
            </Text>
          </View>

          {bonusPoints > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                Bonus {isPrayerTime ? '(Prayer time)' : ''}{isFirstVisit ? '(First visit)' : ''}
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.success }]}>
                +{bonusPoints} pts
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, styles.totalLabel, { color: colors.text }]}>
              Total
            </Text>
            <Text style={[styles.breakdownValue, styles.totalValue, { color: primary[500] }]}>
              {pointsEarned} pts
            </Text>
          </View>
        </Card>

        {/* Masjid name */}
        <Text style={[styles.masjidName, { color: colors.textSecondary }]}>
          {masjidName}
        </Text>

        {/* Continue button */}
        <Button
          title="Continue"
          variant="gold"
          size="lg"
          onPress={handleContinue}
          style={styles.continueButton}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  celebrationEmoji: {
    fontSize: 40,
  },
  emojiLeft: {
    marginRight: Spacing.sm,
  },
  emojiCenter: {
    fontSize: 56,
  },
  emojiRight: {
    marginLeft: Spacing.sm,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pointsNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: primary[500],
  },
  pointsLabel: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  breakdownCard: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  breakdownTitle: {
    ...Typography.caption,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  breakdownLabel: {
    ...Typography.body,
  },
  breakdownValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontWeight: '700',
  },
  totalValue: {
    fontWeight: '700',
    fontSize: 18,
  },
  masjidName: {
    ...Typography.bodySmall,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  continueButton: {
    width: '100%',
  },
});
