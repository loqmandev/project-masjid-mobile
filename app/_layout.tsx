import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { primary } from '@/constants/theme';
import { ThemeProvider as AppThemeProvider, useColorScheme } from '@/hooks/use-color-scheme';

import { PostHogProvider } from 'posthog-react-native';

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

function RootLayoutContent() {
  const colorScheme = useColorScheme();

  return (
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
          name="auth/enter-name"
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
        <Stack.Screen
          name="checkin/update-facilities"
          options={{
            title: 'Update Facilities',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="checkin/add-photos"
          options={{
            title: 'Add Photos',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PostHogProvider
        apiKey="phc_x63Shbm7JoWNomcnVXQLbwT1yfVBTzwIhp6UAn9DV04"
        options={{
          host: "https://us.i.posthog.com",
        }}
      >
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <RootLayoutContent />
          </AppThemeProvider>
        </QueryClientProvider>
      </PostHogProvider>
    </SafeAreaProvider>
  );
}
