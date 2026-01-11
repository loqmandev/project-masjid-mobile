import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography, primary, gold, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Mock data
const mockLeaderboard = [
  {
    rank: 1,
    userId: '1',
    displayName: 'MasjidHero',
    points: 1250,
    masjidsVisited: 42,
    isAnonymous: false,
  },
  {
    rank: 2,
    userId: '2',
    displayName: 'ExplorerAhmad',
    points: 980,
    masjidsVisited: 35,
    isAnonymous: false,
  },
  {
    rank: 3,
    userId: '3',
    displayName: 'PengembaraKL',
    points: 875,
    masjidsVisited: 30,
    isAnonymous: false,
  },
  {
    rank: 4,
    userId: '4',
    displayName: 'SarahVisitor',
    points: 720,
    masjidsVisited: 25,
    isAnonymous: false,
  },
  {
    rank: 5,
    userId: '5',
    displayName: 'AdamMasjid',
    points: 685,
    masjidsVisited: 23,
    isAnonymous: false,
  },
  {
    rank: 6,
    userId: '6',
    displayName: 'FatimahExplore',
    points: 640,
    masjidsVisited: 22,
    isAnonymous: false,
  },
  {
    rank: 7,
    userId: '7',
    displayName: 'Anonymous',
    points: 615,
    masjidsVisited: 21,
    isAnonymous: true,
  },
  {
    rank: 8,
    userId: '8',
    displayName: 'ZainalSeeker',
    points: 590,
    masjidsVisited: 20,
    isAnonymous: false,
  },
  {
    rank: 9,
    userId: '9',
    displayName: 'AisyahPrayer',
    points: 565,
    masjidsVisited: 19,
    isAnonymous: false,
  },
  {
    rank: 10,
    userId: '10',
    displayName: 'HafizWanderer',
    points: 530,
    masjidsVisited: 18,
    isAnonymous: false,
  },
];

const mockCurrentUser = {
  rank: 42,
  userId: 'current',
  displayName: 'You',
  points: 350,
  masjidsVisited: 12,
  pointsToNextRank: 8,
};

