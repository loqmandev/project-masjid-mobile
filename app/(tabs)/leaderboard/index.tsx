import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useAnalytics } from "@/lib/analytics";
import { LeaderboardEntry } from "@/lib/api";

type TabType = "monthly" | "alltime";

// Memoized list item component for performance
const LeaderboardItem = React.memo<{
  item: LeaderboardEntry;
  colors: (typeof Colors)["light"];
}>(function LeaderboardItem({ item, colors }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        marginHorizontal: Spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderCurve: "continuous",
        backgroundColor: item.isCurrentUser
          ? colors.primary + "10"
          : colors.card,
        borderColor: item.isCurrentUser ? colors.primary : colors.border,
        boxShadow: item.isCurrentUser
          ? "0 2px 8px rgba(0, 169, 165, 0.15)"
          : "0 1px 2px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Rank */}
      <Text
        selectable
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: colors.textTertiary,
          fontVariant: ["tabular-nums"],
          minWidth: 28,
          textAlign: "center",
          marginRight: Spacing.sm,
        }}
      >
        {item.rank}
      </Text>

      {/* Avatar */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.primary + "15",
          justifyContent: "center",
          alignItems: "center",
          marginRight: Spacing.md,
          overflow: "hidden",
        }}
      >
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
            style={{ width: 44, height: 44, borderRadius: 22 }}
          />
        ) : (
          <Text
            selectable
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.primary,
            }}
          >
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      {/* Name and Badge area */}
      <View style={{ flex: 1, marginRight: Spacing.sm }}>
        <Text
          selectable
          numberOfLines={1}
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
          }}
        >
          {item.displayName}
          {item.isCurrentUser && (
            <Text style={{ fontWeight: "600", color: colors.primary }}>
              {" "}
              (You)
            </Text>
          )}
        </Text>
        {/* TODO: Badge - will show user's featured badge here */}
        <View style={{ marginTop: 4 }}>
          {/* <Badge label="Ramadan 2026" variant="gold" size="sm" /> */}
        </View>
      </View>

      {/* Stats on the right */}
      <View style={{ alignItems: "flex-end" }}>
        <Text
          selectable
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.primary,
            fontVariant: ["tabular-nums"],
          }}
        >
          {item.points.toLocaleString()}
        </Text>
        <Text
          selectable
          style={{
            fontSize: 11,
            color: colors.textTertiary,
            marginTop: 2,
            fontVariant: ["tabular-nums"],
          }}
        >
          {item.masjidsVisited} masjids
        </Text>
      </View>
    </View>
  );
});

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>("monthly");
  const {
    data: leaderboardData,
    currentUser,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useLeaderboard(activeTab);

  // All top 10 in single list
  const topTenData = leaderboardData?.slice(0, 10) || [];

  const handleRefetch = useCallback(() => {
    track("leaderboard_refetch", { tab: activeTab });
    refetch();
  }, [activeTab, refetch, track]);

  useEffect(() => {
    if (hasTrackedView.current) return;
    screen("leaderboard");
    track("leaderboard_viewed", { tab: activeTab });
    hasTrackedView.current = true;
  }, [activeTab, screen, track]);

  useEffect(() => {
    track("leaderboard_tab_switched", { tab: activeTab });
  }, [activeTab, track]);

  const renderLeaderboardItem = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <LeaderboardItem item={item} colors={colors} />
    ),
    [colors],
  );

  const keyExtractor = useCallback(
    (item: LeaderboardEntry) => `${item.rank}-${item.displayName}`,
    [],
  );

  const renderEmptyState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
      }}
    >
      <Text
        selectable
        style={{
          fontSize: 16,
          textAlign: "center",
          color: colors.textSecondary,
        }}
      >
        No leaderboard data available
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: Spacing.md,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ fontSize: 16, color: colors.textSecondary }}>
        Loading leaderboard...
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: Spacing.md,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <Text
        selectable
        style={{ fontSize: 16, textAlign: "center", color: colors.error }}
      >
        Failed to load leaderboard
      </Text>
      <Pressable
        onPress={handleRefetch}
        style={{
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          borderRadius: 10,
          backgroundColor: colors.primary,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
          Retry
        </Text>
      </Pressable>
    </View>
  );

  const ListFooterComponent = useCallback(() => {
    // Add extra padding when floating card is shown to prevent overlap
    const extraPadding =
      currentUser && !topTenData.some((u) => u.isCurrentUser) ? 100 : 0;
    return <View style={{ paddingBottom: Spacing.xl + extraPadding }} />;
  }, [currentUser, topTenData]);

  const renderFloatingCurrentUserCard = () => {
    if (!currentUser || topTenData.some((u) => u.isCurrentUser)) {
      return null;
    }

    return (
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + Spacing.sm,
          paddingTop: Spacing.sm,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <LeaderboardItem item={currentUser} colors={colors} />
      </View>
    );
  };

  if (isLoading) {
    return <>{renderLoadingState()}</>;
  }

  if (isError) {
    return <>{renderErrorState()}</>;
  }

  if (!topTenData || topTenData.length === 0) {
    return <>{renderEmptyState()}</>;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <SegmentedControl
              values={["Monthly", "All Time"]}
              selectedIndex={activeTab === "monthly" ? 0 : 1}
              onChange={({ nativeEvent }) => {
                setActiveTab(
                  nativeEvent.selectedSegmentIndex === 0
                    ? "monthly"
                    : "alltime",
                );
              }}
              style={{ width: 200, marginBottom: Spacing.lg }}
            />
          ),
        }}
      />
      <FlatList
        data={topTenData}
        renderItem={renderLeaderboardItem}
        keyExtractor={keyExtractor}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: Spacing.sm,
        }}
        ListFooterComponent={ListFooterComponent}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefetch}
            tintColor={colors.primary}
          />
        }
      />
      {renderFloatingCurrentUserCard()}
    </>
  );
}
