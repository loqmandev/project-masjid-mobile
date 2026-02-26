/**
 * Google OAuth Utility
 * Handles Google Sign In flow using better-auth OAuth
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { authClient } from './auth-client';

// Ensure WebBrowser is configured for auth sessions
WebBrowser.maybeCompleteAuthSession();

// Configure redirect URI for deep linking
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'jejakmasjidmobile',
  path: 'auth/callback',
});

export interface GoogleSignInResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email?: string;
    name?: string;
    emailVerified: boolean;
  };
}

/**
 * Perform Google Sign In using better-auth OAuth flow
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    // Use better-auth's built-in social sign-in with expo
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: redirectUri,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    // Get the session to retrieve user data
    const session = await authClient.getSession();

    return {
      success: true,
      user: session.data?.user,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to sign in with Google',
    };
  }
}

/**
 * Get the redirect URI for Google OAuth configuration
 */
export function getGoogleRedirectUri(): string {
  return redirectUri;
}
