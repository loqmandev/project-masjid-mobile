import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, Typography, primary } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface MonthlyActivityDay {
  day: number;
  hasActivity: boolean;
  count: number;
}

interface ActivityCalendarProps {
  year: number;
  month: number;
  data: MonthlyActivityDay[];
  uniqueMasjidsVisited?: number;
  onDayPress?: (day: number) => void;
  isLoading?: boolean;
}

// GitHub-style compact grid constants
const DOT_SIZE = 52;
const DOT_GAP = 2;
const ROW_GAP = 2;

export function ActivityCalendar({
  year,
  month,
  data,
  uniqueMasjidsVisited = 0,
  onDayPress,
  isLoading = false,
}: ActivityCalendarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  // Get days in month
  const daysInMonth = useMemo(() => {
    const date = new Date(year, month - 1, 1);
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  // Get first day of week for month (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = useMemo(() => {
    return new Date(year, month - 1, 1).getDay();
  }, [year, month]);

  // Pad data to fill full month
  const paddedData = useMemo(() => {
    const result: MonthlyActivityDay[] = [];
    // Add empty cells for days before 1st of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      result.push({ day: 0, hasActivity: false, count: 0 });
    }
    // Add actual day data
    result.push(...data);
    // Fill remaining days with empty data
    while (result.length < firstDayOfWeek + daysInMonth) {
      result.push({
        day: result.length - firstDayOfWeek + 1,
        hasActivity: false,
        count: 0,
      });
    }
    return result;
  }, [data, daysInMonth, firstDayOfWeek]);

  // Get activity color intensity based on visit count
  const getActivityColor = (count: number) => {
    if (count === 0) return colorScheme === "dark" ? "#2a2a2a" : "#e5e7eb";
    if (count === 1) return primary[200];
    if (count === 2) return primary[400];
    if (count <= 4) return primary[600];
    return primary[800];
  };

  // Create weekly rows (7 days per row) for GitHub-style compact grid
  const weeks = useMemo(() => {
    const rows: MonthlyActivityDay[][] = [];
    const currentWeek: MonthlyActivityDay[] = [];

    paddedData.forEach((dayData) => {
      currentWeek.push(dayData);
      if (currentWeek.length === 7) {
        rows.push([...currentWeek]);
        currentWeek.length = 0;
      }
    });

    if (currentWeek.length > 0) {
      rows.push([...currentWeek]);
    }

    return rows;
  }, [paddedData]);

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;

  // Get stats
  const activeDays = data.filter((d) => d.hasActivity).length;
  const totalVisits = data.reduce((sum, day) => sum + (day.count || 0), 0);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>
            {new Date(year, month - 1).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Month Header with stats */}
      <View style={styles.headerRow}>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {new Date(year, month - 1).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </Text>
      </View>

      {/* Day headers */}
      <View style={{ display: "flex", flexDirection: "column" }}>
        <View style={styles.daysHeader}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text
                style={[styles.dayHeaderText, { color: colors.textTertiary }]}
              >
                {day.charAt(0)}
              </Text>
            </View>
          ))}
        </View>
        {/* Calendar Grid - GitHub-style compact */}

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((dayData, dayIndex) => {
              const isEmpty = dayData.day === 0;
              const isToday = isCurrentMonth && dayData.day === today.getDate();
              const activityColor = getActivityColor(dayData.count);

              return (
                <TouchableOpacity
                  key={dayIndex}
                  style={styles.dayCell}
                  disabled={isEmpty}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityLabel={
                    isEmpty
                      ? "Empty"
                      : `${dayData.day} ${dayData.hasActivity ? dayData.count + " visit" + (dayData.count > 1 ? "s" : "") : "No activity"}`
                  }
                  accessibilityState={{ selected: isToday }}
                  accessibilityRole="button"
                >
                  {!isEmpty && (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: activityColor },
                        isToday && styles.dotToday,
                      ]}
                    >
                      {dayData.hasActivity && dayData.count >= 3 && (
                        <IconSymbol name="flame" size={5} color="#fff" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  monthLabel: {
    ...Typography.h3,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    ...Typography.caption,
    fontSize: 11,
  },
  statSeparator: {
    ...Typography.caption,
  },
  loadingContainer: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  daysHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 2,
  },
  dayHeaderText: {
    ...Typography.caption,
    fontSize: Typography.caption.fontSize,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: ROW_GAP,
    gap: DOT_GAP,
  },
  dayCell: {
    width: DOT_SIZE,
    alignItems: "flex-start",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: 2,

    alignItems: "center",
    justifyContent: "center",
  },
  dotToday: {
    borderWidth: 1.5,
    borderColor: primary[600],
  },
});
