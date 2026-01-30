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
        <View style={styles.headerWrapper}>
          <View style={[styles.headerBackground, { backgroundColor: colors.primary }]}>
            <View style={styles.headerGradient} />
          </View>
          <View style={[styles.headerContent, { paddingTop: Spacing.md + insets.top }]}>
            <View style={styles.headerTopRow}>
              <View style={styles.greetingBlock}>
                <Text style={styles.headerGreeting}>Assalamualaikum</Text>
                <Text style={styles.headerName}>{headerName}</Text>
              </View>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </View>
            </View>
            <View style={styles.headerSection}>
              {isLocationLoading || isMasjidsLoading ? (
                <View style={styles.checkinCard}>
                  <View style={styles.checkinLeft}>
                    <View style={styles.checkinIconContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.checkinMainText, { color: '#fff' }]}>
                        Finding nearby masjids
                      </Text>
                      <Text style={[styles.checkinSubText, { color: 'rgba(255,255,255,0.8)' }]}>
                        Getting your location
                      </Text>
                    </View>
                  </View>
                </View>
              ) : locationError || masjidsError ? (
                <TouchableOpacity
                  onPress={() => refetchMasjids()}
                  style={styles.checkinCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkinLeft}>
                    <View style={styles.checkinIconContainer}>
                      <IconSymbol name="arrow.clockwise" size={22} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.checkinMainText, { color: '#fff' }]}>
                        Can&apos;t find masjids
                      </Text>
                      <Text style={[styles.checkinSubText, { color: 'rgba(255,255,255,0.8)' }]}>
                        Tap to retry
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : checkinMasjids && checkinMasjids.length > 0 ? (
                <TouchableOpacity
                  onPress={() => handleMasjidPress(checkinMasjids[0].masjidId)}
                  style={styles.checkinCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.checkinLeft}>
                    <View style={styles.checkinIconContainer}>
                      <IconSymbol name="location.fill" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkinMainText, { color: '#fff' }]} numberOfLines={1}>
                        {checkinMasjids[0].name}
                      </Text>
                      <Text style={[styles.checkinSubText, { color: 'rgba(255,255,255,0.8)' }]}>
                        Ready to check in • {checkinMasjids[0].distanceM}m away
                      </Text>
                    </View>
                    <View style={styles.checkinActionContainer}>
                      <IconSymbol name="checkmark" size={28} color="#fff" />
                    </View>
                  </View>

                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleViewAllNearby}
                  style={styles.checkinCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkinLeft}>
                    <View style={styles.checkinIconContainer}>
                      <IconSymbol name="magnifyingglass" size={22} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.checkinMainText, { color: '#fff' }]}>
                        No nearby masjid
                      </Text>
                      <Text style={[styles.checkinSubText, { color: 'rgba(255,255,255,0.8)' }]}>
                        Tap to explore nearby
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        <View style={[styles.contentShell, { backgroundColor: colors.background }]}>
          {nextAchievement && nextAchievement.achievement.requiredCount && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Next Achievement
                </Text>
              </View>
              <Card variant="outlined" padding="lg" style={styles.achievementCard}>
                <View style={styles.achievementHeader}>
                  <Text style={styles.achievementIcon}>🎯</Text>
                  <View style={styles.achievementTextBlock}>
                    <Text style={[styles.achievementName, { color: colors.text }]}>
                      {nextAchievement.achievement.name}
                    </Text>
                    <Text style={[styles.achievementHint, { color: colors.textSecondary }]}>
                      {nextAchievement.achievement.requiredCount} check-ins to unlock
                    </Text>
                  </View>
                </View>
                <ProgressBar
                  progress={
                    (Number(nextAchievement.progress?.currentProgress ?? 0) /
                      Number(nextAchievement.achievement.requiredCount)) *
                    100
                  }
                  variant="gold"
                  size="md"
                />
                <Text style={[styles.achievementProgress, { color: colors.textSecondary }]}>
                  {nextAchievement.progress?.currentProgress ?? 0}/
                  {nextAchievement.achievement.requiredCount} •{' '}
                  {nextAchievement.achievement.requiredCount -
                    (nextAchievement.progress?.currentProgress ?? 0)}{' '}
                  more to unlock
                </Text>
              </Card>
            </View>
          )}
        </View>
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
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: Spacing.xxl,
  },
  contentShell: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginTop: -Spacing.md,
  },
  headerWrapper: {
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    marginHorizontal: -Spacing.md,
    marginTop: -Spacing.md,
    borderRadius: Spacing.xxl,
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.15,
  },
  headerContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingBlock: {
    flex: 1,
  },
  headerGreeting: {
    ...Typography.caption,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.75)',
  },
  headerName: {
    ...Typography.h2,
    marginTop: 2,
    color: '#fff',
    fontWeight: '700',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  headerSection: {
    marginTop: Spacing.lg,
  },
  checkinCard: {
    padding: Spacing.lg,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  checkinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  checkinMainText: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 18,
    flex: 1,
  },
  checkinSubText: {
    ...Typography.caption,
    marginTop: 4,
    opacity: 0.85,
  },
  distanceText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  checkinIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinActionContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
  },
  achievementCard: {
    borderRadius: 16,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  achievementIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  achievementTextBlock: {
    flex: 1,
  },
  achievementName: {
    ...Typography.body,
    fontWeight: '600',
  },
  achievementHint: {
    ...Typography.caption,
    marginTop: 2,
  },
  achievementProgress: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
});
