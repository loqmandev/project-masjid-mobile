import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors, Spacing, Typography, primary, gold, badges, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Mock data
const mockAchievements = {
  explorer: [
    {
      code: 'explorer_3',
      name: 'Pengembara Pemula',
      description: 'Visit 3 unique masjids',
      badge: 'bronze',
      required: 3,
      current: 3,
      unlocked: true,
      unlockedAt: '2 weeks ago',
    },
    {
      code: 'explorer_5',
      name: 'Pengembara Aktif',
      description: 'Visit 5 unique masjids',
      badge: 'silver',
      required: 5,
      current: 5,
      unlocked: true,
      unlockedAt: '1 week ago',
    },
    {
      code: 'explorer_10',
      name: 'Pengembara Dedikasi',
      description: 'Visit 10 unique masjids',
      badge: 'gold',
      required: 10,
      current: 10,
      unlocked: true,
      unlockedAt: '3 days ago',
    },
    {
      code: 'explorer_20',
      name: 'Pengembara Hebat',
      description: 'Visit 20 unique masjids',
      badge: 'platinum',
      required: 20,
      current: 12,
      unlocked: false,
    },
    {
      code: 'explorer_50',
      name: 'Pengembara Legenda',
      description: 'Visit 50 unique masjids',
      badge: 'diamond',
      required: 50,
      current: 12,
      unlocked: false,
    },
  ],
  special: [
    {
      code: 'prayer_warrior',
      name: 'Pahlawan Solat',
      description: 'Visit during all 5 prayer times',
      badge: 'gold',
      required: 5,
      current: 3,
      unlocked: false,
      progressDetails: ['Subuh', 'Zohor', 'Asar'],
    },
    {
      code: 'photographer_10',
      name: 'Jurugambar Masjid',
      description: 'Upload 10 approved photos',
      badge: 'silver',
      required: 10,
      current: 4,
      unlocked: false,
    },
    {
      code: 'donor_10',
      name: 'Dermawan',
      description: 'Make donations at 10 different masjids',
      badge: 'gold',
      required: 10,
      current: 2,
      unlocked: false,
    },
  ],
  geographic: [
    {
      code: 'district_petaling',
      name: 'Penakluk Daerah Petaling',
      description: 'Visit all masjids in Petaling district',
      badge: 'gold',
      required: 25,
      current: 8,
      unlocked: false,
    },
    {
      code: 'state_selangor',
      name: 'Juara Negeri Selangor',
      description: 'Visit all masjids in Selangor',
      badge: 'platinum',
      required: 200,
      current: 12,
      unlocked: false,
    },
  ],
};

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

  const renderAchievementCard = (achievement: typeof mockAchievements.explorer[0]) => {
    const progress = (achievement.current / achievement.required) * 100;
    const badgeColor = getBadgeColor(achievement.badge);

    return (
      <Card
        key={achievement.code}
        variant="outlined"
        padding="md"
        style={[
          styles.achievementCard,
          !achievement.unlocked && styles.achievementCardLocked,
        ]}
      >
        <View style={styles.achievementContent}>
          {/* Badge Icon */}
          <View
            style={[
              styles.badgeContainer,
              {
                backgroundColor: achievement.unlocked
                  ? badgeColor + '30'
                  : colors.backgroundSecondary,
              },
            ]}
          >
            <Text style={styles.badgeEmoji}>
              {achievement.unlocked ? '🏅' : '🔒'}
            </Text>
          </View>

          {/* Achievement Info */}
          <View style={styles.achievementInfo}>
            <View style={styles.achievementHeader}>
              <Text
                style={[
                  styles.achievementName,
                  { color: achievement.unlocked ? colors.text : colors.textSecondary },
                ]}
              >
                {achievement.name}
              </Text>
              <Badge
                label={achievement.badge.charAt(0).toUpperCase() + achievement.badge.slice(1)}
                variant={achievement.badge as any}
                size="sm"
              />
            </View>

            <Text style={[styles.achievementDescription, { color: colors.textTertiary }]}>
              {achievement.description}
            </Text>

            {/* Progress */}
            {achievement.unlocked ? (
              <Text style={[styles.unlockedText, { color: colors.success }]}>
                Unlocked {achievement.unlockedAt}
              </Text>
            ) : (
              <View style={styles.progressSection}>
                <ProgressBar
                  progress={progress}
                  variant="primary"
                  size="sm"
                />
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  {achievement.current}/{achievement.required}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

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
        >
          {/* Stats Summary */}
          <Card variant="elevated" padding="md" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>3</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Unlocked
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text }]}>10</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  In Progress
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.textTertiary }]}>0</Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Locked
                </Text>
              </View>
            </View>
          </Card>

          {/* Explorer Achievements */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Explorer Achievements
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Visit unique masjids to unlock
            </Text>
            {mockAchievements.explorer.map(renderAchievementCard)}
          </View>

          {/* Special Achievements */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Special Achievements
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Complete special challenges
            </Text>
            {mockAchievements.special.map(renderAchievementCard)}
          </View>

          {/* Geographic Achievements */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Geographic Achievements
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Conquer districts and states
            </Text>
            {mockAchievements.geographic.map(renderAchievementCard)}
          </View>
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
});
