import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = useMemo(() => params.returnTo || '/(tabs)', [params.returnTo]);
  const { track, identify, screen } = useAnalytics();
  const hasTrackedView = useRef(false);
  const hasIdentified = useRef(false);

  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!hasTrackedView.current) {
      screen('profile_setup');
      track('profile_setup_viewed');
      hasTrackedView.current = true;
    }

    const userId = session?.user?.id ?? session?.user?.email;

    if (!session?.user) {
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

        setName(profileData.user.name || session.user?.name || '');
      } catch (error) {
        if (isActive) {
          setName(session.user?.name || '');
        }
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
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Please enter your name.');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters.');
      return;
    }

    if (trimmedName.length > 30) {
      Alert.alert('Invalid Name', 'Name must be 30 characters or less.');
      return;
    }

    setIsSaving(true);

    try {
      await updateUserProfile({ leaderboardAlias: trimmedName });
      clearCachedUserProfile();
      track('profile_setup_completed');
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
          <View style={styles.content}>
            <Text style={[styles.heading, { color: colors.text }]}>Enter you name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              maxLength={30}
            />
            <Button
              title={isSaving ? 'Saving...' : 'Continue'}
              variant="primary"
              size="lg"
              loading={isSaving}
              onPress={handleContinue}
              style={styles.button}
            />
          </View>
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
    paddingVertical: Spacing.sm,
  },
  button: {
    width: '100%',
  },
});
