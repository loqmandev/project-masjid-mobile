import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { primary } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 1000,
    },
  },
});

// Custom theme with Jejak Masjid colors
const JejakMasjidLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: primary[500],
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#212121',
    border: '#EEEEEE',
  },
};

const JejakMasjidDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: primary[400],
    background: '#151718',
    card: '#1E2022',
    text: '#ECEDEE',
    border: '#424242',
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? JejakMasjidDarkTheme : JejakMasjidLightTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="auth/login"
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen
              name="masjid/[id]"
              options={{
                title: 'Masjid Details',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="achievements"
              options={{
                title: 'Achievements',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                title: 'Modal',
              }}
            />
            <Stack.Screen
              name="checkout-celebration"
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                animation: 'fade',
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
