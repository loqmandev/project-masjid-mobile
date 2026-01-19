import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import {
  loadThemePreference,
  saveThemePreference,
  ThemePreference,
} from '@/lib/storage';

type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  /** The effective color scheme being used (light or dark) */
  colorScheme: ColorScheme;
  /** The user's theme preference (light, dark, or system) */
  themePreference: ThemePreference;
  /** Update the theme preference */
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const saved = loadThemePreference();
    setThemePreferenceState(saved);
    setIsLoaded(true);
  }, []);

  // Compute effective color scheme
  const colorScheme: ColorScheme =
    themePreference === 'system'
      ? systemColorScheme ?? 'light'
      : themePreference;

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    saveThemePreference(preference);
  };

  // Don't render until we've loaded the preference to avoid flash
  if (!isLoaded) {
    return null;
  }

  return React.createElement(
    ThemeContext.Provider,
    {
      value: {
        colorScheme,
        themePreference,
        setThemePreference,
      },
    },
    children
  );
}

/**
 * Hook to access the current color scheme and theme preference.
 * Returns the effective color scheme (light or dark) based on user preference.
 */
export function useColorScheme(): ColorScheme {
  const context = useContext(ThemeContext);
  const systemColorScheme = useSystemColorScheme();

  // If used outside ThemeProvider, fall back to system color scheme
  if (!context) {
    return systemColorScheme ?? 'light';
  }

  return context.colorScheme;
}

/**
 * Hook to access the full theme context including preference setter.
 * Use this in settings or anywhere you need to change the theme.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  const systemColorScheme = useSystemColorScheme();

  // If used outside ThemeProvider, return a fallback
  if (!context) {
    return {
      colorScheme: systemColorScheme ?? 'light',
      themePreference: 'system',
      setThemePreference: () => {
        console.warn('useTheme must be used within a ThemeProvider');
      },
    };
  }

  return context;
}
