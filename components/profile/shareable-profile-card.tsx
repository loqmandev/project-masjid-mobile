/**
 * Shareable Profile Card Component
 * Static profile card designed for image capture (no Skia animations)
 * Uses a simple colored View border instead of ChromaRing for reliable capture
 */

import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  BorderRadius,
  gold,
  neutral,
  primary,
  Spacing,
  Typography,
} from "@/constants/theme";

interface RecentMasjid {
  name: string;
}

interface ShareableProfileCardProps {
  displayName: string;
  avatarUrl?: string | null;
  level?: number;
  totalPoints: number;
  uniqueMasjidsVisited: number;
  achievementsUnlocked: number;
  currentStreak: number;
  recentMasjids?: RecentMasjid[];
}

function formatPoints(points: number): string {
  if (points >= 1000) {
    return (points / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return points.toLocaleString();
}

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

export const ShareableProfileCard = React.forwardRef<
  View,
  ShareableProfileCardProps
>(
  (
    {
      displayName,
      avatarUrl,
      level = 0,
      totalPoints,
      uniqueMasjidsVisited,
      achievementsUnlocked,
      currentStreak,
      recentMasjids = [],
    },
    ref,
  ) => {
    const AVATAR_SIZE = 80;
    const RING_SIZE = AVATAR_SIZE + 16;
    const RING_BORDER = 3;

    const stats = [
      {
        sfSymbol: "star.fill",
        ionicon: "star" as const,
        value: formatPoints(totalPoints),
        label: "Points",
        color: gold[600],
      },
      {
        sfSymbol: "location.fill",
        ionicon: "business-outline" as const,
        value: uniqueMasjidsVisited.toString(),
        label: "Masjids",
        color: primary[500],
      },
      {
        sfSymbol: "rosette",
        ionicon: "ribbon" as const,
        value: achievementsUnlocked.toString(),
        label: "Achievements",
        color: primary[500],
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
      <View ref={ref} style={styles.container} collapsable={false}>
        <View style={styles.card}>
          {/* Level Badge - Top Right */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LV {level}</Text>
          </View>

          <View style={styles.content}>
            {/* Avatar + Name Row */}
            <View style={styles.headerRow}>
              {/* Avatar with static border (no Skia) */}
              <View
                style={[
                  styles.avatarRing,
                  {
                    width: RING_SIZE,
                    height: RING_SIZE,
                    borderRadius: RING_SIZE / 2,
                  },
                ]}
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
                      },
                    ]}
                  >
                    <PlatformIcon
                      sfSymbol="person.fill"
                      ionicon="person"
                      size={32}
                      color={primary[500]}
                    />
                  </View>
                )}
              </View>

              {/* Display Name */}
              <Text style={styles.displayName} selectable>
                {displayName}
              </Text>
            </View>

            {/* Stats Grid */}
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
                      <Text style={[styles.statValue, { color: stat.color }]}>
                        {stat.value}
                      </Text>
                    </View>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                  {index < stats.length - 1 && (
                    <View style={styles.statDivider} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Recent Masjids */}
            {recentMasjids.length > 0 && (
              <View style={styles.recentMasjidsSection}>
                <Text style={styles.recentMasjidsTitle}>Recent Masjids</Text>
                <View style={styles.recentMasjidsList}>
                  {recentMasjids.slice(0, 5).map((masjid, index) => (
                    <View key={index} style={styles.masjidItem}>
                      <View style={styles.masjidDot} />
                      <Text style={styles.masjidName} numberOfLines={1}>
                        {masjid.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Branding Footer */}
          <View style={styles.footer}>
            <View style={styles.footerText}>
              <Text style={styles.footerAppName}>Jejak Masjid</Text>
              <Text style={styles.footerUrl}>jejakmasjid.my</Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

ShareableProfileCard.displayName = "ShareableProfileCard";

const styles = StyleSheet.create({
  container: {
    // Fixed width for consistent image output
    width: 400,
    backgroundColor: "#F5F5F7", // Fixed light background for share consistency
    padding: Spacing.md,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    overflow: "visible",
    position: "relative",
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: primary[600],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
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
  avatarRing: {
    borderWidth: 3,
    borderColor: primary[500],
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  avatar: {
    // Dynamic size from props
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: primary[100],
  },
  displayName: {
    ...Typography.h3,
    fontWeight: "700",
    color: neutral[900],
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
    backgroundColor: neutral[200],
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
    color: neutral[600],
  },
  recentMasjidsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: neutral[200],
  },
  recentMasjidsTitle: {
    ...Typography.caption,
    fontWeight: "600",
    color: neutral[500],
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recentMasjidsList: {
    gap: Spacing.xs,
  },
  masjidItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  masjidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: primary[500],
  },
  masjidName: {
    ...Typography.bodySmall,
    color: neutral[700],
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: neutral[200],
  },
  footerEmoji: {
    fontSize: 20,
  },
  footerText: {
    alignItems: "flex-start",
  },
  footerAppName: {
    ...Typography.bodySmall,
    fontWeight: "600",
    color: neutral[900],
  },
  footerUrl: {
    ...Typography.caption,
    color: neutral[500],
  },
});
