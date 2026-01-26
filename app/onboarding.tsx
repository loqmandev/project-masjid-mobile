import { router, Stack } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Colors, primary, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalytics } from '@/lib/analytics';
import { loadOnboardingCompleted, saveOnboardingCompleted } from '@/lib/storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Welcome to Jejak Masjid',
    description: 'Discover masjids near you and keep track of your visits.',
    emoji: '🕌',
  },
  {
    title: 'Check In & Earn',
    description: 'Check in during prayer times for bonus points.',
    emoji: '⭐',
  },
  {
    title: 'Climb the Ranks',
    description: 'Unlock achievements and become a Pengembara Legenda.',
    emoji: '🏆',
  },
];

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { track, screen } = useAnalytics();
  const hasTrackedStart = useRef(false);

  useEffect(() => {
    if (loadOnboardingCompleted()) {
      router.replace('/(tabs)');
    }
  }, []);

  useEffect(() => {
    if (hasTrackedStart.current) return;
    screen('onboarding');
    track('onboarding_started');
    hasTrackedStart.current = true;
  }, [screen, track]);

  const handleComplete = (reason: 'finished' | 'skipped') => {
    saveOnboardingCompleted();
    track('onboarding_completed', { reason });
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (currentIndex === SLIDES.length - 1) {
      handleComplete('finished');
      return;
    }

    scrollRef.current?.scrollTo({
      x: width * (currentIndex + 1),
      animated: true,
    });
  };

  const dots = useMemo(
    () =>
      SLIDES.map((_, index) => (
        <View
          key={`dot-${index}`}
          style={[
            styles.dot,
            {
              backgroundColor:
                index === currentIndex ? colors.primary : colors.border,
              width: index === currentIndex ? 20 : 8,
            },
          ]}
        />
      )),
    [colors.border, colors.primary, currentIndex]
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={styles.topBar}>
          <Text style={[styles.brand, { color: colors.text }]}>Jejak Masjid</Text>
          <TouchableOpacity onPress={() => handleComplete('skipped')} accessibilityRole="button">
            <Text style={[styles.skipText, { color: colors.textTertiary }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
            track('onboarding_slide_changed', { index });
          }}
          contentContainerStyle={styles.scrollContent}
        >
          {SLIDES.map((slide, index) => (
            <View
              key={slide.title}
              style={[styles.slide, { width }]}
            >
              <View style={[styles.emojiCircle, { backgroundColor: primary[50] }]}> 
                <Text style={styles.emoji}>{slide.emoji}</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}> 
                {slide.description}
              </Text>
              {index === 0 && (
                <View style={styles.hintPill}>
                  <Text style={[styles.hintText, { color: colors.primary }]}>Swipe to explore</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots}>{dots}</View>
          <Button
            title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            variant="primary"
            size="lg"
            onPress={handleNext}
            style={styles.primaryButton}
          />
          <TouchableOpacity
            onPress={() => handleComplete('skipped')}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryAction, { color: colors.textSecondary }]}> 
              {currentIndex === SLIDES.length - 1 ? 'Continue to app' : 'Skip for now'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  brand: {
    ...Typography.body,
    fontWeight: '600',
  },
  skipText: {
    ...Typography.bodySmall,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  hintPill: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    backgroundColor: primary[100],
  },
  hintText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryAction: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
});
