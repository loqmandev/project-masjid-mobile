/**
 * Limited Event Detail Screen
 * Shows event details, missions, progress, and badge preview
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Spacing, BorderRadius, gold } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLimitedEvent, getTimeRemaining } from "@/hooks/use-limited-events";
import { useUserEventParticipation, getEventProgressPercentage, getCompletedMissionsCount } from "@/hooks/use-user-event-participations";
import { MissionProgressItem } from "@/components/events/mission-progress-item";
import { LimitedBadgeCard } from "@/components/events/limited-badge-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BadgeRarity } from "@/types/limited-event";

const RARITY_INFO: Record<BadgeRarity, { color: string; description: string }> = {
  common: { color: "#9E9E9E", description: "A standard badge" },
  rare: { color: "#2196F3", description: "Uncommon and special" },
  epic: { color: "#9C27B0", description: "Hard to earn" },
  legendary: { color: "#FF9800", description: "Extremely rare" },
};

export default function LimitedEventDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: event, isLoading, error, refetch } = useLimitedEvent({ eventId: id });
  const { participation } = useUserEventParticipation(id);

  const [, setTick] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Failed to load event
          </Text>
          <Button variant="outline" onPress={() => refetch()} title="Try Again" />
        </View>
      </SafeAreaView>
    );
  }

  const timeRemaining = getTimeRemaining(event.endDateTime);
  const progress = getEventProgressPercentage(participation);
  const { completed, total } = getCompletedMissionsCount(participation);
  const rarityInfo = RARITY_INFO[event.badge.rarity];
  const isCompleted = participation?.isCompleted ?? false;
  const hasEarnedBadge = participation?.badgeEarned ?? false;

  const formatCountdown = () => {
    if (timeRemaining.total <= 0) return "Event Ended";
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    }
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: event.name,
          headerTransparent: true,
          headerTintColor: "#FFFFFF",
          headerStyle: { backgroundColor: "transparent" },
          headerBackTitle: "Back",
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Banner */}
        <View style={styles.heroContainer}>
          {event.bannerUrl || event.imageUrl ? (
            <Image
              source={{ uri: event.bannerUrl || event.imageUrl || undefined }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder, { backgroundColor: colors.primary }]} />
          )}
          {/* Gradient overlay using nested Views */}
          <View style={styles.heroGradientOverlay} pointerEvents="none">
            <View style={styles.heroGradientTop} />
            <View style={styles.heroGradientBottom} />
          </View>
          <View style={styles.heroContent}>
            {/* Countdown */}
            <View style={styles.countdownContainer}>
              <Ionicons name="time" size={16} color={gold[500]} />
              <Text style={styles.countdownText}>{formatCountdown()}</Text>
            </View>
            {/* Badge Preview */}
            <View style={styles.badgePreview}>
              <LimitedBadgeCard
                badge={event.badge}
                size="lg"
                isEarned={hasEarnedBadge}
              />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Event Description */}
          <Card style={styles.section}>
            <Text style={[styles.description, { color: colors.text }]}>
              {event.description}
            </Text>
            {event.bonusPoints > 0 && (
              <View style={styles.bonusRow}>
                <Ionicons name="star" size={16} color={gold[500]} />
                <Text style={[styles.bonusText, { color: gold[500] }]}>
                  +{event.bonusPoints} bonus points on completion
                </Text>
              </View>
            )}
          </Card>

          {/* Overall Progress */}
          {participation && (
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Progress
              </Text>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressCount, { color: colors.textSecondary }]}>
                  {completed}/{total} missions completed
                </Text>
                <Text style={[styles.progressPercent, { color: colors.primary }]}>
                  {progress}%
                </Text>
              </View>
              <ProgressBar
                progress={progress}
                variant={isCompleted ? "gold" : "primary"}
                size="md"
              />
              {isCompleted && (
                <View style={styles.completedBanner}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.completedText, { color: colors.success }]}>
                    Event Completed!
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Missions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Missions
            </Text>
            {event.missions.map((mission) => {
              const missionProgress = participation?.missionProgress.find(
                (mp) => mp.missionId === mission.id
              );
              return (
                <MissionProgressItem
                  key={mission.id}
                  mission={mission}
                  progress={missionProgress}
                />
              );
            })}
          </View>

          {/* Badge Info */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Reward Badge
            </Text>
            <View style={styles.badgeInfoRow}>
              <LimitedBadgeCard badge={event.badge} size="md" isEarned={hasEarnedBadge} />
              <View style={styles.badgeInfoContent}>
                <Text style={[styles.badgeName, { color: colors.text }]}>
                  {event.badge.name}
                </Text>
                <View style={[styles.rarityPill, { backgroundColor: rarityInfo.color + "20" }]}>
                  <Text style={[styles.rarityLabel, { color: rarityInfo.color }]}>
                    {event.badge.rarity.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>
                  {rarityInfo.description}
                </Text>
                <Text style={[styles.earnedCount, { color: colors.textTertiary }]}>
                  Earned by {event.badge.earnedCount} users
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
  },
  heroContainer: {
    height: 280,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGradientTop: {
    flex: 4,
    backgroundColor: "transparent",
  },
  heroGradientBottom: {
    flex: 6,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  heroContent: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  countdownText: {
    color: gold[500],
    fontSize: 14,
    fontWeight: "600",
  },
  badgePreview: {
    alignItems: "center",
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  bonusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  bonusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  progressCount: {
    fontSize: 14,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  completedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  badgeInfoRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  badgeInfoContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: "600",
  },
  rarityPill: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  rarityLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  badgeDescription: {
    fontSize: 13,
  },
  earnedCount: {
    fontSize: 12,
  },
});
