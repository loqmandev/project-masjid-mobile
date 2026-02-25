import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/ui/button';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalytics } from '@/lib/analytics';
import { getUserProfile, updateUserProfile } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { clearCachedUserProfile } from '@/lib/storage';
import { getDisplayName } from '@/lib/utils';

type EnterNameParams = {
  returnTo?: string;
  suggestedName?: string;
  email?: string;
  provider?: 'apple' | 'google';
};

/**
 * Maximum name length.
 * This constraint balances:
 * - UI display (leaderboard columns)
 * - Readability on mobile screens
 * - Storage efficiency
 */
const MAX_NAME_LENGTH = 20;

export default function EnterNameScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session, isPending } = useSession();
  const params = useLocalSearchParams<EnterNameParams>();
  const returnTo = useMemo(() => params.returnTo || '/(tabs)', [params.returnTo]);

  // Extract OAuth params to stable refs for useEffect dependency
  const oauthProvider = useMemo(() => params.provider, [params.provider]);
  const suggestedName = useMemo(() => params.suggestedName, [params.suggestedName]);
  const emailParam = useMemo(() => params.email, [params.email]);

  const { track, identify, screen } = useAnalytics();
  const hasTrackedView = useRef(false);
  const hasIdentified = useRef(false);

  const inputValue = useRef('');
  const [characterCount, setCharacterCount] = useState(0);
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (!hasTrackedView.current) {
      screen('profile_setup');
      track('profile_setup_viewed');
      hasTrackedView.current = true;
    }

    const userId = session?.user?.id ?? session?.user?.email;

    if (!session || !session?.user) {
      router.replace('/auth/login');
      return;
    }

    if (!hasIdentified.current && userId) {
      identify(userId, {
        email: session.user.email,
        name: session.user.name,
      });
      track('login_success', { return_to: returnTo });
      hasIdentified.current = true;
    }

    if (isPending) {
      return;
    }

    

    let isActive = true;

    async function loadProfile() {
      try {
        const profileData = await getUserProfile();
        if (!isActive) {
          return;
        }

        // Check if user already has a name set (from OAuth or previous setup)
        if (profileData.user.name) {
          track('profile_setup_existing');
          router.replace(returnTo as any);
          return;
        }

        // OAuth flow: auto-save with suggested name or generated unique name and skip the screen
        if (oauthProvider === 'apple' || oauthProvider === 'google') {
          let oauthName = suggestedName?.trim() || '';

          // If no name provided, generate a unique name
          // This prevents all users from showing as "Apple User" on leaderboard
          if (!oauthName || oauthName.length < 2) {
            const userEmail = typeof emailParam === 'string' ? emailParam : session?.user?.email;
            oauthName = getDisplayName(null, userEmail);
          }

          // Truncate to max length if needed
          if (oauthName.length > MAX_NAME_LENGTH) {
            oauthName = oauthName.substring(0, MAX_NAME_LENGTH);
          }

          console.log('[OAuth Auto-save] Attempting to save profile:', {
            provider: oauthProvider,
            suggestedName,
            oauthName,
            returnTo
          });

          try {
            await updateUserProfile({ name: oauthName });
            clearCachedUserProfile();
            track('profile_setup_auto_oauth', { provider: oauthProvider, generated: !suggestedName });
            console.log('[OAuth Auto-save] Success! Redirecting to:', returnTo);
            // Clear loading state before redirect to prevent race conditions
            if (isActive) {
              setIsChecking(false);
            }
            router.replace(returnTo as any);
            return;
          } catch (error) {
            console.warn('Auto-save failed, showing manual entry:', error);
            // Check if this is an authentication error (401)
            if (error instanceof Error && error.message.includes('sign in')) {
              track('profile_setup_auth_failed', { provider: oauthProvider });
              // Session not properly established - redirect to login
              if (isActive) {
                router.replace('/auth/login');
              }
              return;
            }
            // Fall through to manual entry for other errors
          }
        }
      } catch (error) {
        // Check if this is an authentication error
        if (error instanceof Error && error.message.includes('sign in')) {
          track('profile_setup_auth_failed', { provider: oauthProvider ?? 'unknown' });
          // Session not properly established - redirect to login
          if (isActive) {
            router.replace('/auth/login');
          }
          return;
        }
        // Silently handle other profile loading errors - fall through to manual entry
      } finally {
        if (isActive) {
          setIsChecking(false);
        }
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [emailParam, identify, isPending, oauthProvider, returnTo, screen, session, suggestedName, track]);

  const handleContinue = async () => {
    const trimmedName = inputValue.current.trim();

    if (!trimmedName) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Name', 'Please enter your name.');
      return;
    }

    if (trimmedName.length < 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Name', 'Name must be at least 2 characters.');
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Name', `Name must be ${MAX_NAME_LENGTH} characters or less.`);
      return;
    }

    // Haptic feedback for successful validation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsSaving(true);

    try {
      await updateUserProfile({ name: trimmedName });
      clearCachedUserProfile();
      track('profile_setup_completed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(returnTo as any);
    } catch (error) {
      track('profile_setup_failed', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
      Alert.alert(
        'Update Failed',
        error instanceof Error ? error.message : 'Failed to update name. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isChecking || isPending) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Preparing your profile...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.content} onPress={() => TextInput.State.focusTextInput?.()}>
            <Text style={[styles.heading, { color: colors.text }]}>Enter your name</Text>
            <View>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: isInputFocused ? colors.primary : colors.border,
                    color: colors.text,
                  },
                ]}
                defaultValue=""
                onChangeText={(text) => {
                  inputValue.current = text;
                  setCharacterCount(text.length);
                }}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                maxLength={MAX_NAME_LENGTH}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                accessibilityLabel="Name input"
                accessibilityHint="Enter the name you want displayed on the leaderboard"
                accessibilityRole="text"
                importantForAutofill="yes"
                textContentType="name"
              />
              <View style={styles.characterCounterContainer}>
                <Text style={[styles.characterCounter, { color: colors.textTertiary }]}>
                  {characterCount}/{MAX_NAME_LENGTH}
                </Text>
              </View>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                This name will be displayed on the leaderboard. You can change or hide it later in Settings.
              </Text>
            </View>
            <Button
              title={isSaving ? 'Saving...' : 'Continue'}
              variant="primary"
              size="lg"
              loading={isSaving}
              onPress={handleContinue}
              style={styles.button}
              accessibilityLabel="Continue to app"
              accessibilityHint="Save your name and continue to the home screen"
            />
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  heading: {
    ...Typography.h2,
    textAlign: 'center',
  },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48, // Minimum touch target for Android (48dp) / iOS (44pt)
  },
  characterCounterContainer: {
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  characterCounter: {
    ...Typography.caption,
  },
  hintText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  button: {
    width: '100%',
  },
});
