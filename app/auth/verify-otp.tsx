import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
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
import { authClient, useSession } from '@/lib/auth-client';
import { isDemoEmail } from '@/lib/demo-mode';
import { API_BASE_URL } from '@/constants/api';

const OTP_LENGTH = 6;

interface DemoOtpResponse {
  email: string;
  otp: string;
  expiresIn: number;
}

export default function VerifyOTPScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const params = useLocalSearchParams<{ email?: string; returnTo?: string }>();
  const { track } = useAnalytics();
  const { data: session, isPending } = useSession();
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));
  const previousOtp = useRef(Array(OTP_LENGTH).fill(''));

  const email = params.email || '';
  const isDemo = isDemoEmail(email);

  useEffect(() => {
    let timer: any;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  // Fetch demo OTP for demo accounts
  useEffect(() => {
    if (isDemo && email) {
      fetchDemoOtp();
    }
  }, [email, isDemo]);

  useEffect(() => {
    if (session && !isPending) {
      const returnTo = params.returnTo || '/(tabs)';
      router.replace(`/auth/enter-name?returnTo=${encodeURIComponent(returnTo)}` as any);
    }
  }, [session, isPending, params.returnTo]);

  const handleOTPChange = (index: number, value: string) => {
    if (value.length >1) {
      const newOtp = [...otp];
      for (let i = 0; i < value.length && i < OTP_LENGTH; i++) {
        newOtp[i] = value[i];
      }
      setOtp(newOtp);
      previousOtp.current = newOtp;

      const lastFilledIndex = Math.min(value.length, OTP_LENGTH) -1;
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      const previousValue = previousOtp.current[index];
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      previousOtp.current = newOtp;

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (!value && previousValue && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert('Incomplete Code', 'Please enter complete 6-digit code');
      return;
    }

    track('otp_verify_attempted', { email, isDemo: isDemoEmail(email) });
    setLoading(true);
    Keyboard.dismiss();

    try {
      // Use standard Better Auth endpoint for both demo and normal users
      // Backend middleware handles demo account by pre-seeding OTP
      const result = await authClient.signIn.emailOtp({
        email,
        otp: otpCode,
      } as any);

      if (result.error) {
        track('otp_verify_failed', {
          reason: result.error.message ?? 'unknown',
          isDemo: isDemoEmail(email)
        });
        Alert.alert('Verification Failed', result.error.message || 'Invalid verification code');
      } else {
        // Success - backend will set X-Demo-Mode header for demo users
        track('otp_verify_success', { email, isDemo: isDemoEmail(email) });
      }
    } catch (error) {
      track('otp_verify_failed', { reason: 'exception' });
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    track('otp_resend', { email, isDemo });
    setLoading(true);

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' } as any);

      if (result.error) {
        Alert.alert('Failed', result.error.message || 'Unable to send OTP');
      } else {
        setCountdown(60);
        setCanResend(false);
        setOtp(Array(OTP_LENGTH).fill(''));
        // Fetch new demo OTP for demo accounts
        if (isDemo) {
          await fetchDemoOtp();
        }
        if (isDemo) {
          Alert.alert('Success', 'New verification code generated');
        } else {
          Alert.alert('Success', 'A new verification code has been sent to your email');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const fetchDemoOtp = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/demo-otp?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data: DemoOtpResponse = await response.json();
        setDemoOtp(data.otp);
      }
    } catch {
      // Silent fail - demo endpoint might not be available
    }
  };

  const handleAutoFill = () => {
    if (demoOtp && demoOtp.length === OTP_LENGTH) {
      const newOtp = demoOtp.split('');
      setOtp(newOtp);
      previousOtp.current = newOtp;
      // Focus the last input
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.text }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Enter verification code</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We sent a 6-digit code to{' '}
            <Text style={{ color: colors.primary }}>{email}</Text>
          </Text>
          {isDemo && demoOtp && (
            <View style={[styles.demoBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.demoBadgeText, { color: colors.primary }]}>
                Demo OTP: {demoOtp}
              </Text>
              <TouchableOpacity
                onPress={handleAutoFill}
                style={[styles.autoFillButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.autoFillButtonText, { color: '#fff' }]}>
                  Auto-fill
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpInput,
                {
                  borderColor: digit ? colors.primary : colors.border,
                  backgroundColor: colors.background,
                  color: colors.primary
                },
              ]}
              value={digit}
              onChangeText={(value) => handleOTPChange(index, value)}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              textAlign="center"
              selectTextOnFocus
              contextMenuHidden
            />
          ))}
        </View>

        <Button
          title={loading ? 'Verifying...' : 'Verify'}
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleVerify}
          style={styles.verifyButton}
        />

        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: colors.textSecondary }]}>
            Didn&apos;t receive code?
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend || loading}
            style={styles.resendButton}
          >
            <Text
              style={[
                styles.resendButtonText,
                {
                  color: canResend ? colors.primary : colors.textTertiary,
                },
              ]}
            >
              {canResend ? 'Resend' : `Resend in ${countdown}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: Spacing.xl * 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl * 2,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
  },
  verifyButton: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  resendText: {
    ...Typography.body,
  },
  resendButton: {
    paddingVertical: Spacing.xs,
  },
  resendButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  demoBadgeText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    flex: 1,
  },
  autoFillButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  autoFillButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
