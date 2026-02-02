import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
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
import { useSession } from '@/lib/auth-client';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session, isPending } = useSession();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (hasTrackedView.current) return;
    screen('login');
    track('login_screen_viewed', { return_to: params.returnTo ?? '/(tabs)' });
    hasTrackedView.current = true;
  }, [params.returnTo, screen, track]);

  // Redirect if already authenticated
  useEffect(() => {
    if (session && !isPending) {
      const returnTo = params.returnTo || '/(tabs)';
      router.replace(`/auth/enter-name?returnTo=${encodeURIComponent(returnTo)}` as any);
    }
  }, [session, isPending, params.returnTo]);

  const handleSkip = () => {
    track('login_skipped', { return_to: params.returnTo ?? '/(tabs)' });
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  // Show loading while checking session
  if (isPending) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {/* Logo/Branding Section */}
          <View style={styles.brandSection}>
            <View style={[styles.logoContainer, { backgroundColor: primary[100] }]}>
              <Text style={styles.logoEmoji}>🕌</Text>
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>Jejak Masjid</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Explore • Visit • Earn Rewards
            </Text>
          </View>

          {/* Feature Highlights */}
          <View style={styles.featuresSection}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: primary[50] }]}>
                <Text style={styles.featureEmoji}>📍</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Discover Masjids
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Find masjids near you across Malaysia
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: primary[50] }]}>
                <Text style={styles.featureEmoji}>⭐</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Earn Points
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Check in during prayer times for 2x points
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: primary[50] }]}>
                <Text style={styles.featureEmoji}>🏆</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Unlock Achievements
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Become a Pengembara Legenda
                </Text>
              </View>
            </View>
          </View>

          {/* Sign In Section */}
          <View style={styles.signInSection}>
            <Button
              title="Continue with Email"
              variant="primary"
              size="lg"
              onPress={() => router.push('/auth/email')}
              style={styles.emailButton}
            />

            <Text style={[styles.termsText, { color: colors.textTertiary }]}>
              By continuing, you agree to our{' '}
              <Text style={{ color: colors.primary }}>Terms of Service</Text> and{' '}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Skip to browse without signing in */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={[styles.skipText, { color: colors.textTertiary }]}>
              Browse without signing in
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
  },
  featuresSection: {
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    ...Typography.bodySmall,
  },
  signInSection: {
    gap: Spacing.md,
  },
  emailButton: {
    width: '100%',
  },
  termsText: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipText: {
    ...Typography.bodySmall,
  },
});
