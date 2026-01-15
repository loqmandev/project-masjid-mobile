import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors, Spacing, Typography, primary } from '@/constants/theme';
import { useCheckinMasjids } from '@/hooks/use-checkin-masjids';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocation } from '@/hooks/use-location';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUserAchievements, getNextAchievement } from '@/hooks/use-user-achievements';
import { useSession } from '@/lib/auth-client';


export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session } = useSession();

  // Get display name from session or fallback for guests
  const displayName = session?.user?.name?.split(' ')[0] || 'Guest';
  const isAuthenticated = !!session?.user;

  // Fetch user profile and achievements (only when authenticated)
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { data: achievements } = useUserAchievements();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Greeting */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Assalamualaikum,
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {displayName}
          </Text>
        </View>

        {/* Journey Stats Card */}
        <Card variant="elevated" style={styles.journeyCard}>
          <View style={[styles.journeyCardInner, { backgroundColor: primary[500] }]}>
            <Text style={styles.journeyTitle}>YOUR JOURNEY</Text>

            {isProfileLoading && isAuthenticated ? (
              <View style={styles.statsLoadingContainer}>
                <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
              </View>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>🕌</Text>
                  <Text style={styles.statValue}>
                    {userProfile?.profile?.uniqueMasjidsVisited ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Masjids Visited</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>⭐</Text>
                  <Text style={styles.statValue}>
                    {userProfile?.profile?.totalPoints ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>🏆</Text>
                  <Text style={styles.statValue}>
                    {userProfile?.profile?.achievementCount ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Achievements</Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Next Achievement Card */}
        {nextAchievement && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Next Achievement
            </Text>
            <Card variant="outlined" padding="md">
              <View style={styles.achievementHeader}>
                <Text style={styles.achievementIcon}>🎯</Text>
                <Text style={[styles.achievementName, { color: colors.text }]}>
                  {nextAchievement.achievement.name}
                </Text>
              </View>
              <ProgressBar
                progress={
                  (nextAchievement.currentCount / nextAchievement.achievement.requiredCount) * 100
                }
                variant="gold"
                size="md"
              />
              <Text style={[styles.achievementProgress, { color: colors.textSecondary }]}>
                {nextAchievement.currentCount}/{nextAchievement.achievement.requiredCount} •{' '}
                {nextAchievement.achievement.requiredCount - nextAchievement.currentCount} more to unlock!
              </Text>
            </Card>
          </View>
        )}

        {/* Available for Check-in (within 100m) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Available for Check-in
            </Text>
            <TouchableOpacity onPress={handleViewAllNearby}>
              <Text style={[styles.viewAllLink, { color: colors.primary }]}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {(isLocationLoading || isMasjidsLoading) && (
            <Card variant="outlined" padding="lg">
              <View style={styles.centeredContent}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  {isLocationLoading ? 'Getting your location...' : 'Finding nearby masjids...'}
                </Text>
              </View>
            </Card>
          )}

          {/* Error State */}
          {(locationError || masjidsError) && !isLocationLoading && !isMasjidsLoading && (
            <Card variant="outlined" padding="lg">
              <View style={styles.centeredContent}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {locationError || masjidsError?.message || 'Failed to load masjids'}
                </Text>
                <TouchableOpacity
                  onPress={() => refetchMasjids()}
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Empty State */}
          {!isLocationLoading && !isMasjidsLoading && !locationError && !masjidsError && checkinMasjids?.length === 0 && (
            <Card variant="outlined" padding="lg">
              <View style={styles.centeredContent}>
                <Text style={styles.emptyIcon}>📍</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No masjids within 100m
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                  Move closer to a masjid to check in
                </Text>
                <View style={styles.emptyActions}>
                  <TouchableOpacity
                    onPress={handleRefreshLocation}
                    style={[styles.refreshButton, { borderColor: colors.primary }]}
                  >
                    <Text style={[styles.refreshButtonText, { color: colors.primary }]}>
                      Refresh Location
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleViewAllNearby}
                    style={[styles.exploreButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.exploreButtonText}>Explore Nearby Masjids</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}

          {/* Masjid List */}
          {checkinMasjids?.map((masjid) => (
            <TouchableOpacity
              key={masjid.masjidId}
              onPress={() => handleMasjidPress(masjid.masjidId)}
              activeOpacity={0.7}
            >
              <Card variant="outlined" padding="md" style={styles.masjidCard}>
                <View style={styles.masjidCardContent}>
                  <View style={styles.masjidIcon}>
                    <Text style={styles.masjidEmoji}>🕌</Text>
                  </View>
                  <View style={styles.masjidInfo}>
                    <Text style={[styles.masjidName, { color: colors.text }]}>
                      {masjid.name}
                    </Text>
                    <Text style={[styles.masjidLocation, { color: colors.textSecondary }]}>
                      {masjid.distanceM}m away • {masjid.districtName}
                    </Text>
                    <View style={styles.masjidBadges}>
                      <Badge label="Ready to check in" variant="success" size="sm" />
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
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
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.body,
  },
  userName: {
    ...Typography.h2,
  },
  journeyCard: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  journeyCardInner: {
    padding: Spacing.lg,
    borderRadius: 12,
  },
  journeyTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statsLoadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  viewAllLink: {
    ...Typography.bodySmall,
    fontWeight: '600',
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
  achievementName: {
    ...Typography.body,
    fontWeight: '600',
  },
  achievementProgress: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
  masjidCard: {
    marginBottom: Spacing.sm,
  },
  masjidCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masjidIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  masjidEmoji: {
    fontSize: 24,
  },
  masjidInfo: {
    flex: 1,
  },
  masjidName: {
    ...Typography.body,
    fontWeight: '600',
  },
  masjidLocation: {
    ...Typography.caption,
    marginTop: 2,
  },
  masjidBadges: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
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
