import { Colors, Spacing, Typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CircularProgressWithAvatar } from "./circular-progress";
import { StatRow } from "./stat-row";

interface HeroSectionProps {
  userName: string;
  initials: string;
  level: number;
  levelProgress: number;
  currentXP: number;
  nextLevelXP: number;
  uniqueMasjidsVisited: number;
  totalPoints: number;
  currentStreak: number;
  achievementCount: number;
  colorScheme: "light" | "dark";
}

export function HeroSection({
  userName,
  initials,
  level,
  levelProgress,
  currentXP,
  nextLevelXP,
  uniqueMasjidsVisited,
  totalPoints,
  currentStreak,
  achievementCount,
  colorScheme,
}: HeroSectionProps) {
  const colors = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <View style={[styles.background, { backgroundColor: colors.primary }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.greetingLabel}>Assalamualaikum,</Text>
          <Text style={styles.userName}>{userName}!</Text>
        </View>

        {/* Content Row: Progress on left, Stats on right */}
        <View style={styles.contentRow}>
          {/* Circular Progress on left */}
          <View style={styles.progressContainer}>
            <CircularProgressWithAvatar
              progress={levelProgress}
              initials={initials}
              level={level}
              colorScheme={colorScheme}
              currentXP={currentXP}
              nextLevelXP={nextLevelXP}
            />
          </View>

          {/* Stats on right */}
          <View style={styles.statsContainer}>
            <StatRow
              icon="mosque"
              value={uniqueMasjidsVisited}
              label="Masjids"
              variant="default"
              colorScheme={colorScheme}
            />
            <StatRow
              icon="star.fill"
              value={totalPoints}
              label="Points"
              variant="gold"
              colorScheme={colorScheme}
            />
            <StatRow
              icon="flame.fill"
              value={currentStreak}
              label="Streak"
              variant="streak"
              colorScheme={colorScheme}
            />
            <StatRow
              icon="trophy"
              value={achievementCount}
              label="Achievements"
              variant="default"
              colorScheme={colorScheme}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  background: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    minHeight: 160,
  },
  topBar: {
    marginBottom: Spacing.md,
  },
  greetingLabel: {
    ...Typography.body,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
    marginBottom: 4,
  },
  userName: {
    ...Typography.h1,
    color: "#fff",
    fontWeight: "700",
    fontSize: 24,
  },
  contentRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xl,
    alignItems: "center",
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: 150,
  },
});
