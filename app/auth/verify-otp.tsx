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

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const params = useLocalSearchParams<{ email?: string; returnTo?: string }>();
  const { track } = useAnalytics();
  const { data: session, isPending } = useSession();
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));
  const previousOtp = useRef(Array(OTP_LENGTH).fill(''));

  const email = params.email || '';

  useEffect(() => {
    let timer: any;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

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

    track('otp_verify_attempted', { email });
    setLoading(true);
    Keyboard.dismiss();

    try {
      const result = await authClient.signIn.emailOtp({ email, otp: otpCode } as any);

      if (result.error) {
        track('otp_verify_failed', { reason: result.error.message ?? 'unknown' });
        Alert.alert('Verification Failed', result.error.message || 'Invalid verification code');
      } else {
        track('otp_verify_success', { email });
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

    track('otp_resend', { email });
    setLoading(true);

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' } as any);

      if (result.error) {
        Alert.alert('Failed', result.error.message || 'Unable to send OTP');
      } else {
        setCountdown(60);
        setCanResend(false);
        setOtp(Array(OTP_LENGTH).fill(''));
        Alert.alert('Success', 'A new verification code has been sent to your email');
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
});
