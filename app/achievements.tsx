import React, { useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors, Spacing, Typography, badges, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalytics } from '@/lib/analytics';
import { useUserAchievements } from '@/hooks/use-user-achievements';
import { UserAchievementProgress } from '@/lib/api';

/**
 * Format a date string to relative time (e.g., "2 weeks ago")
 */
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '';

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
 * Group achievements by type
 */
interface GroupedAchievements {
  explorer: UserAchievementProgress[];
  prayer_warrior: UserAchievementProgress[];
  streak: UserAchievementProgress[];
  geographic: UserAchievementProgress[];
  special: UserAchievementProgress[];
}

function groupAchievementsByType(achievements: UserAchievementProgress[]): GroupedAchievements {
  const grouped: GroupedAchievements = {
    explorer: [],
    prayer_warrior: [],
    streak: [],
    geographic: [],
    special: [],
  };

  achievements.forEach((item) => {
    const type = item.achievement.type;
    if (grouped[type]) {
      grouped[type].push(item);
    }
  });

  // Sort each group by sortOrder
  Object.keys(grouped).forEach((key) => {
    grouped[key as keyof GroupedAchievements].sort(
      (a, b) => a.achievement.sortOrder - b.achievement.sortOrder
    );
  });

  return grouped;
}

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case 'bronze':
      return badges.bronze;
    case 'silver':
      return badges.silver;
    case 'gold':
      return badges.gold;
    case 'platinum':
      return badges.platinum;
    case 'diamond':
      return badges.diamond;
    default:
      return badges.bronze;
  }
};

export default function AchievementsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);

  // Fetch achievements from API
  const { data: achievements, isLoading, error, refetch } = useUserAchievements();

  // Group achievements by type
  const groupedAchievements = useMemo(() => {
    if (!achievements) return null;
    return groupAchievementsByType(achievements);
  }, [achievements]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!achievements) return { unlocked: 0, inProgress: 0, locked: 0 };

    let unlocked = 0;
    let inProgress = 0;
    let locked = 0;

    achievements.forEach((item) => {
      const isUnlocked = item.progress?.isUnlocked ?? false;
      const currentProgress = item.progress?.currentProgress ?? 0;

      if (isUnlocked) {
        unlocked++;
      } else if (currentProgress > 0) {
        inProgress++;
      } else {
        locked++;
      }
    });

    return { unlocked, inProgress, locked };
  }, [achievements]);

  useEffect(() => {
    if (hasTrackedView.current) return;
    screen('achievements');
    track('achievements_viewed');
    hasTrackedView.current = true;
  }, [screen, track]);

  const handleRefetch = () => {
    track('achievements_refetch');
    refetch();
  };

  const renderAchievementCard = (item: UserAchievementProgress) => {
    const { achievement, progress } = item;
    const isUnlocked = progress?.isUnlocked ?? false;
    const currentProgress = progress?.currentProgress ?? 0;
    const requiredCount = achievement.requiredCount ?? 1;
    const progressPercent = requiredCount > 0 ? (currentProgress / requiredCount) * 100 : 0;
    const badgeColor = getBadgeColor(achievement.badgeTier);

    return (
      <Card
        key={achievement.code}
        variant="outlined"
        padding="md"
        style={[
          styles.achievementCard,
          !isUnlocked && styles.achievementCardLocked,
        ]}
      >
        <View style={styles.achievementContent}>
          {/* Badge Icon */}
          <View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: isUnlocked
                  ? badgeColor + '30'
                  : colors.backgroundSecondary,
              },
            ]}
          >
            <Text style={styles.badgeEmoji}>
              {isUnlocked ? '🏅' : '🔒'}
            </Text>
          </View>

          {/* Achievement Info */}
          <View style={styles.achievementInfo}>
            <View style={styles.achievementHeader}>
              <Text
                style={[
                  styles.achievementName,
                  { color: isUnlocked ? colors.text : colors.textSecondary },
                ]}
              >
                {achievement.name}
              </Text>
              <Badge
                label={achievement.badgeTier.charAt(0).toUpperCase() + achievement.badgeTier.slice(1)}
                variant={achievement.badgeTier}
                size="sm"
              />
            </View>

            <Text style={[styles.achievementDescription, { color: colors.textTertiary }]}>
              {achievement.description}
            </Text>

            {/* Progress */}
            {isUnlocked ? (
              <Text style={[styles.unlockedText, { color: colors.success }]}>
                Unlocked {formatRelativeTime(progress?.unlockedAt ?? null)}
              </Text>
            ) : (
              <View style={styles.progressSection}>
                <ProgressBar
                  progress={progressPercent}
                  variant="primary"
                  size="sm"
                />
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  {currentProgress}/{requiredCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const renderSection = (
    title: string,
    subtitle: string,
    items: UserAchievementProgress[]
  ) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
        {items.map(renderAchievementCard)}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Achievements', headerBackTitle: 'Back' }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading achievements...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: 'Achievements', headerBackTitle: 'Back' }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error.message || 'Failed to load achievements'}
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Achievements',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Stats Summary */}
          <Card variant="elevated" padding="md" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {stats.unlocked}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Unlocked
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {stats.inProgress}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  In Progress
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.textTertiary }]}>
                  {stats.locked}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Locked
                </Text>
              </View>
            </View>
          </Card>

          {groupedAchievements && (
            <>
              {/* Explorer Achievements */}
              {renderSection(
                'Explorer Achievements',
                'Visit unique masjids to unlock',
                groupedAchievements.explorer
              )}

              {/* Prayer Warrior Achievements */}
              {renderSection(
                'Prayer Warrior Achievements',
                'Pray at different times to unlock',
                groupedAchievements.prayer_warrior
              )}

              {/* Streak Achievements */}
              {renderSection(
                'Streak Achievements',
                'Maintain your visit streaks',
                groupedAchievements.streak
              )}

              {/* Geographic Achievements */}
              {renderSection(
                'Geographic Achievements',
                'Conquer districts and states',
                groupedAchievements.geographic
              )}

              {/* Special Achievements */}
              {renderSection(
                'Special Achievements',
                'Complete special challenges',
                groupedAchievements.special
              )}
            </>
          )}

          {/* Empty State */}
          {(!achievements || achievements.length === 0) && (
            <Card variant="outlined" padding="lg">
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No achievements available yet. Start checking in to unlock achievements!
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
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
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  summaryValue: {
    ...Typography.h2,
    fontWeight: '700',
  },
  summaryLabel: {
    ...Typography.caption,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  achievementCard: {
    marginBottom: Spacing.sm,
  },
  achievementCardLocked: {
    opacity: 0.85,
  },
  achievementContent: {
    flexDirection: 'row',
  },
  badgeContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  achievementName: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  achievementDescription: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  unlockedText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  progressSection: {
    gap: Spacing.xs,
  },
  progressText: {
    ...Typography.caption,
    textAlign: 'right',
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
  errorText: {
    ...Typography.body,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
});
