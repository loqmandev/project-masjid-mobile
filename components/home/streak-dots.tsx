import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface StreakDotsProps {
  currentStreak: number;
  longestStreak?: number;
  daysToShow?: number;
}

interface DayData {
  day: string;
  active: boolean;
  isToday: boolean;
}

export function StreakDots({
  currentStreak,
  longestStreak,
  daysToShow = 7,
}: StreakDotsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Generate last 7 days data
  const weekData = useMemo((): DayData[] => {
    const days: DayData[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      const isToday = i === 0;
      const isActive = i < currentStreak;

      days.push({
        day: dayName,
        active: isActive,
        isToday,
      });
    }

    return days;
  }, [currentStreak, daysToShow]);

  // Get streak-based colors
  const getStreakColor = () => {
    if (currentStreak >= 12) return "#FF4500";
    if (currentStreak >= 8) return "#FF6B35";
    if (currentStreak >= 4) return "#FF8C42";
    return "#FFB347";
  };

  const streakColor = getStreakColor();

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>Streak</Text>

      {/* Main row: Badge + Days */}
      <View style={styles.mainRow}>
        {/* Week Dots */}
        <View style={styles.weekContainer}>
          <View style={styles.dotsRow}>
            {weekData.map((dayData, index) => (
              <View key={index} style={styles.dotWrapper}>
                <View
                  style={[
                    styles.dot,
                    dayData.active
                      ? [
                          styles.dotActive,
                          {
                            backgroundColor: streakColor,
                            shadowColor: streakColor,
                            borderColor: streakColor,
                          },
                        ]
                      : {
                          backgroundColor:
                            colorScheme === "dark" ? "#2A2D2E" : "#E8E8E8",
                          borderColor:
                            colorScheme === "dark"
                              ? styles.dotBorderColorDark.borderColor
                              : styles.dotBorderColorLight.borderColor,
                        },
                    dayData.isToday && styles.dotToday,
                  ]}
                >
                  {dayData.active && (
                    <IconSymbol
                      name="flame.fill"
                      size={dayData.isToday ? 20 : 16}
                      color="#fff"
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color:
                        dayData.active && dayData.isToday
                          ? streakColor
                          : colors.textTertiary,
                    },
                    dayData.isToday && styles.dayLabelToday,
                    dayData.active &&
                      !dayData.isToday && { color: streakColor },
                  ]}
                >
                  {dayData.day}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  weekContainer: {
    flex: 1,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  dotWrapper: {
    alignItems: "center",
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
    borderBottomWidth: 2,
    borderLeftWidth: 3,
    borderRightWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dotBorderColorLight: {
    borderColor: "#E0E0E0",
  },
  dotBorderColorDark: {
    borderColor: "#3A3D3E",
  },
  dotActive: {
    backgroundColor: "#FF6B35",
    borderWidth: 3,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  dotToday: {
    width: 44,
    height: 44,
    borderRadius: 24,
  },
  dayLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "500",
  },
  dayLabelToday: {
    fontSize: 12,
    fontWeight: "700",
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  streakLabel: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  bestLabel: {
    ...Typography.caption,
    fontWeight: "500",
  },
});
