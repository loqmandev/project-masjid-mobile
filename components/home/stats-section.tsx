import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { StatTile } from './stat-tile';

interface StatsSectionProps {
  uniqueMasjidsVisited: number;
  totalPoints: number;
  currentStreak: number;
  achievementCount: number;
  colorScheme: 'light' | 'dark';
}

export function StatsSection({
  uniqueMasjidsVisited,
  totalPoints,
  currentStreak,
  achievementCount,
  colorScheme,
}: StatsSectionProps) {
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Curved top edge */}
      <View style={[styles.curve, { backgroundColor: colors.background }]} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatTile
          icon="mosque"
          value={uniqueMasjidsVisited}
          label="Masjids"
          variant="primary"
        />
        <StatTile
          icon="star.fill"
          value={totalPoints}
          label="Points"
          variant="gold"
        />
        <StatTile
          icon="flame.fill"
          value={currentStreak}
          label="Streak"
          variant="streak"
        />
        <StatTile
          icon="trophy"
          value={achievementCount}
          label="Achievements"
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -Spacing.xl, // Overlap with hero section
    paddingTop: 0,
  },
  curve: {
    height: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
});
