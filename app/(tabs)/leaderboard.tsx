import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/ui/card";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useAnalytics } from "@/lib/analytics";
import { LeaderboardEntry } from "@/lib/api";

type TabType = "monthly" | "alltime";

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);

  const [activeTab, setActiveTab] = useState<TabType>("monthly");
  const {
    data: leaderboardData,
    currentUser,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useLeaderboard(activeTab);

  // Limit to top 10
  const topTenData = leaderboardData?.slice(0, 10) || [];
  const topThree = topTenData.slice(0, 3);
  const restOfTopTen = topTenData.slice(3);

  const handleRefetch = () => {
    track("leaderboard_refetch", { tab: activeTab });
    refetch();
  };

  useEffect(() => {
    if (hasTrackedView.current) return;
    screen("leaderboard");
    track("leaderboard_viewed", { tab: activeTab });
    hasTrackedView.current = true;
  }, [activeTab, screen, track]);

  useEffect(() => {
    track("leaderboard_tab_switched", { tab: activeTab });
  }, [activeTab, track]);

  const renderTopThree = () => {
    if (topThree.length < 3) return null;

    return (
      <Card
        variant="outlined"
        style={[
          styles.topThreeCard,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <View style={styles.topThreeContainer}>
          {/* Second Place */}
          <View style={[styles.topThreeItem, styles.podiumSecond]}>
            <View
              style={[
                styles.podiumAvatar,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Text
                style={[styles.podiumAvatarText, { color: colors.primary }]}
              >
                {topThree[1].displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              style={[styles.podiumName, { color: colors.text }]}
              numberOfLines={1}
            >
              {topThree[1].displayName}
            </Text>
            <Text
              style={[styles.podiumPoints, { color: colors.textSecondary }]}
            >
              {topThree[1].points} pts
            </Text>
          </View>

          {/* First Place */}
          <View style={[styles.topThreeItem, styles.podiumFirst]}>
            <View
              style={[
                styles.podiumAvatar,
                styles.podiumAvatarFirst,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.podiumAvatarText,
                  styles.podiumAvatarTextFirst,
                  { color: "#fff" },
                ]}
              >
                {topThree[0].displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              style={[
                styles.podiumName,
                styles.podiumNameFirst,
                { color: colors.text },
              ]}
              numberOfLines={1}
            >
              {topThree[0].displayName}
            </Text>
            <Text
              style={[
                styles.podiumPoints,
                styles.podiumPointsFirst,
                { color: colors.textSecondary },
              ]}
            >
              {topThree[0].points} pts
            </Text>
            <Text style={[styles.podiumMeta, { color: colors.textTertiary }]}>
              {topThree[0].masjidsVisited} masjids
            </Text>
          </View>

          {/* Third Place */}
          <View style={[styles.topThreeItem, styles.podiumThird]}>
            <View
              style={[
                styles.podiumAvatar,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Text
                style={[styles.podiumAvatarText, { color: colors.primary }]}
              >
                {topThree[2].displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              style={[styles.podiumName, { color: colors.text }]}
              numberOfLines={1}
            >
              {topThree[2].displayName}
            </Text>
            <Text
              style={[styles.podiumPoints, { color: colors.textSecondary }]}
            >
              {topThree[2].points} pts
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    return (
      <Card
        variant="outlined"
        style={[
          styles.leaderboardItem,
          { backgroundColor: colors.card, borderColor: colors.border },
          item.isCurrentUser && {
            backgroundColor: colors.primary + "10",
            borderColor: colors.primary,
          },
        ]}
      >
        <View
          style={[styles.rankBadge, { backgroundColor: colors.primary + "15" }]}
        >
          <Text style={[styles.rankText, { color: colors.primary }]}>
            #{item.rank}
          </Text>
        </View>
        <View
          style={[
            styles.itemAvatar,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.itemAvatarText, { color: colors.primary }]}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.text }]}>
            {item.displayName}
            {item.isCurrentUser && (
              <Text style={[styles.youLabel, { color: colors.primary }]}>
                {" "}
                (You)
              </Text>
            )}
          </Text>
          <Text style={[styles.itemMeta, { color: colors.textTertiary }]}>
            {item.masjidsVisited} masjids
          </Text>
        </View>
        <View
          style={[
            styles.pointsPill,
            { backgroundColor: colors.primary + "10" },
          ]}
        >
          <Text style={[styles.itemPoints, { color: colors.primary }]}>
            {item.points}
          </Text>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        No leaderboard data available
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        Loading leaderboard...
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorText, { color: colors.error }]}>
        Failed to load leaderboard
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={handleRefetch}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Tabs */}
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "monthly" && [
                styles.tabActive,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => setActiveTab("monthly")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "monthly"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "alltime" && [
                styles.tabActive,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => setActiveTab("alltime")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "alltime"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          renderLoadingState()
        ) : isError ? (
          renderErrorState()
        ) : !topTenData || topTenData.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Top 3 Podium */}
            {renderTopThree()}

            {/* Rest of Top 10 */}
            {restOfTopTen.length > 0 && (
              <FlatList
                data={restOfTopTen}
                renderItem={renderLeaderboardItem}
                keyExtractor={(item) => `${item.rank}-${item.displayName}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => (
                  <View style={styles.listSeparator} />
                )}
                ListFooterComponent={<View style={styles.listFooter} />}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={handleRefetch}
                    tintColor={colors.primary}
                  />
                }
              />
            )}
          </>
        )}

        {/* Current User Card - only show if user is found in leaderboard */}
        {currentUser && !topTenData.some((u) => u.isCurrentUser) && (
          <Card variant="outlined" padding="md" style={styles.currentUserCard}>
            <View style={styles.currentUserContent}>
              <View style={styles.currentUserLeft}>
                <View
                  style={[
                    styles.currentUserRankBadge,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Text
                    style={[styles.currentUserRank, { color: colors.primary }]}
                  >
                    #{currentUser.rank}
                  </Text>
                </View>
                <View>
                  <Text
                    style={[styles.currentUserName, { color: colors.text }]}
                  >
                    {currentUser.displayName}
                  </Text>
                  <Text
                    style={[
                      styles.currentUserMasjids,
                      { color: colors.textTertiary },
                    ]}
                  >
                    {currentUser.masjidsVisited} masjids visited
                  </Text>
                </View>
              </View>
              <View style={styles.currentUserRight}>
                <View
                  style={[
                    styles.currentUserPointsBadge,
                    { backgroundColor: colors.primary + "10" },
                  ]}
                >
                  <Text
                    style={[
                      styles.currentUserPoints,
                      { color: colors.primary },
                    ]}
                  >
                    {currentUser.points}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    ...Typography.h2,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    padding: 4,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  topThreeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  topThreeCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  topThreeItem: {
    alignItems: "center",
    flex: 1,
  },
  podiumFirst: {
    marginBottom: Spacing.xs,
  },
  podiumSecond: {
    marginTop: Spacing.md,
  },
  podiumThird: {
    marginTop: Spacing.lg + Spacing.xs,
  },
  podiumCrown: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  podiumBase: {
    alignItems: "center",
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  podiumAvatarFirst: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
  },
  podiumAvatarText: {
    ...Typography.h3,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  podiumAvatarTextFirst: {
    ...Typography.h2,
    color: "#fff",
  },
  podiumName: {
    ...Typography.bodySmall,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  podiumNameFirst: {
    ...Typography.body,
    fontWeight: "700",
  },
  podiumPoints: {
    ...Typography.caption,
    fontWeight: "500",
  },
  podiumPointsFirst: {
    ...Typography.caption,
    fontWeight: "600",
  },
  podiumMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  rankBadgeLarge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  rankBadgeFirst: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rankBadgeNumber: {
    ...Typography.bodySmall,
    fontWeight: "700",
  },
  rankBadgeNumberFirst: {
    ...Typography.body,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 0,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  listSeparator: {
    height: Spacing.sm,
  },
  rankBadge: {
    minWidth: 44,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  rankText: {
    ...Typography.body,
    fontWeight: "600",
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "500",
  },
  youLabel: {
    fontWeight: "600",
  },
  itemMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  pointsPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  itemPoints: {
    ...Typography.body,
    fontWeight: "600",
  },
  listFooter: {
    paddingVertical: Spacing.md,
  },
  currentUserCard: {
    margin: Spacing.md,
    marginBottom: Spacing.lg,
  },
  currentUserContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentUserLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  currentUserRankBadge: {
    minWidth: 40,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  currentUserRank: {
    ...Typography.body,
    fontWeight: "700",
  },
  currentUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  currentUserAvatarText: {
    ...Typography.h3,
    fontWeight: "700",
  },
  currentUserName: {
    ...Typography.body,
    fontWeight: "600",
  },
  currentUserMasjids: {
    ...Typography.caption,
  },
  currentUserRight: {
    alignItems: "flex-end",
  },
  currentUserPointsBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  currentUserPoints: {
    ...Typography.body,
    fontWeight: "700",
  },
  nextRankText: {
    ...Typography.caption,
    fontWeight: "500",
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyStateText: {
    ...Typography.body,
    textAlign: "center",
  },
});
