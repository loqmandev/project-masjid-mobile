import { router, Stack } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useCheckinMasjids } from '@/hooks/use-checkin-masjids';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocation } from '@/hooks/use-location';
import { getNextAchievement, useUserAchievements } from '@/hooks/use-user-achievements';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useSession } from '@/lib/auth-client';

// Helper functions
function getEncouragementMessage(): string {
  const messages = [
    'Consistency in small steps.',
    'Every step matters.',
    'Continue your journey.',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getAchievementIconName(type: string): 'star.fill' | 'hands.sparkles.fill' | 'flame.fill' | 'map.fill' | 'trophy.fill' | 'target' {
  const iconMap: Record<string, 'star.fill' | 'hands.sparkles.fill' | 'flame.fill' | 'map.fill' | 'trophy.fill' | 'target'> = {
    explorer: 'star.fill',
    prayer_warrior: 'hands.sparkles.fill',
    streak: 'flame.fill',
    geographic: 'map.fill',
    special: 'trophy.fill',
  };
  return iconMap[type] || 'target';
}

function getProgressHint(current: number, required: number): string {
  const progressPercent = current / required;

  if (progressPercent === 0) return 'Your first step begins here.';
  if (progressPercent < 0.5) return 'The journey begins.';
  if (progressPercent < 0.8) return 'Getting closer.';
  return 'Almost there!';
}

function getProgressMessage(current: number, required: number): string {
  if (current === 0) return 'Start your journey today.';
  if (current === required - 1) return `${current}/${required} - One more masjid!`;
  return `${current}/${required} - Keep going.`;
}


export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session } = useSession();
  const insets = useSafeAreaInsets();

  const displayName = session?.user?.name?.split(' ')[0] || 'Guest';

  const { data: userProfile } = useUserProfile();
  const { data: achievements } = useUserAchievements();
  const headerName = userProfile?.profile?.leaderboardAlias || displayName;
  const initials =
    headerName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'MJ';

  const nextAchievement = getNextAchievement(achievements);

  const { location, isLoading: isLocationLoading, error: locationError } = useLocation();

  const {
    data: checkinMasjids,
    isLoading: isMasjidsLoading,
    error: masjidsError,
    refetch: refetchMasjids,
  } = useCheckinMasjids({
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  });

  const handleMasjidPress = (masjidId: string) => {
    router.push(`/masjid/${masjidId}`);
  };

  const handleViewAllNearby = () => {
    router.push('/(tabs)/explore');
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Simplified Header */}
        <View style={[styles.headerSection, { paddingTop: insets.top }]}>
          <View style={[styles.headerBackground, { backgroundColor: colors.primary }]}>
            {/* Top Bar */}
            <View style={styles.headerTopBar}>
              <View style={styles.headerGreetingSection}>
                <Text style={styles.headerGreetingLabel}>Assalamualaikum,</Text>
                <Text style={styles.headerUserName}>{headerName}!</Text>
              </View>
              <TouchableOpacity style={[styles.headerAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </TouchableOpacity>
            </View>

            {/* Nearby Masjid Card in Header */}
            {isLocationLoading || isMasjidsLoading ? (
              <View style={[styles.headerMasjidCard, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <View style={styles.headerMasjidContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <View style={styles.headerMasjidInfo}>
                    <Text style={styles.headerMasjidTitle}>Finding nearby masjids</Text>
                    <Text style={styles.headerMasjidSubtitle}>Getting your location...</Text>
                  </View>
                </View>
              </View>
            ) : locationError || masjidsError ? (
              <TouchableOpacity
                onPress={() => refetchMasjids()}
                style={[styles.headerMasjidCard, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
                activeOpacity={0.7}
              >
                <View style={styles.headerMasjidContent}>
                  <IconSymbol name="arrow.clockwise" size={22} color="#fff" />
                  <View style={styles.headerMasjidInfo}>
                    <Text style={styles.headerMasjidTitle}>Can't find masjids</Text>
                    <Text style={styles.headerMasjidSubtitle}>Tap to retry</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : checkinMasjids && checkinMasjids.length > 0 ? (
              <TouchableOpacity
                onPress={() => handleMasjidPress(checkinMasjids[0].masjidId)}
                style={[styles.headerMasjidCard, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
                activeOpacity={0.7}
              >
                <View style={styles.headerMasjidContent}>
                  <View style={styles.headerMasjidIconContainer}>
                    <IconSymbol name="mosque" size={28} color="#fff" />
                  </View>
                  <View style={styles.headerMasjidInfo}>
                    <Text style={styles.headerMasjidTitle} numberOfLines={1}>
                      {checkinMasjids[0].name}
                    </Text>
                    <Text style={styles.headerMasjidSubtitle}>
                      {checkinMasjids[0].distanceM}m away • Ready to check in
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleViewAllNearby}
                style={[styles.headerMasjidCard, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
                activeOpacity={0.7}
              >
                <View style={styles.headerMasjidContent}>
                  <IconSymbol name="magnifyingglass" size={22} color="#fff" />
                  <View style={styles.headerMasjidInfo}>
                    <Text style={styles.headerMasjidTitle}>No nearby masjid</Text>
                    <Text style={styles.headerMasjidSubtitle}>Tap to explore nearby</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Personal Journey Summary Card */}
        <Card variant="outlined" padding="lg" style={styles.journeyCard}>
          <View style={styles.journeyHeader}>
            <Text style={[styles.journeyTitle, { color: colors.text }]}>Journey</Text>
          </View>

          <View style={styles.journeyStats}>
            {/* Current Streak */}
            <View style={styles.journeyStat}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="flame.fill" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {userProfile?.profile?.currentStreak ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  consecutive days
                </Text>
              </View>
            </View>

            {/* Total Masjids Visited */}
            <View style={styles.journeyStat}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="mosque" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {userProfile?.profile?.uniqueMasjidsVisited ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  masjids visited
                </Text>
              </View>
            </View>

            {/* Points Earned */}
            <View style={styles.journeyStat}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <IconSymbol name="star.fill" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {userProfile?.profile?.totalPoints ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  points earned
                </Text>
              </View>
            </View>
          </View>

          {/* Gentle encouragement message */}
          {userProfile?.profile?.currentStreak === 0 && userProfile?.profile?.lastVisitDate && (
            <Text style={[styles.encouragementMessage, { color: colors.textSecondary }]}>
              {getEncouragementMessage()}
            </Text>
          )}
        </Card>

        {/* Achievement Progress */}
        {nextAchievement && nextAchievement.achievement.requiredCount && (
          <View style={styles.section}>
            <Card variant="outlined" padding="lg" style={styles.progressCard}>
              <View style={styles.journeyHeader}>
                <Text style={[styles.journeyTitle, { color: colors.text }]}>Achievement</Text>
              </View>
              <View style={styles.progressHeader}>
                <IconSymbol
                  name={'medal'}
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.progressInfo}>
                  <Text style={[styles.progressName, { color: colors.text }]}>
                    {nextAchievement.achievement.name}
                  </Text>
                  <Text style={[styles.progressHint, { color: colors.textSecondary }]}>
                    {getProgressHint(
                      Number(nextAchievement.progress?.currentProgress ?? 0),
                      Number(nextAchievement.achievement.requiredCount)
                    )}
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={
                  (Number(nextAchievement.progress?.currentProgress ?? 0) /
                    Number(nextAchievement.achievement.requiredCount)) *
                  100
                }
                variant="primary"
                size="md"
              />

              <Text style={[styles.progressMessage, { color: colors.textSecondary }]}>
                {getProgressMessage(
                  Number(nextAchievement.progress?.currentProgress ?? 0),
                  Number(nextAchievement.achievement.requiredCount)
                )}
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 0,
    paddingBottom: Spacing.xxl,
  },

  // Header Section
  headerSection: {
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    marginHorizontal: -Spacing.md,
  },
  headerBackground: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + Spacing.lg,
    paddingTop: Spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    minHeight: 180,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  headerGreetingSection: {
    flex: 1,
  },
  headerGreetingLabel: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerUserName: {
    ...Typography.h1,
    color: '#fff',
    fontWeight: '700',
    fontSize: 28,
  },
  headerMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerMessageContent: {
    flex: 1,
  },
  headerMessageText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  // Header Masjid Card
  headerMasjidCard: {
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerMasjidContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerMasjidIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMasjidInfo: {
    flex: 1,
  },
  headerMasjidTitle: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
    color: '#fff',
    marginBottom: 2,
  },
  headerMasjidSubtitle: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },

  // Personal Journey Card
  journeyCard: {
    marginBottom: Spacing.lg,
    borderRadius: 16,
  },
  journeyHeader: {
    marginBottom: Spacing.md,
  },
  journeyTitle: {
    ...Typography.h3,
    fontWeight: '600',
  },
  journeyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  journeyStat: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.h2,
    fontWeight: '700',
    textAlign: 'center',
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  encouragementMessage: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },

  // Section
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },

  // Achievement Progress
  progressCard: {
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  progressInfo: {
    flex: 1,
  },
  progressName: {
    ...Typography.body,
    fontWeight: '600',
  },
  progressHint: {
    ...Typography.caption,
    marginTop: 2,
  },
  progressMessage: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
});
