import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Confetti, ConfettiMethods } from 'react-native-fast-confetti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { AchievementGlowIcon } from '@/components/achievement/achievement-glow-icon';
import { Badge } from '@/components/ui/badge';
import { Colors, Spacing, Typography, gold } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { AchievementDefinition } from '@/lib/api';

interface AchievementUnlockModalProps {
  achievements: AchievementDefinition[];
  visible: boolean;
  onClose: () => void;
}

function getTierBadgeVariant(
  tier: string
): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
  const tierMap: Record<string, 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'> = {
    bronze: 'bronze',
    silver: 'silver',
    gold: 'gold',
    platinum: 'platinum',
    diamond: 'diamond',
  };
  return tierMap[tier.toLowerCase()] || 'bronze';
}

function AchievementCard({
  achievement,
  index,
  colorScheme,
}: {
  achievement: AchievementDefinition;
  index: number;
  colorScheme: 'light' | 'dark' | null;
}) {
  const colors = Colors[colorScheme ?? 'light'];
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 150;
    cardOpacity.value = withSequence(withTiming(0, { duration: delay }), withTiming(1, { duration: 400 }));
    cardScale.value = withSequence(withTiming(0, { duration: delay }), withSpring(1, { damping: 10, stiffness: 100 }));
  }, [index]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.achievementCard,
        { backgroundColor: colors.card },
        cardStyle,
      ]}
    >
      {/* Icon container with glow */}
      <View style={styles.iconContainer}>
        <AchievementGlowIcon tier={achievement.badgeTier} size={64} delay={index * 150} />
      </View>

      {/* Achievement unlocked title */}
      <Text style={[styles.unlockTitle, { color: gold[500] }]}>
        ACHIEVEMENT UNLOCKED!
      </Text>

      {/* Achievement name */}
      <Text style={[styles.achievementName, { color: colors.text }]}>
        {achievement.name}
      </Text>

      {/* Tier badge */}
      <Badge
        label={achievement.badgeTier.charAt(0).toUpperCase() + achievement.badgeTier.slice(1)}
        variant={getTierBadgeVariant(achievement.badgeTier)}
        size="sm"
        style={styles.tierBadge}
      />

      {/* Description */}
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {achievement.description}
      </Text>

      {/* Bonus points */}
      {achievement.bonusPoints > 0 && (
        <View style={[styles.bonusContainer, { backgroundColor: gold[500] + '15' }]}>
          <Text style={styles.bonusEmoji}>✨</Text>
          <Text style={[styles.bonusText, { color: gold[500] }]}>
            +{achievement.bonusPoints} bonus points
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

export function AchievementUnlockModal({
  achievements,
  visible,
  onClose,
}: AchievementUnlockModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const confettiRef = useRef<ConfettiMethods>(null);

  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && achievements.length > 0) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate in
      overlayOpacity.value = withTiming(1, { duration: 300 });
      contentOpacity.value = withTiming(1, { duration: 400 });
      contentScale.value = withSpring(1, { damping: 12, stiffness: 100 });

      // Play confetti
      confettiRef.current?.restart();
    } else if (!visible) {
      // Reset animations for next time
      overlayOpacity.value = 0;
      contentOpacity.value = 0;
      contentScale.value = 0.8;
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: visible ? 'auto' : 'none',
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Animate out
    overlayOpacity.value = withTiming(0, { duration: 200 });
    contentOpacity.value = withTiming(0, { duration: 200 });
    contentScale.value = withTiming(0.9, { duration: 200 });

    // Call onClose after animation
    setTimeout(() => {
      onClose();
    }, 250);
  };

  if (!visible || achievements.length === 0) {
    return (
      <Animated.View style={[styles.overlay, overlayStyle]} />
    );
  }

  const isMultiple = achievements.length > 1;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor:
            colorScheme === 'dark'
              ? 'rgba(0,0,0,0.9)'
              : 'rgba(0,0,0,0.8)',
        },
        overlayStyle,
      ]}
      accessible={true}
      accessibilityLabel="Achievement unlocked"
      accessibilityRole="alert"
    >
      {/* Confetti */}
      <Confetti
        ref={confettiRef}
        count={200}
        fallDuration={5000}
        flakeSize={{ width: 10, height: 10 }}
        autoplay={false}
      />

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Celebration message for multiple achievements */}
        {isMultiple && (
          <Text style={[styles.multiTitle, { color: gold[500] }]}>
            AMAZING PROGRESS!
          </Text>
        )}

        {/* Scrollable cards */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isMultiple}
        >
          {achievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              index={index}
              colorScheme={colorScheme}
            />
          ))}
        </ScrollView>

        {/* Continue button */}
        <Button
          title={isMultiple ? 'Continue' : 'Awesome!'}
          variant="gold"
          size="lg"
          onPress={handleClose}
          style={styles.continueButton}
          accessibilityLabel="Close achievement celebration"
          accessibilityRole="button"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    width: '90%',
    maxWidth: 380,
    maxHeight: '80%',
    alignItems: 'center',
  },
  multiTitle: {
    ...Typography.h2,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  scrollView: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingVertical: Spacing.sm,
  },
  achievementCard: {
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  unlockTitle: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  achievementName: {
    ...Typography.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  tierBadge: {
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  bonusEmoji: {
    fontSize: 16,
  },
  bonusText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
  },
});
