/**
 * Masjid Go Theme
 * Islamic-inspired color palette with gamification elements
 */

import { Platform } from 'react-native';

// Primary - Teal (Trust, Calm, Spiritual)
export const primary = {
  50: '#E6F7F7',
  100: '#B3E8E8',
  200: '#80D9D9',
  300: '#4DCACA',
  400: '#26BEBE',
  500: '#00A9A5', // Main primary
  600: '#008B88',
  700: '#006D6A',
  800: '#004F4D',
  900: '#003130',
};

// Secondary - Gold (Achievement, Reward, Premium)
export const gold = {
  50: '#FFF9E6',
  100: '#FFEFB3',
  200: '#FFE580',
  300: '#FFDB4D',
  400: '#FFD426',
  500: '#FFCC00', // Main gold
  600: '#D4AA00',
  700: '#AA8800',
  800: '#806600',
  900: '#554400',
};

// Neutrals
export const neutral = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

// Semantic colors
export const semantic = {
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

// Badge colors
export const badges = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

export const Colors = {
  light: {
    text: neutral[900],
    textSecondary: neutral[600],
    textTertiary: neutral[500],
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    card: '#FFFFFF',
    border: neutral[200],
    tint: primary[500],
    icon: neutral[600],
    tabIconDefault: neutral[400],
    tabIconSelected: primary[500],
    // Semantic
    success: semantic.success,
    warning: semantic.warning,
    error: semantic.error,
    info: semantic.info,
    // Brand
    primary: primary[500],
    primaryLight: primary[100],
    primaryDark: primary[700],
    gold: gold[500],
    goldLight: gold[100],
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: neutral[400],
    textTertiary: neutral[500],
    background: '#151718',
    backgroundSecondary: '#1E2022',
    card: '#1E2022',
    border: neutral[800],
    tint: primary[400],
    icon: neutral[400],
    tabIconDefault: neutral[600],
    tabIconSelected: primary[400],
    // Semantic
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
    info: '#42A5F5',
    // Brand
    primary: primary[400],
    primaryLight: primary[900],
    primaryDark: primary[300],
    gold: gold[400],
    goldLight: gold[900],
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};
