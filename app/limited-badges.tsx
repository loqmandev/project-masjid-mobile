/**
 * Limited Badges Screen
 * Displays all earned limited badges with filtering options
 */

import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LimitedBadgeCard } from "@/components/events/limited-badge-card";
import {
  useUserLimitedBadges,
  groupBadgesByRarity,
  sortBadgesByRarity,
} from "@/hooks/use-user-limited-badges";
import { Button } from "@/components/ui/button";
import type { UserLimitedBadge, BadgeRarity } from "@/types/limited-event";

type FilterType = "all" | BadgeRarity;

const RARITY_FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Legendary", value: "legendary" },
  { label: "Epic", value: "epic" },
  { label: "Rare", value: "rare" },
  { label: "Common", value: "common" },
];

export default function LimitedBadgesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const { data: badges, isLoading } = useUserLimitedBadges();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredBadges = useMemo(() => {
    if (!badges) return [];
    const sorted = sortBadgesByRarity(badges);
    if (activeFilter === "all") return sorted;
    return sorted.filter((b) => b.badge.rarity === activeFilter);
  }, [badges, activeFilter]);

  const groupedBadges = useMemo(() => {
    return groupBadgesByRarity(filteredBadges);
  }, [filteredBadges]);

  const handleBadgePress = (badge: UserLimitedBadge) => {
    // Navigate to event detail
    router.push(`/limited-event/${badge.eventId}`);
  };

  const renderBadge = ({ item }: { item: UserLimitedBadge }) => (
    <Pressable
      style={[styles.badgeItem, { backgroundColor: colors.card }]}
      onPress={() => handleBadgePress(item)}
    >
      <LimitedBadgeCard
        badge={item}
        size="md"
        showEventName
        showEarnedDate
        isEarned
      />
    </Pressable>
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="ribbon-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {activeFilter === "all"
            ? "No badges earned yet"
            : `No ${activeFilter} badges`}
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          Participate in limited events to earn exclusive badges
        </Text>
        <Button
          variant="primary"
          onPress={() => router.push("/(tabs)")}
          style={styles.emptyButton}
          title="Find Events"
        />
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Filter Chips */}
      <FlatList
        horizontal
        data={RARITY_FILTERS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  activeFilter === item.value
                    ? colors.primary
                    : colors.card,
                borderColor:
                  activeFilter === item.value
                    ? colors.primary
                    : colors.border,
              },
            ]}
            onPress={() => setActiveFilter(item.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    activeFilter === item.value
                      ? "#FFFFFF"
                      : colors.textSecondary,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* Stats */}
      {badges && badges.length > 0 && (
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            {filteredBadges.length} badge{filteredBadges.length !== 1 ? "s" : ""}
          </Text>
          {Object.entries(groupedBadges).map(([rarity, rarityBadges]) => (
            <View key={rarity} style={styles.statBadge}>
              <Text style={[styles.statBadgeText, { color: colors.textTertiary }]}>
                {rarityBadges.length} {rarity}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Limited Badges",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Limited Badges",
          headerBackTitle: "Back",
        }}
      />
      <FlatList
        data={filteredBadges}
        keyExtractor={(item) => item.id}
        renderItem={renderBadge}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    marginBottom: Spacing.md,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  statsText: {
    fontSize: 14,
  },
  statBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statBadgeText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  row: {
    justifyContent: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  badgeItem: {
    flex: 1 / 3,
    maxWidth: "32%",
    aspectRatio: 0.85,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
    paddingTop: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.md,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyButton: {
    marginTop: Spacing.lg,
  },
});
