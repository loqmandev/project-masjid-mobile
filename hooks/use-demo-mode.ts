import React, { createContext, useContext, useEffect, useState } from 'react';

import { loadDemoMode } from '@/lib/storage';
import { isDemoEmail } from '@/lib/demo-mode';
import { authClient } from '@/lib/auth-client';

interface DemoModeContextValue {
  /** Whether the current session is in demo mode */
  isDemoMode: boolean;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

interface DemoModeProviderProps {
  children: React.ReactNode;
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load demo mode state on mount
  useEffect(() => {
    const loadInitialState = async () => {
      // Check storage first
      const stored = loadDemoMode();

      // Also verify against current session email
      const session = await authClient.getSession();
      const emailMatchesDemo = session?.data?.user
        ? isDemoEmail(session.data.user.email)
        : false;

      // Demo mode is active if stored OR email matches
      setIsDemoMode(stored || emailMatchesDemo);
      setIsLoaded(true);
    };

    loadInitialState();
  }, []);

  return React.createElement(
    DemoModeContext.Provider,
    { value: { isDemoMode } },
    isLoaded ? children : null
  );
}

/**
 * Hook to check if the current session is in demo mode.
 * Returns true if the user is using the demo account.
 *
 * Demo mode is detected by:
 * 1. The X-Demo-Mode header from backend responses (stored via saveDemoMode)
 * 2. The user's email matching demo@jejakmasjid.my
 */
export function useDemoMode(): boolean {
  const context = useContext(DemoModeContext);

  // If used outside provider, check storage directly
  if (!context) {
    return loadDemoMode();
  }

  return context.isDemoMode;
}
