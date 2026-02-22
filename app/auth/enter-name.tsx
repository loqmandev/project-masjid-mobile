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

export default function EnterNameScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session, isPending } = useSession();
  const params = useLocalSearchParams<{ returnTo?: string; suggestedName?: string; email?: string }>();
  const returnTo = useMemo(() => params.returnTo || '/(tabs)', [params.returnTo]);
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

        if (profileData.profile.leaderboardAlias) {
          track('profile_setup_existing');
          router.replace(returnTo as any);
          return;
        }
      } catch (error) {
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
  }, [identify, isPending, returnTo, screen, session?.user, track]);

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

    if (trimmedName.length > 20) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Name', 'Name must be 20 characters or less.');
      return;
    }

    // Haptic feedback for successful validation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsSaving(true);

    try {
      await updateUserProfile({ leaderboardAlias: trimmedName });
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
                maxLength={20}
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
                  {characterCount}/20
                </Text>
              </View>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                This name will be displayed on the leaderboard. You can choose to hide it in Settings.
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
