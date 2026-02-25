/**
 * OAuth Callback Screen
 * Handles OAuth redirects from Google Sign In
 * The better-auth expo plugin handles token exchange automatically
 *
 * For OAuth users, we auto-create the profile here and redirect directly to the app,
 * bypassing the enter-name screen (which is only for email login).
 */

import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalytics } from '@/lib/analytics';
import { getSession } from '@/lib/auth-client';
import { updateUserProfile } from '@/lib/api';
import { clearCachedUserProfile } from '@/lib/storage';

// Maximum time to wait for session (5 seconds) and polling interval (200ms)
const MAX_POLL_ATTEMPTS = 25;
const POLL_INTERVAL_MS = 200;

type PollState = 'polling' | 'success' | 'failed' | 'timeout';

// Maximum leaderboard alias length (must match the one in enter-name.tsx)
const MAX_NAME_LENGTH = 20;

/**
 * Generates a unique name for OAuth users when no name is provided.
 * Priority order:
 * 1. Email prefix (e.g., "ahmad" from "ahmad@gmail.com")
 * 2. Unique guest name with random suffix (e.g., "Google1234")
 */
function generateUniqueName(email: string | undefined, provider: 'apple' | 'google'): string {
  // Try to extract name from email prefix
  if (email) {
    const emailPrefix = email.split('@')[0];
    // Clean up the prefix: remove numbers, dots, underscores, special chars
    const cleanPrefix = emailPrefix
      .replace(/[^a-zA-Z]/g, '')
      .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter

    if (cleanPrefix.length >= 2 && cleanPrefix.length <= MAX_NAME_LENGTH) {
      return cleanPrefix;
    }

    // If prefix is too short, append random digits
    if (cleanPrefix.length > 0) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const combined = `${cleanPrefix}${randomSuffix}`;
      return combined.length > MAX_NAME_LENGTH
        ? combined.substring(0, MAX_NAME_LENGTH)
        : combined;
    }
  }

  // Fallback: Generate unique guest name with random suffix
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const providerPrefix = provider === 'apple' ? 'Apple' : 'Google';
  const uniqueName = `${providerPrefix}${randomId}`;

  return uniqueName.length > MAX_NAME_LENGTH
    ? uniqueName.substring(0, MAX_NAME_LENGTH)
    : uniqueName;
}

export default function AuthCallbackScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { track } = useAnalytics();
  const [pollState, setPollState] = useState<PollState>('polling');

  useEffect(() => {
    let isActive = true;

    /**
     * Poll for session availability with a maximum timeout.
     * Returns the user data if session is found, null otherwise
     */
    const pollForSession = async (attempts = 0): Promise<{ name?: string; email?: string } | null> => {
      const sessionData = await getSession();

      // better-auth's getSession can return different shapes:
      // 1. Direct session object with .user property (from useSession hook)
      // 2. Data wrapper with .data property containing session
      // 3. Error object
      type UserType = { name?: string | null; email?: string | null; image?: string | null; id: string };
      let user: UserType | null = null;

      if (sessionData) {
        // Case 1: Direct session object (session.user exists)
        if ('user' in sessionData && sessionData.user) {
          user = sessionData.user as UserType;
        }
        // Case 2: Data wrapper (session.data.user exists)
        else if ('data' in sessionData && sessionData.data?.user) {
          user = sessionData.data.user as UserType;
        }
      }

      if (user) {
        return {
          name: user.name ?? undefined,
          email: user.email ?? undefined,
        };
      }

      if (attempts >= MAX_POLL_ATTEMPTS) {
        return null;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      return pollForSession(attempts + 1);
    };

    const completeOAuthSignIn = async () => {
      try {
        const userData = await pollForSession();

        if (!isActive) return;

        if (!userData) {
          // Session polling timed out - user likely cancelled or auth failed
          setPollState('timeout');
          return;
        }

        // Generate name for the user (use provided name or generate unique one)
        let oauthName = userData.name?.trim() || '';

        if (!oauthName || oauthName.length < 2) {
          oauthName = generateUniqueName(userData.email, 'google');
        }

        // Truncate to max length if needed
        if (oauthName.length > MAX_NAME_LENGTH) {
          oauthName = oauthName.substring(0, MAX_NAME_LENGTH);
        }

        console.log('[OAuth Callback] Creating profile for user:', {
          email: userData.email,
          name: userData.name,
          generatedName: oauthName,
        });

        // Create the user profile
        try {
          await updateUserProfile({ name: oauthName });
          clearCachedUserProfile();
          track('profile_setup_auto_oauth', { provider: 'google', generated: !userData.name });
          console.log('[OAuth Callback] Profile created successfully, redirecting to app');
        } catch (profileError) {
          // If profile creation fails due to auth, treat as timeout
          if (profileError instanceof Error && profileError.message.includes('sign in')) {
            console.error('[OAuth Callback] Auth error during profile creation:', profileError);
            setPollState('timeout');
            return;
          }
          // For other errors, log but continue - user can set up profile later
          console.warn('[OAuth Callback] Profile creation failed, continuing anyway:', profileError);
        }

        setPollState('success');

        // Redirect directly to the app, bypassing enter-name screen
        router.replace('/(tabs)');
      } catch (error) {
        if (isActive) {
          console.error('[OAuth Callback] Error:', error);
          setPollState('failed');
        }
      }
    };

    completeOAuthSignIn();

    return () => {
      isActive = false;
    };
  }, [router, track]);

  const handleRetry = () => {
    router.replace('/auth/login');
  };

  // Show error state if polling failed or timed out
  if (pollState === 'timeout' || pollState === 'failed') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.error + '15', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: 32, color: colors.error }}>⚠️</Text>
            </View>
            <Text style={[Typography.h3, { color: colors.text, marginBottom: Spacing.sm, textAlign: 'center' }]}>
              Sign In Failed
            </Text>
            <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }]}>
              {pollState === 'timeout'
                ? 'Could not complete sign in. The process timed out or was cancelled.'
                : 'An error occurred during sign in. Please try again.'}
            </Text>
            <Button
              title="Try Again"
              variant="primary"
              size="lg"
              onPress={handleRetry}
              style={{ width: '100%' }}
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: colors.textSecondary }}>
            Signing you in...
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
