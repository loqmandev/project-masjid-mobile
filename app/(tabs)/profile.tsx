import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProgressBar } from '@/components/ui/progress-bar';
import { BorderRadius, Colors, primary, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getUserAchievements,
  getUserCheckins,
  getUserProfile,
  UserAchievementProgress,
  UserCheckin,
  UserProfileResponse,
} from '@/lib/api';
import { authClient, useSession } from '@/lib/auth-client';
import {
  clearCachedUserProfile,
  loadCachedUserProfile,
  saveCachedUserProfile,
} from '@/lib/storage';

const menuItems = [
  { icon: 'gearshape.fill', label: 'Settings', route: '/settings' },
  { icon: 'questionmark.circle.fill', label: 'Help & Support', route: '/help' },
];

// Cache validity duration (5 minutes)
const PROFILE_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

interface CachedProfileData {
  profile: UserProfileResponse;
  achievements: UserAchievementProgress[];
  checkins: UserCheckin[];
}

/**
 * Format a date string to relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Map achievement tier to badge variant
 */
function getTierBadgeVariant(tier: string): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
  const tierMap: Record<string, 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'> = {
    bronze: 'bronze',
    silver: 'silver',
    gold: 'gold',
    platinum: 'platinum',
    diamond: 'diamond',
  };
  return tierMap[tier.toLowerCase()] || 'bronze';
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session } = useSession();

  // State for API data
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [achievements, setAchievements] = useState<UserAchievementProgress[]>([]);
  const [recentVisits, setRecentVisits] = useState<UserCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user data from session or profile data
  const user = session?.user;
  const displayName = profileData?.user?.name || user?.name || 'User';
  const email = profileData?.user?.email || user?.email || '';
  const avatarUrl = profileData?.user?.image || user?.image || null;

  // Load profile data from API
  const loadProfileData = useCallback(async (useCache: boolean = true) => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Check cache first
      if (useCache) {
        const cached = loadCachedUserProfile<CachedProfileData>();
        if (cached && cached.userId === session.user.id) {
          const cacheAge = Date.now() - cached.timestamp;
          if (cacheAge < PROFILE_CACHE_MAX_AGE_MS) {
            setProfileData(cached.data.profile);
            setAchievements(cached.data.achievements);
            setRecentVisits(cached.data.checkins);
            setIsLoading(false);
            return;
          }
        }
      }

      // Fetch fresh data from API
      const [profile, userAchievements, checkins] = await Promise.all([
        getUserProfile(),
        getUserAchievements(),
        getUserCheckins(3),
      ]);

      setProfileData(profile);
      setAchievements(userAchievements);
      setRecentVisits(checkins);
      setError(null);

      // Cache the data
      saveCachedUserProfile<CachedProfileData>(
        { profile, achievements: userAchievements, checkins },
        session.user.id
      );
    } catch (err) {
      console.error('Failed to load profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session?.user?.id]);

  // Load data on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      loadProfileData();
    } else {
      setIsLoading(false);
    }
  }, [session?.user, loadProfileData]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadProfileData(false); // Skip cache on refresh
  }, [loadProfileData]);

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  const handleSignOut = async () => {
    try {
      // Clear cached user profile before signing out
      clearCachedUserProfile();
      await authClient.signOut();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get profile stats with fallbacks
  const totalPoints = profileData?.profile?.totalPoints ?? 0;
  const uniqueMasjidsVisited = profileData?.profile?.uniqueMasjidsVisited ?? 0;
  const globalRank = profileData?.profile?.globalRank ?? null;

  // Get first 4 achievements for display
  const displayAchievements = achievements.slice(0, 4);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '15' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={() => loadProfileData(false)}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: primary[100] }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>👤</Text>
            )}
          </View>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {email}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalPoints}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Points
            </Text>
          </Card>
          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Text style={styles.statEmoji}>🕌</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {uniqueMasjidsVisited}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Masjids
            </Text>
          </Card>
          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {globalRank ? `#${globalRank}` : '-'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Rank
            </Text>
          </Card>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Achievements
            </Text>
            <TouchableOpacity onPress={() => handleMenuPress('/achievements')}>
              <Text style={[styles.viewAllLink, { color: colors.primary }]}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>
          {displayAchievements.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {displayAchievements.map((item) => {
                const currentProgress = item.progress?.currentProgress ?? 0;
                const requiredCount = item.achievement.requiredCount ?? 1;
                const isUnlocked = item.progress?.isUnlocked ?? false;
                const progressPercent = requiredCount > 0
                  ? Math.round((currentProgress / requiredCount) * 100)
                  : 0;

                return (
                  <Card
                    key={item.achievement.code}
                    variant="outlined"
                    padding="sm"
                    style={[
                      styles.achievementCard,
                      !isUnlocked && styles.achievementCardLocked,
                    ]}
                  >
                    <View style={styles.achievementBadge}>
                      <Text style={styles.achievementEmoji}>
                        {isUnlocked ? '🏅' : '🔒'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.achievementName,
                        { color: isUnlocked ? colors.text : colors.textTertiary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.achievement.name}
                    </Text>
                    {isUnlocked ? (
                      <Badge
                        label={item.achievement.badgeTier.charAt(0).toUpperCase() + item.achievement.badgeTier.slice(1)}
                        variant={getTierBadgeVariant(item.achievement.badgeTier)}
                        size="sm"
                      />
                    ) : (
                      <View style={styles.progressContainer}>
                        <ProgressBar
                          progress={progressPercent}
                          variant="primary"
                          size="sm"
                        />
                        <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                          {currentProgress}/{requiredCount}
                        </Text>
                      </View>
                    )}
                  </Card>
                );
              })}
            </ScrollView>
          ) : (
            <Card variant="outlined" padding="md">
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Start checking in to unlock achievements!
              </Text>
            </Card>
          )}
        </View>

        {/* Recent Visits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Visits
            </Text>
            <TouchableOpacity onPress={() => handleMenuPress('/history')}>
              <Text style={[styles.viewAllLink, { color: colors.primary }]}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>
          {recentVisits.length > 0 ? (
            recentVisits.map((visit) => (
              <View
                key={visit.id}
                style={[styles.visitItem, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.visitIcon, { backgroundColor: primary[50] }]}>
                  <Text>🕌</Text>
                </View>
                <View style={styles.visitInfo}>
                  <Text style={[styles.visitName, { color: colors.text }]}>
                    {visit.masjidName}
                  </Text>
                  <Text style={[styles.visitDate, { color: colors.textTertiary }]}>
                    {formatRelativeTime(visit.checkInAt)}
                  </Text>
                </View>
                <Text style={[styles.visitPoints, { color: colors.primary }]}>
                  +{visit.actualPointsEarned} pts
                </Text>
              </View>
            ))
          ) : (
            <Card variant="outlined" padding="md">
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No visits yet. Start exploring masjids!
              </Text>
            </Card>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Card variant="outlined" padding="xs">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                ]}
                onPress={() => handleMenuPress(item.route)}
              >
                <View style={styles.menuItemLeft}>
                  <IconSymbol name={item.icon as any} size={20} color={colors.textSecondary} />
                  <Text style={[styles.menuItemLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.error + '15' }]}
          onPress={handleSignOut}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.versionText, { color: colors.textTertiary }]}>
          Jejak Masjid v1.0.0
        </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  errorBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  retryText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  emptyStateText: {
    ...Typography.body,
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarText: {
    fontSize: 40,
  },
  displayName: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  email: {
    ...Typography.body,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
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
  },
  viewAllLink: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  achievementsScroll: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  achievementCard: {
    width: 120,
    alignItems: 'center',
  },
  achievementCardLocked: {
    opacity: 0.7,
  },
  achievementBadge: {
    marginBottom: Spacing.xs,
  },
  achievementEmoji: {
    fontSize: 32,
  },
  achievementName: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    minHeight: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressText: {
    ...Typography.caption,
    marginTop: 2,
  },
  visitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  visitIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  visitInfo: {
    flex: 1,
  },
  visitName: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  visitDate: {
    ...Typography.caption,
  },
  visitPoints: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemLabel: {
    ...Typography.body,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  signOutText: {
    ...Typography.button,
  },
  versionText: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