type TabType = 'monthly' | 'alltime';

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [activeTab, setActiveTab] = useState<TabType>('monthly');

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { backgroundColor: gold[100], borderColor: gold[400] };
      case 2:
        return { backgroundColor: '#F5F5F5', borderColor: '#BDBDBD' };
      case 3:
        return { backgroundColor: '#FBE9E7', borderColor: '#BCAAA4' };
      default:
        return { backgroundColor: colors.backgroundSecondary, borderColor: 'transparent' };
    }
  };

  const renderTopThree = () => {
    const topThree = mockLeaderboard.slice(0, 3);

    return (
      <View style={styles.topThreeContainer}>
        {/* Second Place */}
        <View style={styles.topThreeItem}>
          <View style={[styles.avatar, styles.avatarSecond, { backgroundColor: '#E0E0E0' }]}>
            <Text style={styles.avatarText}>🥈</Text>
          </View>
          <Text style={[styles.topThreeName, { color: colors.text }]} numberOfLines={1}>
            {topThree[1].displayName}
          </Text>
          <Text style={[styles.topThreePoints, { color: colors.textSecondary }]}>
            {topThree[1].points} pts
          </Text>
        </View>

        {/* First Place */}
        <View style={[styles.topThreeItem, styles.topThreeFirst]}>
          <View style={[styles.avatar, styles.avatarFirst, { backgroundColor: gold[200] }]}>
            <Text style={[styles.avatarText, styles.avatarTextFirst]}>🥇</Text>
          </View>
          <Text style={[styles.topThreeName, { color: colors.text }]} numberOfLines={1}>
            {topThree[0].displayName}
          </Text>
          <Text style={[styles.topThreePoints, { color: colors.textSecondary }]}>
            {topThree[0].points} pts
          </Text>
          <Text style={[styles.topThreeMasjids, { color: colors.textTertiary }]}>
            {topThree[0].masjidsVisited} masjids
          </Text>
        </View>

        {/* Third Place */}
        <View style={styles.topThreeItem}>
          <View style={[styles.avatar, styles.avatarThird, { backgroundColor: '#FFCCBC' }]}>
            <Text style={styles.avatarText}>🥉</Text>
          </View>
          <Text style={[styles.topThreeName, { color: colors.text }]} numberOfLines={1}>
            {topThree[2].displayName}
          </Text>
          <Text style={[styles.topThreePoints, { color: colors.textSecondary }]}>
            {topThree[2].points} pts
          </Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = ({ item, index }: { item: typeof mockLeaderboard[0]; index: number }) => {
    if (index < 3) return null; // Skip top 3, rendered separately

    const rankStyle = getRankStyle(item.rank);

    return (
      <View
        style={[
          styles.leaderboardItem,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.rankText, { color: colors.textSecondary }]}>
          {item.rank}
        </Text>
        <View style={[styles.itemAvatar, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={styles.itemAvatarText}>👤</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]}>
            {item.isAnonymous ? 'Anonymous' : item.displayName}
          </Text>
        </View>
        <Text style={[styles.itemPoints, { color: colors.text }]}>
          {item.points} pts
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Leaderboard</Text>
        <TouchableOpacity>
          <IconSymbol name="arrow.clockwise" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'monthly' && [styles.tabActive, { backgroundColor: colors.card }],
          ]}
          onPress={() => setActiveTab('monthly')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'monthly' ? colors.primary : colors.textSecondary },
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'alltime' && [styles.tabActive, { backgroundColor: colors.card }],
          ]}
          onPress={() => setActiveTab('alltime')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'alltime' ? colors.primary : colors.textSecondary },
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Top 3 Podium */}
      {renderTopThree()}

      {/* Rest of Leaderboard */}
      <FlatList
        data={mockLeaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.listFooter}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>
        }
      />

      {/* Current User Card */}
      <Card variant="elevated" padding="md" style={styles.currentUserCard}>
        <View style={styles.currentUserContent}>
          <View style={styles.currentUserLeft}>
            <Text style={[styles.currentUserRank, { color: colors.primary }]}>
              #{mockCurrentUser.rank}
            </Text>
            <View style={[styles.currentUserAvatar, { backgroundColor: primary[100] }]}>
              <Text style={styles.currentUserAvatarText}>👤</Text>
            </View>
            <View>
              <Text style={[styles.currentUserName, { color: colors.text }]}>
                {mockCurrentUser.displayName}
              </Text>
              <Text style={[styles.currentUserMasjids, { color: colors.textTertiary }]}>
                {mockCurrentUser.masjidsVisited} masjids visited
              </Text>
            </View>
          </View>
          <View style={styles.currentUserRight}>
            <Text style={[styles.currentUserPoints, { color: colors.text }]}>
              {mockCurrentUser.points} pts
            </Text>
            <Text style={[styles.nextRankText, { color: colors.success }]}>
              {mockCurrentUser.pointsToNextRank} pts to #{mockCurrentUser.rank - 1}!
            </Text>
          </View>
        </View>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    ...Typography.h2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    padding: 4,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  topThreeItem: {
    alignItems: 'center',
    flex: 1,
  },
  topThreeFirst: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarFirst: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarSecond: {},
  avatarThird: {},
  avatarText: {
    fontSize: 24,
  },
  avatarTextFirst: {
    fontSize: 32,
  },
  topThreeName: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  topThreePoints: {
    ...Typography.caption,
    marginTop: 2,
  },
  topThreeMasjids: {
    ...Typography.caption,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  rankText: {
    width: 32,
    ...Typography.body,
    fontWeight: '600',
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  itemAvatarText: {
    fontSize: 18,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...Typography.body,
    fontWeight: '500',
  },
  itemPoints: {
    ...Typography.body,
    fontWeight: '600',
  },
  listFooter: {
    paddingVertical: Spacing.md,
  },
  divider: {
    height: 1,
  },
  currentUserCard: {
    margin: Spacing.md,
    marginBottom: Spacing.lg,
  },
  currentUserContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currentUserRank: {
    ...Typography.h3,
    fontWeight: '700',
  },
  currentUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentUserAvatarText: {
    fontSize: 20,
  },
  currentUserName: {
    ...Typography.body,
    fontWeight: '600',
  },
  currentUserMasjids: {
    ...Typography.caption,
  },
  currentUserRight: {
    alignItems: 'flex-end',
  },
  currentUserPoints: {
    ...Typography.body,
    fontWeight: '700',
  },
  nextRankText: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
