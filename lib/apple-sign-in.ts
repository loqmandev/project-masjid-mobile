/**
 * Apple Sign In Utility for iOS
 * Uses expo-apple-authentication for native Apple Sign In
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { authClient } from './auth-client';

export interface AppleSignInResult {
  success: boolean;
  error?: string;
  // User data from Apple (only provided on first sign-in)
  userData?: {
    email?: string;
    fullName?: {
      givenName?: string;
      familyName?: string;
    };
    user?: string; // Unique Apple user identifier
  };
}

/**
 * Check if Apple Sign In is available on this device
 * Uses Apple's isAvailableAsync for accurate detection
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Perform native Apple Sign In and exchange token with backend
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  try {
    const credential: AppleAuthentication.AppleAuthenticationCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Capture user data before sending to backend
    // Note: email and fullName are only provided on FIRST sign-in
    const userData = {
      email: credential.email ?? undefined,
      fullName: credential.fullName ? {
        givenName: credential.fullName.givenName ?? undefined,
        familyName: credential.fullName.familyName ?? undefined,
      } : undefined,
      user: credential.user,
    };

    // Send the token to backend for verification via better-auth
    // Using idToken instead of redirect for native iOS flow
    await authClient.signIn.social({
      provider: 'apple',
      idToken: {
        token: credential.identityToken!,
      },
    });

    return { success: true, userData };
  } catch (error: any) {
    if (error?.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, error: 'User cancelled' };
    }
    return { success: false, error: error?.message || 'Failed to sign in with Apple' };
  }
}
