/**
 * Limited Badge Showcase Component
 * Horizontal scrollable display of featured badges on profile
 */

import React from "react";
import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LimitedBadgeCard } from "@/components/events/limited-badge-card";
import type { UserLimitedBadge } from "@/types/limited-event";

interface LimitedBadgeShowcaseProps {
  badges: UserLimitedBadge[];
  maxDisplay?: number;
  isOwnProfile?: boolean;
  onEditPress?: () => void;
}

export function LimitedBadgeShowcase({
  badges,
  maxDisplay = 5,
  isOwnProfile = false,
  onEditPress,
}: LimitedBadgeShowcaseProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const displayBadges = badges.slice(0, maxDisplay);
  const hasMore = badges.length > maxDisplay;
  const isEmpty = badges.length === 0;

  const handleViewAll = () => {
    router.push("/limited-badges");
  };

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Limited Badges
          </Text>
        </View>
        <Pressable
          style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/limited-badges")}
        >
          <Ionicons name="ribbon-outline" size={32} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            No badges yet
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
            Participate in events to earn exclusive badges
          </Text>
          {isOwnProfile && (
            <View style={styles.emptyButton}>
              <Text style={[styles.emptyButtonText, { color: colors.primary }]}>
                View Events
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Limited Badges
        </Text>
        <View style={styles.headerActions}>
          {isOwnProfile && onEditPress && (
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={onEditPress}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <Text style={[styles.editText, { color: colors.primary }]}>
                Edit
              </Text>
            </Pressable>
          )}
          <Pressable onPress={handleViewAll}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              View All
            </Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayBadges.map((badge) => (
          <View key={badge.id} style={styles.badgeWrapper}>
            <LimitedBadgeCard
              badge={badge}
              size="md"
              showEventName
              isEarned
            />
          </View>
        ))}
        {hasMore && (
          <Pressable
            style={[styles.moreButton, { backgroundColor: colors.primaryLight }]}
            onPress={handleViewAll}
          >
            <Text style={[styles.moreCount, { color: colors.primary }]}>
              +{badges.length - maxDisplay}
            </Text>
            <Text style={[styles.moreText, { color: colors.primary }]}>
              more
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: "500",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  badgeWrapper: {
    width: 90,
  },
  moreButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  moreCount: {
    fontSize: 18,
    fontWeight: "700",
  },
  moreText: {
    fontSize: 12,
  },
  emptyState: {
    marginHorizontal: Spacing.md,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  emptyHint: {
    fontSize: 13,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
