import * as AppleAuthentication from 'expo-apple-authentication';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalytics } from '@/lib/analytics';
import { signInWithApple } from '@/lib/apple-sign-in';
import { useSession } from '@/lib/auth-client';
import { signInWithGoogle } from '@/lib/google-oauth';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session, isPending } = useSession();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    track('google_sign_in_attempted');
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setAuthError(result.error || 'Failed to sign in with Google');
        track('google_sign_in_failed', { error: result.error ?? 'Failed to sign in with Google' });
      } else {
        track('google_sign_in_success');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    track('apple_sign_in_attempted');
    try {
      const result = await signInWithApple();
      if (!result.success) {
        setAuthError(result.error || 'Failed to sign in with Apple');
        track('apple_sign_in_failed', { error: result.error ?? 'Failed to sign in with Apple' });
      } else {
        track('apple_sign_in_success', { hasUserData: !!result.userData });
        // If Apple provided user data, pass it to enter-name screen
        if (result.userData?.email || result.userData?.fullName) {
          const urlParams = new URLSearchParams();
          if (result.userData.email) {
            urlParams.set('email', result.userData.email);
          }
          if (result.userData.fullName) {
            const fullName = [
              result.userData.fullName.givenName,
              result.userData.fullName.familyName,
            ].filter(Boolean).join(' ');
            if (fullName) {
              urlParams.set('suggestedName', fullName);
            }
          }
          const queryString = urlParams.toString();
          router.replace(
            `/auth/enter-name?returnTo=${encodeURIComponent(params.returnTo || '/(tabs)')}${queryString ? '&' + queryString : ''}` as any
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (isPending) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Getting ready...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerBackButtonMenuEnabled: true }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {/* Logo/Branding Section */}
          <View style={styles.brandSection}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name="mosque" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>Jejak Masjid</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Explore • Visit • Earn Points
            </Text>
          </View>

          {/* Feature Highlights */}
          <View style={styles.featuresSection}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="mosque" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Discover Masjids
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Remember each masjid you visit
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="star" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Earn Points
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Check in and contribute for community
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="trophy" size={24} color={colors.primary} />
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
            {/* Google Sign In Button */}
            <Button
              title="Continue with Google"
              variant="outline"
              size="lg"
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              style={styles.socialButton}
            />

            {/* Apple Sign In Button - iOS only */}
            {(
              <AppleAuthentication.AppleAuthenticationButton
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
                cornerRadius={12}
              />
            )}

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                or
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Email Sign In Button */}
            <Button
              title="Continue with Email"
              variant="primary"
              size="lg"
              onPress={() => router.push('/auth/email')}
              disabled={isLoading}
              style={styles.emailButton}
            />

            {/* Error message */}
            {authError && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {authError}
              </Text>
            )}

            <Text style={[styles.termsText, { color: colors.textTertiary }]}>
              By continuing, you agree to our{' '}
              <Text style={{ color: colors.primary }}>Terms of Service</Text> and{' '}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </View>
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
    justifyContent: 'space-evenly',
    paddingVertical: Spacing.xxl,
  },
  brandSection: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(0, 169, 165, 0.2)',
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
  welcomeMessage: {
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  welcomeText: {
    ...Typography.body,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  socialButton: {
    width: '100%',
    minHeight: 50,
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.caption,
    marginHorizontal: Spacing.md,
  },
  emailButton: {
    width: '100%',
  },
  errorText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: Spacing.sm,
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
