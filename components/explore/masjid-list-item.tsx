import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing, Typography } from "@/constants/theme";
import { MasjidResponse, MasjidSearchResult } from "@/lib/api";

/**
 * Helper function to format distance (memoized at module level)
 */
function formatDistanceStatic(distanceM: number): string {
  if (distanceM < 1000) {
    return `${distanceM}m`;
  }
  return `${(distanceM / 1000).toFixed(1)}km`;
}

export interface MasjidListItemProps {
  item: MasjidResponse | MasjidSearchResult;
  textColor: string;
  textSecondaryColor: string;
  textTertiaryColor: string;
  successColor: string;
  checkinIndicatorBg: string;
  onPress: (masjidId: string) => void;
}

/**
 * MasjidListItem - Optimized list item component for masjids
 * Uses React.memo with custom comparison to prevent unnecessary re-renders
 */
function MasjidListItemComponent({
  item,
  textColor,
  textSecondaryColor,
  textTertiaryColor,
  successColor,
  checkinIndicatorBg,
  onPress,
}: MasjidListItemProps) {
  // Check if item has distanceM (nearby masjid) or not (search result)
  const isNearbyMasjid = "distanceM" in item && "canCheckin" in item;
  const distance = isNearbyMasjid
    ? formatDistanceStatic((item as MasjidResponse).distanceM)
    : null;
  const canCheckin = isNearbyMasjid && (item as MasjidResponse).canCheckin;

  const handlePress = () => {
    onPress(item.masjidId);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={`${item.name}${distance ? `, ${distance} away` : ""}`}
      accessibilityHint="Double tap to view details"
      accessibilityRole="button"
      style={styles.cardWrapper}
    >
      <Card variant="outlined" padding="md" style={styles.card}>
        <View style={styles.cardContent}>
          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <Text
                style={[styles.name, { color: textColor }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              {canCheckin && (
                <View
                  style={[
                    styles.checkinIndicator,
                    { backgroundColor: checkinIndicatorBg },
                  ]}
                >
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={16}
                    color={successColor}
                  />
                </View>
              )}
            </View>

            <View style={styles.metaRow}>
              <IconSymbol
                name="location.fill"
                size={14}
                color={textTertiaryColor}
              />
              <Text
                style={[styles.meta, { color: textSecondaryColor }]}
                numberOfLines={1}
              >
                {distance ? `${distance} • ` : ""}
                {item.districtName}, {item.stateName}
              </Text>
            </View>
          </View>

          {/* Status Badge - only show for nearby masjids */}
          {isNearbyMasjid && (
            <View style={styles.statusBadgeContainer}>
              <Badge
                label={canCheckin ? "Ready" : "Too far"}
                variant={canCheckin ? "success" : "default"}
                size="sm"
              />
            </View>
          )}
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
  prevProps: MasjidListItemProps,
  nextProps: MasjidListItemProps,
): boolean {
  // Compare item identity and key fields
  if (prevProps.item.masjidId !== nextProps.item.masjidId) return false;
  if (prevProps.item.name !== nextProps.item.name) return false;
  if (prevProps.item.districtName !== nextProps.item.districtName) return false;
  if (prevProps.item.stateName !== nextProps.item.stateName) return false;

  // For nearby masjids, check distance and checkin status
  const prevIsNearby = "distanceM" in prevProps.item && "canCheckin" in prevProps.item;
  const nextIsNearby = "distanceM" in nextProps.item && "canCheckin" in nextProps.item;
  if (prevIsNearby !== nextIsNearby) return false;

  if (prevIsNearby && nextIsNearby) {
    const prevNearby = prevProps.item as MasjidResponse;
    const nextNearby = nextProps.item as MasjidResponse;
    if (prevNearby.distanceM !== nextNearby.distanceM) return false;
    if (prevNearby.canCheckin !== nextNearby.canCheckin) return false;
  }

  // Compare color props (strings)
  if (prevProps.textColor !== nextProps.textColor) return false;
  if (prevProps.textSecondaryColor !== nextProps.textSecondaryColor) return false;
  if (prevProps.textTertiaryColor !== nextProps.textTertiaryColor) return false;
  if (prevProps.successColor !== nextProps.successColor) return false;
  if (prevProps.checkinIndicatorBg !== nextProps.checkinIndicatorBg) return false;

  // Compare callback reference (should be stable via useCallback)
  if (prevProps.onPress !== nextProps.onPress) return false;

  return true;
}

export const MasjidListItem = memo(MasjidListItemComponent, arePropsEqual);

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
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  name: {
    ...Typography.body,
    fontWeight: "600",
    flex: 1,
    marginRight: Spacing.sm,
  },
  checkinIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  meta: {
    ...Typography.caption,
    flex: 1,
  },
  statusBadgeContainer: {
    alignSelf: "flex-start",
  },
});
