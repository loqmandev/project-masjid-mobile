import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AchievementUnlockModal } from "@/components/achievement/achievement-unlock-modal";
import { EventBannerCarousel } from "@/components/events/event-banner-carousel";
import { HeroSection } from "@/components/home/hero-section";
import { StreakDots } from "@/components/home/streak-dots";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { useCheckinMasjids } from "@/hooks/use-checkin-masjids";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLimitedEvents } from "@/hooks/use-limited-events";
import { useLocation } from "@/hooks/use-location";
import { useNearbyMasjids } from "@/hooks/use-nearby-masjids";
import {
  getNextAchievement,
  useUserAchievements,
} from "@/hooks/use-user-achievements";
import { useUserEventParticipations } from "@/hooks/use-user-event-participations";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { AchievementDefinition } from "@/lib/api";
import { MasjidResponse } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { DEMO_LOCATION, isDemoEmail } from "@/lib/demo-mode";
import { getDisplayName } from "@/lib/utils";

// Create animated components
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

// Level calculation
const POINTS_PER_LEVEL = 100;

function calculateLevel(totalPoints: number): {
  level: number;
  currentXP: number;
  nextLevelXP: number;
} {
  const level = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  const currentXP = totalPoints % POINTS_PER_LEVEL;
  const nextLevelXP = POINTS_PER_LEVEL;
  return { level, currentXP, nextLevelXP };
}

function getProgressHint(current: number, required: number): string {
  const progressPercent = current / required;
  if (progressPercent === 0) return "Your first step begins here.";
  if (progressPercent < 0.5) return "The journey begins.";
  if (progressPercent < 0.8) return "Getting closer.";
  return "Almost there!";
}

function getProgressMessage(current: number, required: number): string {
  if (current === 0) return "Start your journey today.";
  if (current === required - 1)
    return `${current}/${required} - One more masjid!`;
  return `${current}/${required} - Keep going.`;
}

