import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography, primary, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    // TODO: Implement actual Google Sign In with Firebase
    // For now, simulate login and navigate to main app
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1500);
  };

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
            <Text style={[styles.appName, { color: colors.text }]}>Masjid Go</Text>
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
              title={loading ? 'Signing in...' : 'Continue with Google'}
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleGoogleSignIn}
              style={styles.googleButton}
              icon={
                !loading && (
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                )
              }
            />

            <Text style={[styles.termsText, { color: colors.textTertiary }]}>
              By continuing, you agree to our{' '}
              <Text style={{ color: colors.primary }}>Terms of Service</Text> and{' '}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Skip for Demo */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={[styles.skipText, { color: colors.textTertiary }]}>
              Skip for now (Demo mode)
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
  googleButton: {
    width: '100%',
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4',
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
