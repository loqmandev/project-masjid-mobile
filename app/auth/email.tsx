import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalytics } from '@/lib/analytics';
import { authClient } from '@/lib/auth-client';

export default function EmailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const { track } = useAnalytics();

  const handleContinue = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    track('email_submitted', { email });
    setLoading(true);

    try {

      const result = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: 'sign-in' } as any);

      if (result.error) {
        track('email_otp_send_failed', { reason: result.error.message ?? 'unknown' });
        Alert.alert('Failed', result.error.message || 'Unable to send verification code');
      } else {
        track('email_otp_sent', { email });
        router.push({
          pathname: '/auth/verify-otp',
          params: { email: email.trim(), returnTo: params.returnTo || '/(tabs)' },
        });
      }
    } catch (error) {
      track('email_otp_send_failed', { reason: 'exception' });
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Enter your email</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                We&apos;ll send you a verification code to sign in
              </Text>
            </View>

            <View style={styles.form}>
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <Button
                title={loading ? 'Sending...' : 'Continue'}
                variant="primary"
                size="lg"
                loading={loading}
                onPress={handleContinue}
                style={styles.continueButton}
              />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  backButton: {
    paddingVertical: Spacing.sm,
    width: 40,
  },
  backButtonText: {
    fontSize: 32,
    fontWeight: '300',
  },
  header: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: 'transparent',
  },
  input: {
    ...Typography.body,
    padding: 0,
  },
  continueButton: {
    width: '100%',
  },
});
