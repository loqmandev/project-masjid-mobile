import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface StreakDotsProps {
  currentStreak: number;
  longestStreak?: number;
  lastVisitDate?: string;
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
  lastVisitDate,
  daysToShow = 7,
}: StreakDotsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Generate last 7 days data
  const weekData = useMemo((): DayData[] => {
    const days: DayData[] = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Simple logic: if we have a streak, show recent days as active
    // In a real implementation, you'd calculate this from actual visit dates
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      const isToday = i === 0;

      // Determine if this day was active (visited)
      // For now, we'll approximate based on current streak
      const isActive = i < currentStreak;

      days.push({
        day: dayName,
        active: isActive,
        isToday,
      });
    }

    return days;
  }, [currentStreak, daysToShow]);

  return (
    <View style={styles.container}>
      {/* Dots row */}
      <View style={styles.dotsRow}>
        {weekData.map((dayData, index) => (
          <View
            key={index}
            style={[
              styles.dotWrapper,
              dayData.isToday && { marginTop: -4 },
            ]}
          >
            <View
              style={[
                styles.dot,
                dayData.active
                  ? { backgroundColor: '#FF6B35' }
                  : { backgroundColor: colors.border },
                dayData.isToday && styles.dotToday,
              ]}
            >
              {dayData.active && (
                <IconSymbol name="flame.fill" size={dayData.isToday ? 14 : 10} color="#fff" />
              )}
            </View>
            <Text
              style={[
                styles.dayLabel,
                { color: dayData.isToday ? colors.primary : colors.textTertiary },
                dayData.isToday && styles.dayLabelToday,
              ]}
            >
              {dayData.day}
            </Text>
          </View>
        ))}
      </View>

      {/* Streak text */}
      <Text style={[styles.streakText, { color: colors.text }]}>
        <Text style={{ color: '#FF6B35', fontWeight: '700' }}>{currentStreak} day</Text>
        {currentStreak !== 1 ? 's' : ''} streak
        {longestStreak && longestStreak > currentStreak
          ? ` · Best: ${longestStreak}`
          : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  dotWrapper: {
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotToday: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  dayLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  dayLabelToday: {
    fontSize: 11,
    fontWeight: '700',
  },
  streakText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
});
