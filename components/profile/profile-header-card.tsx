/**
 * Profile Header Card Component
 * Unified gamified profile card with avatar, name, level badge, and stats
 * Layout: Vertical stack with level badge in top-right
 */

import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/card";
import { ChromaRing } from "@/components/ui/chroma-ring";
import {
  BorderRadius,
  Colors,
  gold,
  primary,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { UserLimitedBadge } from "@/types/limited-event";

// Cross-platform icon: SF Symbols on iOS, Ionicons fallback on Android/Web
function PlatformIcon({
  sfSymbol,
  ionicon,
  size,
  color,
}: {
  sfSymbol: string;
  ionicon: keyof typeof Ionicons.glyphMap;
  size: number;
  color: string;
}) {
  if (process.env.EXPO_OS === "ios") {
    return (
      <ExpoImage
        source={`sf:${sfSymbol}`}
        style={{ width: size, height: size, tintColor: color }}
      />
    );
  }
  return <Ionicons name={ionicon} size={size} color={color} />;
}

interface ProfileHeaderCardProps {
  displayName: string;
  avatarUrl?: string | null;
  level?: number;
  totalPoints: number;
  uniqueMasjidsVisited: number;
  achievementsUnlocked: number;
  currentStreak: number;
  featuredBadges?: UserLimitedBadge[];
  onBadgePress?: () => void;
  isOwnProfile?: boolean;
}

function formatPoints(points: number): string {
  if (points >= 1000) {
    return (points / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return points.toLocaleString();
}

export function ProfileHeaderCard({
  displayName,
  avatarUrl,
  level = 0,
  totalPoints,
  uniqueMasjidsVisited,
  achievementsUnlocked,
  currentStreak,
}: ProfileHeaderCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  const AVATAR_SIZE = 80;
  const RING_SIZE = AVATAR_SIZE + 16; // 96
  const RING_BORDER = 3;

  const stats = [
    {
      sfSymbol: "star.fill",
      ionicon: "star" as const,
      value: formatPoints(totalPoints),
      label: "Points",
      color: isDark ? gold[400] : gold[600],
    },
    {
      sfSymbol: "location.fill",
      ionicon: "business-outline" as const,
      value: uniqueMasjidsVisited.toString(),
      label: "Masjids",
      color: colors.primary,
    },
    {
      sfSymbol: "rosette",
      ionicon: "ribbon" as const,
      value: achievementsUnlocked.toString(),
      label: "Achievements",
      color: colors.primary,
    },
    {
      sfSymbol: "flame.fill",
      ionicon: "flame" as const,
      value: currentStreak.toString(),
      label: "Streak",
      color: "#FF6B35",
    },
  ];

  return (
    <Card variant="default" padding="xs" style={styles.card}>
      {/* Level Badge - Top Right */}
      <View
        style={[
          styles.levelBadge,
          {
            backgroundColor: isDark ? primary[700] : primary[600],
            borderCurve: "continuous",
          },
        ]}
      >
        <Text style={styles.levelText} selectable>
          LV {level}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Avatar + Name Row */}
        <View style={styles.headerRow}>
          {/* Avatar with ChromaRing */}
          <View style={styles.avatarSection}>
            <ChromaRing
              width={RING_SIZE}
              height={RING_SIZE}
              borderRadius={RING_SIZE / 2}
              borderWidth={RING_BORDER}
              base={isDark ? "#1a1a2e" : "#e0e0e0"}
              glow={isDark ? primary[400] : primary[500]}
              background={colors.card}
            >
              {avatarUrl ? (
                <ExpoImage
                  source={{ uri: avatarUrl }}
                  style={[
                    styles.avatar,
                    {
                      width: AVATAR_SIZE - RING_BORDER * 2,
                      height: AVATAR_SIZE - RING_BORDER * 2,
                      borderRadius: (AVATAR_SIZE - RING_BORDER * 2) / 2,
                    },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    {
                      width: AVATAR_SIZE - RING_BORDER * 2,
                      height: AVATAR_SIZE - RING_BORDER * 2,
                      borderRadius: (AVATAR_SIZE - RING_BORDER * 2) / 2,
                      borderCurve: "continuous",
                      backgroundColor: colors.primaryLight,
                    },
                  ]}
                >
                  <PlatformIcon
                    sfSymbol="person.fill"
                    ionicon="person"
                    size={32}
                    color={colors.primary}
                  />
                </View>
              )}
            </ChromaRing>
          </View>

          {/* Display Name */}
          <Text style={[styles.displayName, { color: colors.text }]} selectable>
            {displayName}
          </Text>
        </View>

        {/* Stats Grid - Below Avatar/Name Row */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <React.Fragment key={stat.label}>
              <View style={styles.statItem}>
                <View style={styles.statIconValue}>
                  <PlatformIcon
                    sfSymbol={stat.sfSymbol}
                    ionicon={stat.ionicon}
                    size={18}
                    color={stat.color}
                  />
                  <Text
                    style={[styles.statValue, { color: stat.color }]}
                    selectable
                  >
                    {stat.value}
                  </Text>
                </View>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  {stat.label}
                </Text>
              </View>
              {index < stats.length - 1 && (
                <View
                  style={[
                    styles.statDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    overflow: "visible",
    position: "relative",
  },
  levelBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderCurve: "continuous",
    zIndex: 1,
  },
  levelText: {
    ...Typography.caption,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarSection: {
    // Container for ChromaRing
  },
  avatar: {
    // Dynamic size from props
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  displayName: {
    ...Typography.h3,
    fontWeight: "700",
    flex: 1,
    marginTop: Spacing.sm,
  },
  statsContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 2,
    height: 32,
  },
  statIconValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    ...Typography.body,
    fontWeight: "700",
    fontSize: 17,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 11,
  },
});
