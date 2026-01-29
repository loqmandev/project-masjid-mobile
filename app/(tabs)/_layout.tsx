import { Tabs, router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, primary } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalytics } from '@/lib/analytics';
import { useSession } from '@/lib/auth-client';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session, isPending } = useSession();
  const { track } = useAnalytics();

  const requireAuth = (route: string) => ({
    tabPress: (e: any) => {
      if (!isPending && session) return;
      e.preventDefault();
      if (!isPending && !session) {
        track('auth_gate_triggered', { route });
        router.push({
          pathname: '/auth/login',
          params: { returnTo: `/(tabs)/${route}` },
        });
      }
    },
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        // headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          headerSearchBarOptions: {
            placeholder: 'Search masjids, events, articles...',
          },
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name="magnifyingglass.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          title: 'Check In',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.checkInButton, focused && styles.checkInButtonActive]}>
              <IconSymbol size={28} name="checkmark.circle.fill" color={focused ? '#fff' : colors.primary} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={requireAuth('checkin')}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name="trophy.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
        listeners={requireAuth('profile')}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  checkInButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  checkInButtonActive: {
    backgroundColor: primary[500],
  },
});
