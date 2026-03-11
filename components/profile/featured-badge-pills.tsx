/**
 * Featured Badge Pills Component
 * Compact horizontal display of featured badges with rarity colors
 */

import React from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { BadgeRarity, UserLimitedBadge } from "@/types/limited-event";

interface FeaturedBadgePillsProps {
  badges: UserLimitedBadge[];
  maxDisplay?: number;
  onPress?: () => void;
}

const RARITY_COLORS: Record<BadgeRarity, { primary: string; bg: string; border: string }> = {
  common: {
    primary: "#9E9E9E",
    bg: "rgba(158, 158, 158, 0.12)",
    border: "rgba(158, 158, 158, 0.4)",
  },
  rare: {
    primary: "#2196F3",
    bg: "rgba(33, 150, 243, 0.12)",
    border: "rgba(33, 150, 243, 0.4)",
  },
  epic: {
    primary: "#9C27B0",
    bg: "rgba(156, 39, 176, 0.12)",
    border: "rgba(156, 39, 176, 0.4)",
  },
  legendary: {
    primary: "#FF9800",
    bg: "rgba(255, 152, 0, 0.15)",
    border: "rgba(255, 152, 0, 0.5)",
  },
};

function BadgePill({ badge }: { badge: UserLimitedBadge }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const badgeData = badge.badge;
  const rarityColors = RARITY_COLORS[badgeData.rarity];

  return (
    <View style={[styles.pill, { backgroundColor: rarityColors.bg }]}>
      <View
        style={[
          styles.pillIcon,
          { borderColor: rarityColors.primary },
        ]}
      >
        {badgeData.iconUrl ? (
          <Image
            source={{ uri: badgeData.iconUrl }}
            style={styles.iconImage}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name="ribbon"
            size={12}
            color={rarityColors.primary}
          />
        )}
      </View>
      <Text
        style={[styles.pillText, { color: colors.text }]}
        numberOfLines={1}
      >
        {badgeData.name}
      </Text>
    </View>
  );
}

export function FeaturedBadgePills({
  badges,
  maxDisplay = 3,
  onPress,
}: FeaturedBadgePillsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const displayBadges = badges.slice(0, maxDisplay);
  const hasMore = badges.length > maxDisplay;
  const remainingCount = badges.length - maxDisplay;

  if (badges.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {displayBadges.map((badge) => (
        <BadgePill key={badge.id} badge={badge} />
      ))}
      {hasMore && onPress && (
        <Pressable
          style={[styles.morePill, { backgroundColor: colors.primaryLight }]}
          onPress={onPress}
        >
          <Text style={[styles.moreText, { color: colors.primary }]}>
            +{remainingCount}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
    paddingRight: Spacing.md,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
    paddingHorizontal: Spacing.sm,
    paddingRight: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  pillIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  iconImage: {
    width: 14,
    height: 14,
  },
  pillText: {
    ...Typography.caption,
    fontWeight: "500",
    maxWidth: 80,
  },
  morePill: {
    height: 28,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
