import React, { useEffect, useRef, useState } from "react";
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

import { ChromaRing } from "@/components/ui/chroma-ring";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { useAnalytics } from "@/lib/analytics";
import { LeaderboardEntry } from "@/lib/api";

type TabType = "monthly" | "alltime";

// Avatar component with ChromaRing border
function ChromaAvatar({
  size,
  initial,
  isFirst = false,
  avatarUrl,
}: {
  size: number;
  initial: string;
  isFirst?: boolean;
  avatarUrl?: string | null;
}) {
  const borderWidth = 4;
  const innerSize = size - borderWidth * 2;

  return (
    <ChromaRing
      width={size}
      height={size}
      borderRadius={size / 2}
      borderWidth={borderWidth}
      speed={0.8}
      base={"#333340"}
      glow={"#0a0a0a"}
      background="transparent"
    >
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            }}
          />
        ) : (
          <Text
            selectable
            style={{
              fontSize: isFirst ? 26 : 20,
              fontWeight: "700",
              color: "#00A9A5",
            }}
          >
            {initial.toUpperCase()}
          </Text>
        )}
      </View>
    </ChromaRing>
  );
}

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
      <View
        style={{
          marginHorizontal: Spacing.md,
          marginBottom: Spacing.md,
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 20,
          padding: Spacing.lg,
          borderCurve: "continuous",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: Spacing.sm,
          }}
        >
          {/* Second Place */}
          <View
            style={{ alignItems: "center", flex: 1, marginTop: Spacing.md }}
          >
            <View style={{ marginBottom: Spacing.sm }}>
              <ChromaAvatar
                size={56}
                initial={topThree[1].displayName.charAt(0)}
                avatarUrl={topThree[1].avatarUrl}
              />
            </View>
            <Text
              selectable
              numberOfLines={1}
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.text,
                textAlign: "center",
                marginBottom: 2,
              }}
            >
              {topThree[1].displayName}
            </Text>
            <Text
              selectable
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.textSecondary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {topThree[1].points} pts
            </Text>
          </View>

          {/* First Place */}
          <View
            style={{ alignItems: "center", flex: 1, marginBottom: Spacing.xs }}
          >
            <View style={{ marginBottom: Spacing.sm }}>
              <ChromaAvatar
                size={72}
                initial={topThree[0].displayName.charAt(0)}
                isFirst
                avatarUrl={topThree[0].avatarUrl}
              />
            </View>
            <Text
              selectable
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.text,
                textAlign: "center",
                marginBottom: 2,
              }}
            >
              {topThree[0].displayName}
            </Text>
            <Text
              selectable
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.textSecondary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {topThree[0].points} pts
            </Text>
            <Text
              selectable
              style={{
                fontSize: 11,
                color: colors.textTertiary,
                marginTop: 2,
              }}
            >
              {topThree[0].masjidsVisited} masjids
            </Text>
          </View>

          {/* Third Place */}
          <View
            style={{
              alignItems: "center",
              flex: 1,
              marginTop: Spacing.lg + Spacing.xs,
            }}
          >
            <View style={{ marginBottom: Spacing.sm }}>
              <ChromaAvatar
                size={56}
                initial={topThree[2].displayName.charAt(0)}
                avatarUrl={topThree[2].avatarUrl}
              />
            </View>
            <Text
              selectable
              numberOfLines={1}
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.text,
                textAlign: "center",
                marginBottom: 2,
              }}
            >
              {topThree[2].displayName}
            </Text>
            <Text
              selectable
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.textSecondary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {topThree[2].points} pts
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
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
        <View
          style={{
            minWidth: 44,
            paddingHorizontal: Spacing.sm,
            paddingVertical: 6,
            borderRadius: 10,
            backgroundColor: colors.primary + "15",
            alignItems: "center",
            justifyContent: "center",
            marginRight: Spacing.sm,
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.primary,
              fontVariant: ["tabular-nums"],
            }}
          >
            #{item.rank}
          </Text>
        </View>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
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
              style={{ width: 40, height: 40, borderRadius: 20 }}
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
        <View style={{ flex: 1 }}>
          <Text
            selectable
            style={{ fontSize: 15, fontWeight: "500", color: colors.text }}
          >
            {item.displayName}
            {item.isCurrentUser && (
              <Text style={{ fontWeight: "600", color: colors.primary }}>
                {" "}
                (You)
              </Text>
            )}
          </Text>
          <Text
            selectable
            style={{
              fontSize: 12,
              color: colors.textTertiary,
              marginTop: 2,
              fontVariant: ["tabular-nums"],
            }}
          >
            {item.masjidsVisited} masjids
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: Spacing.sm,
            paddingVertical: 6,
            borderRadius: 10,
            backgroundColor: colors.primary + "10",
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.primary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {item.points}
          </Text>
        </View>
      </View>
    );
  };

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

  const ListHeaderComponent = () => (
    <>
      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: Spacing.md,
          padding: 4,
          borderRadius: 14,
          marginBottom: Spacing.md,
          backgroundColor: colors.backgroundSecondary,
        }}
      >
        <Pressable
          onPress={() => setActiveTab("monthly")}
          style={{
            flex: 1,
            paddingVertical: Spacing.md,
            minHeight: 44,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor:
              activeTab === "monthly" ? colors.card : "transparent",
            boxShadow:
              activeTab === "monthly" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color:
                activeTab === "monthly" ? colors.primary : colors.textSecondary,
            }}
          >
            Monthly
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("alltime")}
          style={{
            flex: 1,
            paddingVertical: Spacing.md,
            minHeight: 44,
            alignItems: "center",
            borderRadius: 10,
            backgroundColor:
              activeTab === "alltime" ? colors.card : "transparent",
            boxShadow:
              activeTab === "alltime" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color:
                activeTab === "alltime" ? colors.primary : colors.textSecondary,
            }}
          >
            All Time
          </Text>
        </Pressable>
      </View>

      {/* Top 3 Podium */}
      {renderTopThree()}
    </>
  );

  const ListFooterComponent = () => {
    // Add extra padding when floating card is shown to prevent overlap
    const extraPadding =
      currentUser && !topTenData.some((u) => u.isCurrentUser) ? 100 : 0;
    return <View style={{ paddingBottom: Spacing.xl + extraPadding }} />;
  };

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
          paddingHorizontal: Spacing.md,
          paddingBottom: insets.bottom + Spacing.sm,
          paddingTop: Spacing.sm,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.md,
            borderRadius: 16,
            borderWidth: 1,
            borderCurve: "continuous",
            backgroundColor: colors.primary + "10",
            borderColor: colors.primary,
            boxShadow: "0 2px 8px rgba(0, 169, 165, 0.15)",
          }}
        >
          <View
            style={{
              minWidth: 44,
              paddingHorizontal: Spacing.sm,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: colors.primary + "15",
              alignItems: "center",
              justifyContent: "center",
              marginRight: Spacing.sm,
            }}
          >
            <Text
              selectable
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.primary,
                fontVariant: ["tabular-nums"],
              }}
            >
              #{currentUser.rank}
            </Text>
          </View>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary + "15",
              justifyContent: "center",
              alignItems: "center",
              marginRight: Spacing.md,
              overflow: "hidden",
            }}
          >
            {currentUser.avatarUrl ? (
              <Image
                source={{ uri: currentUser.avatarUrl }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
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
                {currentUser.displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              selectable
              style={{ fontSize: 15, fontWeight: "500", color: colors.text }}
            >
              {currentUser.displayName}
              <Text style={{ fontWeight: "600", color: colors.primary }}>
                {" "}
                (You)
              </Text>
            </Text>
            <Text
              selectable
              style={{
                fontSize: 12,
                color: colors.textTertiary,
                marginTop: 2,
                fontVariant: ["tabular-nums"],
              }}
            >
              {currentUser.masjidsVisited} masjids
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: Spacing.sm,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: colors.primary + "10",
            }}
          >
            <Text
              selectable
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.primary,
                fontVariant: ["tabular-nums"],
              }}
            >
              {currentUser.points}
            </Text>
          </View>
        </View>
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
      <FlatList
        data={restOfTopTen}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => `${item.rank}-${item.displayName}`}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: Spacing.xs,
        }}
        ListHeaderComponent={ListHeaderComponent}
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
