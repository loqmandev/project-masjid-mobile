import { router, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUserProfile, updateUserProfile } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { clearCachedUserProfile } from '@/lib/storage';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session } = useSession();

  const [leaderboardAlias, setLeaderboardAlias] = useState('');
  const [originalAlias, setOriginalAlias] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current profile data
  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const profileData = await getUserProfile();
        const alias = profileData.profile.leaderboardAlias || profileData.user.name || '';
        setLeaderboardAlias(alias);
        setOriginalAlias(alias);
        setError(null);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [session?.user]);

  const hasChanges = leaderboardAlias.trim() !== originalAlias;

  const handleSave = async () => {
    const trimmedAlias = leaderboardAlias.trim();

    if (!trimmedAlias) {
      Alert.alert('Invalid Name', 'Please enter a display name.');
      return;
    }

    if (trimmedAlias.length < 2) {
      Alert.alert('Invalid Name', 'Display name must be at least 2 characters.');
      return;
    }

    if (trimmedAlias.length > 30) {
      Alert.alert('Invalid Name', 'Display name must be 30 characters or less.');
      return;
    }

    setIsSaving(true);

    try {
      await updateUserProfile({ leaderboardAlias: trimmedAlias });
      // Clear the cached profile so it refreshes with new data
      clearCachedUserProfile();
      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('Failed to update profile:', err);
      Alert.alert(
        'Update Failed',
        err instanceof Error ? err.message : 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Profile', headerBackTitle: 'Back' }} />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={['bottom']}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading profile...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Profile', headerBackTitle: 'Back' }} />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={['bottom']}
        >
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Profile', headerBackTitle: 'Back' }} />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Card variant="outlined" padding="md" style={styles.card}>
              <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                This name will be shown on the leaderboard and your profile.
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={leaderboardAlias}
                onChangeText={setLeaderboardAlias}
                placeholder="Enter your display name"
                placeholderTextColor={colors.textTertiary}
                maxLength={30}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                {leaderboardAlias.length}/30
              </Text>
            </Card>

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: hasChanges ? colors.primary : colors.border },
              ]}
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: hasChanges ? '#FFFFFF' : colors.textTertiary },
                  ]}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#fff',
    ...Typography.button,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  charCount: {
    ...Typography.caption,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  saveButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonText: {
    ...Typography.button,
    fontWeight: '600',
  },
});
