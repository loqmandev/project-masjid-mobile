import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getUserCheckins, UserCheckin } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

/**
 * Format a date string to relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date for section headers (e.g., "January 2026")
 */
function formatMonthYear(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
}

/**
 * Group visits by month
 */
function groupVisitsByMonth(visits: UserCheckin[]): Map<string, UserCheckin[]> {
  const grouped = new Map<string, UserCheckin[]>();

  visits.forEach((visit) => {
    const monthKey = formatMonthYear(visit.checkInAt);
    const existing = grouped.get(monthKey) || [];
    existing.push(visit);
    grouped.set(monthKey, existing);
  });

  return grouped;
}

/**
 * Get status badge variant
 */
function getStatusVariant(
  status: UserCheckin["status"],
): "success" | "warning" | "default" {
  switch (status) {
    case "completed":
      return "success";
    case "checked_in":
      return "warning";
    case "incomplete":
    default:
      return "default";
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: UserCheckin["status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "checked_in":
      return "In Progress";
    case "incomplete":
      return "Incomplete";
    default:
      return status;
  }
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data: session } = useSession();

  const [visits, setVisits] = useState<UserCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load visit history from API
  const loadVisits = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch more visits for the history page (50 items)
      const checkins = await getUserCheckins(50);
      setVisits(checkins);
      setError(null);
    } catch (err) {
      console.error("Failed to load visit history:", err);
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session?.user?.id]);

  // Load data on mount
  useEffect(() => {
    if (session?.user) {
      loadVisits();
    } else {
      setIsLoading(false);
    }
  }, [session?.user, loadVisits]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadVisits();
  }, [loadVisits]);

  // Group visits by month for display
  const groupedVisits = groupVisitsByMonth(visits);

  // Calculate summary stats
  const totalVisits = visits.length;
  const completedVisits = visits.filter((v) => v.status === "completed").length;
  const totalPoints = visits.reduce(
    (sum, v) => sum + (v.actualPointsEarned || 0),
    0,
  );

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{ title: "Visit History", headerBackTitle: "Back" }}
        />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={["bottom"]}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading history...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error && visits.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{ title: "Visit History", headerBackTitle: "Back" }}
        />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={["bottom"]}
        >
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadVisits}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Visit History",
          headerBackTitle: "Back",
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Visit List Grouped by Month */}
          {visits.length > 0 ? (
            Array.from(groupedVisits.entries()).map(([month, monthVisits]) => (
              <View key={month} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {month}
                </Text>
                {monthVisits.map((visit) => (
                  <TouchableOpacity key={visit.id} activeOpacity={0.7}>
                    <Card
                      variant="outlined"
                      padding="md"
                      style={styles.visitCard}
                    >
                      <View style={styles.visitContent}>
                        <View style={styles.visitInfo}>
                          <View style={styles.visitHeader}>
                            <Text
                              style={[styles.visitName, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {visit.masjidName}
                            </Text>
                            {visit.isFirstVisitToMasjid && (
                              <Badge
                                label="First Visit"
                                variant="gold"
                                size="sm"
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.visitDate,
                              { color: colors.textTertiary },
                            ]}
                          >
                            {formatRelativeTime(visit.checkInAt)}
                          </Text>
                          <View style={styles.visitFooter}>
                            <Badge
                              label={getStatusLabel(visit.status)}
                              variant={getStatusVariant(visit.status)}
                              size="sm"
                            />
                            <View
                              style={[
                                styles.pointsBadge,
                                { backgroundColor: colors.primary + "10" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.visitPoints,
                                  { color: colors.primary },
                                ]}
                              >
                                +{visit.actualPointsEarned}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          ) : (
            <Card variant="outlined" padding="lg" style={styles.emptyCard}>
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconContainer,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <IconSymbol
                    name="map.fill"
                    size={48}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No visits yet
                </Text>
                <Text
                  style={[styles.emptySubtext, { color: colors.textSecondary }]}
                >
                  Start exploring masjids and check in to build your history!
                </Text>
                <TouchableOpacity
                  style={[
                    styles.exploreButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => router.push("/(tabs)/explore")}
                >
                  <IconSymbol name="magnifyingglass" size={18} color="#fff" />
                  <Text style={styles.exploreButtonText}>Explore Masjids</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  errorText: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: "#fff",
    ...Typography.button,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.h3,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    ...Typography.h3,
    fontWeight: "700",
    marginBottom: 2,
  },
  summaryLabel: {
    ...Typography.caption,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  visitCard: {
    marginBottom: Spacing.sm,
  },
  visitContent: {
    flexDirection: "row",
  },
  visitIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  visitInfo: {
    flex: 1,
  },
  visitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  visitName: {
    ...Typography.body,
    fontWeight: "600",
    flex: 1,
  },
  visitDate: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  visitFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  visitPoints: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  pointsBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  emptyCard: {
    marginTop: Spacing.lg,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.h3,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exploreButtonText: {
    color: "#fff",
    ...Typography.button,
    fontWeight: "600",
  },
});
