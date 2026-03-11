import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, Typography } from "@/constants/theme";

export interface EventListItemProps {
  id: string;
  name: string;
  masjidName: string;
  dateStr: string;
  timeStr: string;
  distance: string | null;
  textColor: string;
  textSecondaryColor: string;
  onPress: (eventId: string) => void;
}

/**
 * EventListItem - Optimized list item component for events
 * Uses React.memo with custom comparison to prevent unnecessary re-renders
 * Pre-formatted date/time strings are passed as props to avoid formatting in render
 */
function EventListItemComponent({
  id,
  name,
  masjidName,
  dateStr,
  timeStr,
  distance,
  textColor,
  textSecondaryColor,
  onPress,
}: EventListItemProps) {
  const handlePress = () => {
    onPress(id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={`${name} at ${masjidName}`}
      accessibilityHint="Double tap to view event details"
      accessibilityRole="button"
      style={styles.cardWrapper}
    >
      <Card variant="outlined" padding="md" style={styles.card}>
        <View style={styles.cardContent}>
          <Text
            style={[styles.title, { color: textColor }]}
            numberOfLines={2}
          >
            {name}
          </Text>
          <View style={styles.metaRow}>
            <IconSymbol
              name="calendar"
              size={14}
              color={textSecondaryColor}
            />
            <Text
              style={[
                styles.metaText,
                { color: textSecondaryColor },
              ]}
            >
              {dateStr} • {timeStr}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <IconSymbol
              name="location.fill"
              size={14}
              color={textSecondaryColor}
            />
            <Text
              style={[
                styles.metaText,
                { color: textSecondaryColor },
              ]}
              numberOfLines={1}
            >
              {masjidName}
              {distance && ` • ${distance}`}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

/**
 * Custom comparison function for React.memo
 * Only re-render if the props that affect rendering have changed
 */
function arePropsEqual(
  prevProps: EventListItemProps,
  nextProps: EventListItemProps,
): boolean {
  // Compare all props
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.name !== nextProps.name) return false;
  if (prevProps.masjidName !== nextProps.masjidName) return false;
  if (prevProps.dateStr !== nextProps.dateStr) return false;
  if (prevProps.timeStr !== nextProps.timeStr) return false;
  if (prevProps.distance !== nextProps.distance) return false;
  if (prevProps.textColor !== nextProps.textColor) return false;
  if (prevProps.textSecondaryColor !== nextProps.textSecondaryColor) return false;
  if (prevProps.onPress !== nextProps.onPress) return false;

  return true;
}

export const EventListItem = memo(EventListItemComponent, arePropsEqual);

/**
 * Helper function to format distance (memoized at module level)
 */
export function formatEventDistance(distanceM: number | undefined): string | null {
  if (distanceM === undefined) return null;
  if (distanceM < 1000) {
    return `${distanceM}m`;
  }
  return `${(distanceM / 1000).toFixed(1)}km`;
}

/**
 * Helper function to format date
 */
export function formatEventDate(date: Date): string {
  // Format: "Sat, 15 Mar"
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Helper function to format time
 */
export function formatEventTime(date: Date): string {
  // Format: "2:30 PM"
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: Spacing.sm,
  },
  card: {
    minHeight: 88,
    borderRadius: 16,
    borderCurve: "continuous",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
  },
  cardContent: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.body,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.caption,
    flex: 1,
  },
});
