/**
 * Better Auth Client for Expo
 * Handles authentication with Google OAuth via the backend
 */

import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL } from '@/constants/api';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: 'jejakmasjidmobile',
      storagePrefix: 'jejakmasjid',
      storage: SecureStore,
    }),
  ],
});

// Export typed hooks and utilities for use in components
export const { useSession, signIn, signOut, getSession } = authClient;
