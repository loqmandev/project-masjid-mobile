/**
 * Mission Progress Item Component
 * Displays individual mission progress with icon and completion status
 */

import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { EventMission, UserMissionProgress, MissionType } from "@/types/limited-event";

interface MissionProgressItemProps {
  mission: EventMission;
  progress?: UserMissionProgress;
  compact?: boolean;
}

const MISSION_ICONS: Record<MissionType, keyof typeof Ionicons.glyphMap> = {
  unique_masjids: "location",
  checkin_count: "checkmark-circle",
  prayer_streak: "flame",
  specific_masjids: "pin",
  district_coverage: "map",
  prayer_times: "sunny",
};

export function MissionProgressItem({
  mission,
  progress,
  compact = false,
}: MissionProgressItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const isCompleted = progress?.isCompleted ?? false;
  const currentProgress = progress?.currentProgress ?? 0;
  const targetCount = mission.targetCount;
  const progressPercentage = Math.min(100, (currentProgress / targetCount) * 100);

  const iconName = MISSION_ICONS[mission.type] || "ellipse";

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View
          style={[
            styles.compactIconContainer,
            {
              backgroundColor: isCompleted
                ? colors.success + "20"
                : colors.primaryLight,
            },
          ]}
        >
          <Ionicons
            name={isCompleted ? "checkmark-circle" : iconName}
            size={16}
            color={isCompleted ? colors.success : colors.primary}
          />
        </View>
        <Text
          style={[styles.compactDescription, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {mission.description}
        </Text>
        <Text style={[styles.compactCount, { color: colors.text }]}>
          {currentProgress}/{targetCount}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isCompleted
                ? colors.success + "20"
                : colors.primaryLight,
            },
          ]}
        >
          <Ionicons
            name={isCompleted ? "checkmark-circle" : iconName}
            size={24}
            color={isCompleted ? colors.success : colors.primary}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.description, { color: colors.text }]}>
            {mission.description}
          </Text>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {currentProgress} of {targetCount} completed
          </Text>
        </View>
        {isCompleted && (
          <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>
      <ProgressBar
        progress={progressPercentage}
        variant={isCompleted ? "gold" : "primary"}
        size="sm"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  progressText: {
    fontSize: 12,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  compactIconContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  compactDescription: {
    flex: 1,
    fontSize: 13,
    marginLeft: Spacing.sm,
  },
  compactCount: {
    fontSize: 13,
    fontWeight: "600",
  },
});