function getTierBadgeVariant(
  tier: string,
): "bronze" | "silver" | "gold" | "platinum" | "diamond" {
  const tierMap: Record<
    string,
    "bronze" | "silver" | "gold" | "platinum" | "diamond"
  > = {
    bronze: "bronze",
    silver: "silver",
    gold: "gold",
    platinum: "platinum",
    diamond: "diamond",
  };
  return tierMap[tier.toLowerCase()] || "bronze";
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ unlocked?: string }>();

  // Achievement modal state
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [pendingAchievements, setPendingAchievements] = useState<
    AchievementDefinition[]
  >([]);

  // User data
  const { data: userProfile } = useUserProfile();
  const { data: achievements } = useUserAchievements();
  const { data: session } = useSession();
  const headerName = getDisplayName(
    userProfile?.user?.name || session?.user?.name || null,
    userProfile?.user?.email || session?.user?.email,
  );

  // Check if user is in demo mode
  const isDemoMode = session?.user?.email
    ? isDemoEmail(session.user.email)
    : false;
  const initials =
    headerName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word: string) => word[0])
      .join("")
      .toUpperCase() || "MJ";

  // Level calculation
  const totalPoints = userProfile?.profile?.totalPoints ?? 0;
  const { level, currentXP, nextLevelXP } = calculateLevel(totalPoints);
  const levelProgress = (currentXP / nextLevelXP) * 100;

  // Stats
  const uniqueMasjidsVisited = userProfile?.profile?.uniqueMasjidsVisited ?? 0;
  const currentStreak = userProfile?.profile?.currentStreak ?? 0;
  const longestStreak = userProfile?.profile?.longestStreak ?? 0;
  const achievementCount = userProfile?.profile?.achievementCount ?? 0;
  const avatarUrl = userProfile?.user?.image || null;

  // Achievement
  const nextAchievement = getNextAchievement(achievements);

  // Limited Events
  const { data: activeEvents } = useLimitedEvents({ enabled: !!session?.user });
  const { data: userParticipations } = useUserEventParticipations();

  // Location
  const {
    location,
    isLoading: isLocationLoading,
    error: locationError,
    refresh: refreshLocation,
  } = useLocation();

  // Masjids - combine checkin masjids and nearby masjids
  // Use demo location when in demo mode
  const {
    data: checkinMasjids,
    isLoading: isCheckinLoading,
    error: checkinError,
    refetch: refetchMasjids,
  } = useCheckinMasjids({
    latitude: isDemoMode
      ? DEMO_LOCATION.latitude
      : (location?.latitude ?? null),
    longitude: isDemoMode
      ? DEMO_LOCATION.longitude
      : (location?.longitude ?? null),
  });

  const { data: nearbyMasjids, isLoading: isNearbyLoading } = useNearbyMasjids({
    latitude: isDemoMode
      ? DEMO_LOCATION.latitude
      : (location?.latitude ?? null),
    longitude: isDemoMode
      ? DEMO_LOCATION.longitude
      : (location?.longitude ?? null),
    radius: 5,
  });

  // Merge and prioritize: ready to check-in first, then by distance
  const displayMasjids = useMemo(() => {
    const checkinList: MasjidResponse[] = checkinMasjids ?? [];
    const nearbyList: MasjidResponse[] = nearbyMasjids ?? [];

    // Get ready-to-check-in masjids
    const readyMasjids = checkinList.filter(
      (m: MasjidResponse) => m.canCheckin,
    );

    // Get other masjids not in checkin list, sorted by distance
    const otherMasjids = nearbyList
      .filter(
        (m: MasjidResponse) =>
          !checkinList.some((c: MasjidResponse) => c.masjidId === m.masjidId),
      )
      .sort(
        (a: MasjidResponse, b: MasjidResponse) => a.distanceM - b.distanceM,
      );

    // Combine: ready masjids first, then others, max 4
    return [...readyMasjids, ...otherMasjids].slice(0, 4);
  }, [checkinMasjids, nearbyMasjids]);

  const isLoadingMasjids =
    isLocationLoading || isCheckinLoading || isNearbyLoading;
  const hasMasjidError = locationError || checkinError;

  // Handle achievement unlock from route params (triggered after checkout)
  useEffect(() => {
    if (params.unlocked && achievements) {
      // Parse achievement IDs from params
      const unlockedIds = params.unlocked.split(",").filter(Boolean);

      if (unlockedIds.length > 0) {
        // Find the achievement definitions from the achievements data
        const unlockedAchievements = unlockedIds
          .map((id) => {
            const found = achievements.find(
              (a: { achievement: AchievementDefinition }) =>
                a.achievement.id === id,
            );
            return found?.achievement;
          })
          .filter(Boolean) as AchievementDefinition[];

        if (unlockedAchievements.length > 0) {
          setPendingAchievements(unlockedAchievements);

          // Show modal after a short delay for smooth transition
          const timer = setTimeout(() => {
            setShowAchievementModal(true);
          }, 500);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [params.unlocked, achievements]);

  const handleCloseAchievementModal = () => {
    setShowAchievementModal(false);
    setPendingAchievements([]);

    // Clear the param to prevent re-showing
    router.setParams({ unlocked: undefined });
  };

  // Memoized handlers with haptic feedback
  const handleMasjidPress = useCallback((masjidId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/masjid/${masjidId}`);
  }, []);

  const handleViewAllNearby = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/explore");
  }, []);

  const handleRetryMasjids = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refetchMasjids();
  }, [refetchMasjids]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with stats - immediate animation */}
        <AnimatedView
          entering={FadeInDown.duration(400)}
          layout={LinearTransition.springify()}
        >
          <HeroSection
            userName={headerName}
            initials={initials}
            level={level}
            levelProgress={levelProgress}
            currentXP={currentXP}
            nextLevelXP={nextLevelXP}
            uniqueMasjidsVisited={uniqueMasjidsVisited}
            totalPoints={totalPoints}
            currentStreak={currentStreak}
            achievementCount={achievementCount}
            colorScheme={colorScheme ?? "light"}
            avatarUrl={avatarUrl}
            topInset={insets.top}
          />
        </AnimatedView>

        {/* Limited Events Banner Carousel - 100ms delay */}
        {activeEvents && activeEvents.length > 0 && (
          <AnimatedView
            entering={FadeInDown.delay(100).duration(400)}
            layout={LinearTransition.springify()}
          >
            <EventBannerCarousel
              events={activeEvents}
              userParticipations={userParticipations ?? []}
            />
          </AnimatedView>
        )}

        {/* Nearby Masjid Card - 200ms delay */}
        <AnimatedView
          entering={FadeInDown.delay(200).duration(400)}
          layout={LinearTransition.springify()}
          style={styles.nearbyMasjidCardWrapper}
        >
          <Card
            variant={hasMasjidError ? "error" : "primary"}
            padding="md"
            style={styles.nearbyMasjidCard}
          >
            {isLoadingMasjids ? (
              <AnimatedView entering={FadeIn} style={styles.masjidCardContent}>
                <ActivityIndicator size="small" color={colors.primary} />
                <View style={styles.masjidCardInfo}>
                  <Text
                    style={[styles.masjidCardTitle, { color: colors.text }]}
                  >
                    Finding nearby masjids
                  </Text>
                  <Text
                    style={[
                      styles.masjidCardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Getting your location...
                  </Text>
                </View>
              </AnimatedView>
            ) : hasMasjidError ? (
              <AnimatedTouchableOpacity
                onPress={handleRetryMasjids}
                style={styles.masjidCardContent}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="Retry finding masjids"
                accessibilityHint="Double tap to retry getting your location"
                accessibilityRole="button"
              >
                <IconSymbol
                  name="arrow.clockwise"
                  size={22}
                  color={colors.textSecondary}
                />
                <View style={styles.masjidCardInfo}>
                  <Text
                    style={[styles.masjidCardTitle, { color: colors.text }]}
                  >
                    Can&apos;t find masjids
                  </Text>
                  <Text
                    style={[
                      styles.masjidCardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tap to retry
                  </Text>
                </View>
              </AnimatedTouchableOpacity>
            ) : displayMasjids.length > 0 && displayMasjids[0].canCheckin ? (
              <AnimatedTouchableOpacity
                onPress={() => handleMasjidPress(displayMasjids[0].masjidId)}
                style={styles.masjidCardContent}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={`${displayMasjids[0].name}, ${displayMasjids[0].distanceM} meters away`}
                accessibilityHint="Double tap to view details and check in"
                accessibilityRole="button"
              >
                <View style={styles.masjidCardInfo}>
                  <Text
                    style={[styles.masjidCardTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {displayMasjids[0].name}
                  </Text>
                  <Text
                    style={[
                      styles.masjidCardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {displayMasjids[0].distanceM}m away • Ready to check in
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.textSecondary}
                />
              </AnimatedTouchableOpacity>
            ) : (
              <AnimatedTouchableOpacity
                onPress={handleViewAllNearby}
                style={styles.masjidCardContent}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel="View nearby masjids"
                accessibilityHint="Double tap to explore nearby masjids"
                accessibilityRole="button"
              >
                <IconSymbol
                  name="magnifyingglass"
                  size={22}
                  color={colors.textSecondary}
                />
                <View style={styles.masjidCardInfo}>
                  <Text
                    style={[styles.masjidCardTitle, { color: colors.text }]}
                  >
                    No nearby masjid
                  </Text>
                  <Text
                    style={[
                      styles.masjidCardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tap to explore nearby
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.textSecondary}
                />
              </AnimatedTouchableOpacity>
            )}
          </Card>
        </AnimatedView>

        {/* Current Achievement Focus - 300ms delay */}
        {nextAchievement && nextAchievement.achievement.requiredCount && (
          <AnimatedView
            entering={FadeInDown.delay(300).duration(400)}
            layout={LinearTransition.springify()}
            style={styles.achievementCardWrapper}
          >
            <Card
              variant="outlined"
              padding="md"
              style={styles.achievementCard}
            >
              <View style={styles.achievementHeader}>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>
                  Next Achievement
                </Text>
                {nextAchievement.progress?.isUnlocked && (
                  <Badge
                    label={
                      nextAchievement.achievement.badgeTier
                        .charAt(0)
                        .toUpperCase() +
                      nextAchievement.achievement.badgeTier.slice(1)
                    }
                    variant={getTierBadgeVariant(
                      nextAchievement.achievement.badgeTier,
                    )}
                    size="sm"
                  />
                )}
              </View>

              <View style={styles.achievementContent}>
                <View
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: colors.gold + "15" },
                  ]}
                >
                  <IconSymbol name="medal" size={32} color={colors.gold} />
                </View>
                <View style={styles.achievementInfo}>
                  <Text
                    style={[styles.achievementName, { color: colors.text }]}
                  >
                    {nextAchievement.achievement.name}
                  </Text>
                  <Text
                    style={[
                      styles.achievementHint,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {getProgressHint(
                      Number(nextAchievement.progress?.currentProgress ?? 0),
                      Number(nextAchievement.achievement.requiredCount),
                    )}
                  </Text>
                </View>
              </View>

              <ProgressBar
                progress={
                  (Number(nextAchievement.progress?.currentProgress ?? 0) /
                    Number(nextAchievement.achievement.requiredCount)) *
                  100
                }
                variant="gold"
                size="md"
              />

              <Text
                style={[
                  styles.achievementMessage,
                  { color: colors.textSecondary },
                ]}
              >
                {getProgressMessage(
                  Number(nextAchievement.progress?.currentProgress ?? 0),
                  Number(nextAchievement.achievement.requiredCount),
                )}
              </Text>
            </Card>
          </AnimatedView>
        )}

        {/* Streak Visualization - 400ms delay */}
        {currentStreak > 0 && (
          <AnimatedView
            entering={FadeInDown.delay(400).duration(400)}
            layout={LinearTransition.springify()}
            style={styles.streakCardWrapper}
          >
            <Card variant="outlined" padding="md" style={styles.streakCard}>
              <StreakDots
                currentStreak={currentStreak}
                longestStreak={longestStreak}
              />
            </Card>
          </AnimatedView>
        )}
      </ScrollView>

      {/* Achievement Unlock Modal */}
      <AchievementUnlockModal
        achievements={pendingAchievements}
        visible={showAchievementModal}
        onClose={handleCloseAchievementModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },

  // Nearby Masjid Card
  nearbyMasjidCardWrapper: {
    marginHorizontal: Spacing.md,
  },
  nearbyMasjidCard: {
    borderRadius: 18,
    borderCurve: "continuous",
    // Modern CSS boxShadow
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
  },
  masjidCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 48, // iOS minimum touch target
    paddingVertical: Spacing.xs,
  },
  masjidCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  masjidCardInfo: {
    flex: 1,
  },
  masjidCardTitle: {
    ...Typography.body,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  masjidCardSubtitle: {
    ...Typography.caption,
  },

  // Achievement Card
  achievementCardWrapper: {
    marginHorizontal: Spacing.md,
  },
  achievementCard: {
    borderRadius: 20,
    borderCurve: "continuous",
    // Modern CSS boxShadow
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  achievementTitle: {
    ...Typography.h3,
    fontWeight: "600",
  },
  achievementContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  achievementHint: {
    ...Typography.caption,
  },
  achievementMessage: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },

  // Streak Card
  streakCardWrapper: {
    marginHorizontal: Spacing.md,
  },
  streakCard: {
    borderRadius: 18,
    borderCurve: "continuous",
    // Modern CSS boxShadow
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
  },

  // Section (unused - kept for potential future use)
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: "600",
  },
  viewAllLink: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },

  // Masjid Horizontal Scroll (unused - kept for potential future use)
  masjidScroll: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },

  // Empty State (alternate - kept for potential future use)
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: 16,
  },
  emptyStateText: {
    ...Typography.body,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },

  // Loading State (deprecated - kept for potential future use)
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 16,
  },
  loadingText: {
    ...Typography.bodySmall,
  },

  // Error State (kept for potential future use)
  errorContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: 16,
  },
  errorText: {
    ...Typography.body,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
});
