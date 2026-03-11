/**
 * Limited Badge Card Component
 * Displays a badge with rarity glow effect
 */

import React from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { BadgeRarity, LimitedBadge, UserLimitedBadge } from "@/types/limited-event";

interface LimitedBadgeCardProps {
  badge: LimitedBadge | UserLimitedBadge;
  size?: "sm" | "md" | "lg";
  showEventName?: boolean;
  showEarnedDate?: boolean;
  isEarned?: boolean;
}

const RARITY_COLORS: Record<BadgeRarity, { primary: string; glow: string; bg: string }> = {
  common: {
    primary: "#9E9E9E",
    glow: "rgba(158, 158, 158, 0.3)",
    bg: "rgba(158, 158, 158, 0.1)",
  },
  rare: {
    primary: "#2196F3",
    glow: "rgba(33, 150, 243, 0.4)",
    bg: "rgba(33, 150, 243, 0.1)",
  },
  epic: {
    primary: "#9C27B0",
    glow: "rgba(156, 39, 176, 0.4)",
    bg: "rgba(156, 39, 176, 0.1)",
  },
  legendary: {
    primary: "#FF9800",
    glow: "rgba(255, 152, 0, 0.5)",
    bg: "rgba(255, 152, 0, 0.15)",
  },
};

const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export function LimitedBadgeCard({
  badge,
  size = "md",
  showEventName = false,
  showEarnedDate = false,
  isEarned = true,
}: LimitedBadgeCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Extract badge data whether it's a LimitedBadge or UserLimitedBadge
  const badgeData = "badge" in badge ? badge.badge : badge;
  const eventData = "event" in badge ? badge.event : null;
  const earnedAt = "earnedAt" in badge ? badge.earnedAt : null;

  const rarityColors = RARITY_COLORS[badgeData.rarity];
  const sizeStyles = {
    sm: { container: 48, icon: 24, fontSize: 10 },
    md: { container: 72, icon: 36, fontSize: 12 },
    lg: { container: 96, icon: 48, fontSize: 14 },
  };

  const sizes = sizeStyles[size];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-MY", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badgeContainer,
          {
            width: sizes.container,
            height: sizes.container,
            borderRadius: sizes.container / 2,
            backgroundColor: rarityColors.bg,
            shadowColor: rarityColors.primary,
            shadowOpacity: isEarned ? 0.4 : 0,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
            elevation: isEarned ? 4 : 0,
          },
        ]}
      >
        <View
          style={[
            styles.badgeInner,
            {
              width: sizes.container - 8,
              height: sizes.container - 8,
              borderRadius: (sizes.container - 8) / 2,
              borderColor: rarityColors.primary,
              opacity: isEarned ? 1 : 0.4,
            },
          ]}
        >
          {badgeData.iconUrl ? (
            <Image
              source={{ uri: badgeData.iconUrl }}
              style={{ width: sizes.icon, height: sizes.icon }}
              resizeMode="contain"
            />
          ) : (
            <Ionicons
              name="ribbon"
              size={sizes.icon}
              color={isEarned ? rarityColors.primary : colors.textSecondary}
            />
          )}
        </View>
      </View>
      <Text
        style={[
          styles.badgeName,
          { color: colors.text },
          !isEarned && styles.lockedText,
        ]}
        numberOfLines={2}
      >
        {badgeData.name}
      </Text>
      <View style={[styles.rarityBadge, { backgroundColor: rarityColors.bg }]}>
        <Text
          style={[
            styles.rarityText,
            { color: rarityColors.primary },
            !isEarned && styles.lockedText,
          ]}
        >
          {RARITY_LABELS[badgeData.rarity]}
        </Text>
      </View>
      {showEventName && eventData && (
        <Text style={[styles.eventName, { color: colors.textSecondary }]} numberOfLines={1}>
          {eventData.name}
        </Text>
      )}
      {showEarnedDate && earnedAt && (
        <Text style={[styles.earnedDate, { color: colors.textSecondary }]}>
          Earned {formatDate(earnedAt)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    maxWidth: 100,
  },
  badgeContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  badgeInner: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  rarityBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  earnedDate: {
    fontSize: 10,
    marginTop: 2,
  },
  lockedText: {
    opacity: 0.5,
  },
});
