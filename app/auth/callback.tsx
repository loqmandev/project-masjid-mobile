/**
 * OAuth Callback Screen
 * Handles OAuth redirects from Google and Apple Sign In
 * The better-auth expo plugin handles token exchange automatically
 */

import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuthCallbackScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  useEffect(() => {
    // The better-auth expo plugin handles the token exchange
    // This screen is just for loading/transition
    const timer = setTimeout(() => {
      // Navigate to the name setup screen after successful OAuth
      router.replace('/auth/enter-name');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

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
