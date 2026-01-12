import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography, primary, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSession, authClient } from '@/lib/auth-client';

// Mock data
const mockUser = {
  displayName: 'Ahmad Razif',
  email: 'ahmad.razif@gmail.com',
  avatarUrl: null,
  joinedDate: 'January 2026',
  totalPoints: 350,
  totalVisits: 15,
  uniqueMasjidsVisited: 12,
  rank: 42,
  achievements: [
    { code: 'explorer_3', name: 'Pengembara Pemula', badge: 'bronze', unlocked: true },
    { code: 'explorer_5', name: 'Pengembara Aktif', badge: 'silver', unlocked: true },
    { code: 'explorer_10', name: 'Pengembara Dedikasi', badge: 'gold', unlocked: true },
    { code: 'explorer_20', name: 'Pengembara Hebat', badge: 'platinum', unlocked: false, progress: 60 },
  ],
  recentVisits: [
    { id: '1', masjidName: 'Masjid Sultan Salahuddin', date: '2 days ago', points: 20 },
    { id: '2', masjidName: 'Masjid Negara', date: '1 week ago', points: 10 },
    { id: '3', masjidName: 'Masjid Wilayah', date: '2 weeks ago', points: 45 },
  ],
};

const menuItems = [
  { icon: 'clock.fill', label: 'Visit History', route: '/history' },
  { icon: 'star.fill', label: 'Achievements', route: '/achievements' },
  { icon: 'gearshape.fill', label: 'Settings', route: '/settings' },
  { icon: 'questionmark.circle.fill', label: 'Help & Support', route: '/help' },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session } = useSession();

  // Get user data from session or fall back to mock data
  const user = session?.user;
  const displayName = user?.name || mockUser.displayName;
  const email = user?.email || mockUser.email;
  const avatarUrl = user?.image || null;

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={[styles.joinedDate, { color: colors.textTertiary }]}>
            Member since {mockUser.joinedDate}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {mockUser.totalPoints}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Points
            </Text>
          </Card>
          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Text style={styles.statEmoji}>🕌</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {mockUser.uniqueMasjidsVisited}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Masjids
            </Text>
          </Card>
          <Card variant="elevated" padding="md" style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              #{mockUser.rank}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {mockUser.achievements.map((achievement) => (
              <Card
                key={achievement.code}
                variant="outlined"
                padding="sm"
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementCardLocked,
                ]}
              >
                <View style={styles.achievementBadge}>
                  <Text style={styles.achievementEmoji}>
                    {achievement.unlocked ? '🏅' : '🔒'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.achievementName,
                    { color: achievement.unlocked ? colors.text : colors.textTertiary },
                  ]}
                  numberOfLines={2}
                >
                  {achievement.name}
                </Text>
                {achievement.unlocked ? (
                  <Badge
                    label={achievement.badge.charAt(0).toUpperCase() + achievement.badge.slice(1)}
                    variant={achievement.badge as any}
                    size="sm"
                  />
                ) : (
                  <View style={styles.progressContainer}>
                    <ProgressBar
                      progress={achievement.progress || 0}
                      variant="primary"
                      size="sm"
                    />
                    <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                      {achievement.progress}%
                    </Text>
                  </View>
                )}
              </Card>
            ))}
          </ScrollView>
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
          {mockUser.recentVisits.map((visit) => (
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
                  {visit.date}
                </Text>
              </View>
              <Text style={[styles.visitPoints, { color: colors.primary }]}>
                +{visit.points} pts
              </Text>
            </View>
          ))}
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
          Masjid Go v1.0.0
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
    marginBottom: Spacing.xs,
  },
  joinedDate: {
    ...Typography.caption,
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
