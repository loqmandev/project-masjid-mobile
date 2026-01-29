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
import { Colors, primary, Spacing, Typography } from '@/constants/theme';
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

  // Get display name from session or fallback for guests
  const displayName = session?.user?.name?.split(' ')[0] || 'Guest';
  const isAuthenticated = !!session?.user;

  // Fetch user profile and achievements (only when authenticated)
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
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

  // Get the next achievement to unlock
  const nextAchievement = getNextAchievement(achievements);

  // Get user's current location
  const { location, isLoading: isLocationLoading, error: locationError, refresh: refreshLocation } = useLocation();

  // Fetch masjids available for check-in (within 100m)
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

  const handleRefreshLocation = async () => {
    // Force refresh to bypass cache and get fresh location
    await refreshLocation(true);
    // Masjids will automatically refetch when location changes due to query key dependency
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
        {/* Custom Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.headerBackground}>
            <View style={styles.headerGlow} />
            <View style={styles.headerOrb} />
          </View>
          <View style={[styles.headerContent, { paddingTop: Spacing.lg + insets.top }]}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.headerGreeting}>Assalamualaikum</Text>
                <Text style={styles.headerName}>{headerName}</Text>
              </View>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </View>
            </View>
            <View style={styles.headerSection}>
              {/* Loading State */}
              {(isLocationLoading || isMasjidsLoading) && (
                <View style={{ padding: Spacing.md }}>
                  <View style={styles.masjidCardContent}>
                    <View style={styles.masjidLeft}>
                      <Text style={[styles.masjidSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>
                        LOADING
                      </Text>
                      <Text style={[styles.masjidName, { color: '#fff' }]} numberOfLines={1}>
                        {isLocationLoading ? 'Getting your location' : 'Finding nearby masjids'}
                      </Text>
                      <Text style={[styles.masjidSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                        Please wait a moment
                      </Text>
                    </View>
                    <View style={styles.checkinSideButton}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  </View>
                </View>
              )}

              {/* Error State */}
              {(locationError || masjidsError) && !isLocationLoading && !isMasjidsLoading && (
                <View style={{ padding: Spacing.md }}>
                  <View style={styles.masjidCardContent}>
                    <View style={styles.masjidLeft}>
                      <Text style={[styles.masjidSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>
                        SOMETHING WENT WRONG
                      </Text>
                      <Text style={[styles.masjidName, { color: '#fff' }]} numberOfLines={1}>
                        Can’t load nearby masjids
                      </Text>
                      <Text style={[styles.masjidSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                        Tap to try again
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => refetchMasjids()}
                      style={styles.checkinSideButton}
                    >
                      <IconSymbol name="arrow.clockwise" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Empty State */}
              {!isLocationLoading &&
                !isMasjidsLoading &&
                !locationError &&
                !masjidsError &&
                checkinMasjids?.length === 0 && (
                  <View style={{ padding: Spacing.md }}>
                    <View style={styles.masjidCardContent}>
                      <View style={styles.masjidLeft}>
                        <Text style={[styles.masjidSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>
                          NO MASJID FOUND
                        </Text>
                        <Text style={[styles.masjidName, { color: '#fff' }]} numberOfLines={1}>
                          No nearby masjid yet
                        </Text>
                        <Text style={[styles.masjidSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                          Try moving a little closer
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleViewAllNearby}
                        style={styles.checkinSideButton}>
                        <IconSymbol name="magnifyingglass.circle.fill" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              {/* Masjid List */}
              {checkinMasjids?.map((masjid) => (
                <View
                  key={masjid.masjidId}
                  style={{ padding: Spacing.md }}
                >
                  <View style={styles.masjidCardContent}>
                    <View style={styles.masjidLeft}>
                      <Text style={[styles.masjidSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>
                        READY TO CHECK IN
                      </Text>
                      <View style={styles.masjidTitleRow}>
                        <Text style={[styles.masjidName, { color: '#fff' }]} numberOfLines={1}>
                          {masjid.name}
                        </Text>
                        <View style={styles.masjidDistanceBadge}>
                          <Text style={styles.masjidDistanceText}>{masjid.distanceM}m</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleMasjidPress(masjid.masjidId)}
                      style={styles.checkinSideButton}
                    >
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={[styles.contentShell, { backgroundColor: colors.background }]}>
          {/* Next Achievement Card */}
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
    backgroundColor: primary[600],
  },
  headerGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: primary[400],
    opacity: 0.4,
    top: -60,
    right: -40,
  },
  headerOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: primary[800],
    opacity: 0.35,
    bottom: -40,
    left: -30,
  },
  headerContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.85)',
  },
  headerName: {
    ...Typography.h2,
    marginTop: 4,
    color: '#fff',
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
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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
  achievementChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  achievementChipText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  masjidCard: {
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  masjidCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  masjidLeft: {
    flex: 1,
    gap: 6,
  },
  masjidTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  masjidName: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 18,
  },
  masjidDistanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  masjidDistanceText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  masjidSubtitle: {
    ...Typography.caption,
  },
  checkinSideButton: {
    width: 46,
    alignSelf: 'stretch',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    ...Typography.button,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  emptyActions: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
    width: '100%',
  },
  refreshButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  refreshButtonText: {
    ...Typography.button,
  },
  exploreButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#fff',
    ...Typography.button,
  },
});
