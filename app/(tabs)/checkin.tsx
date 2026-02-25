import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBanner } from "@/components/ui/demo-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useActiveCheckin } from "@/hooks/use-active-checkin";
import { useCheckinMasjids } from "@/hooks/use-checkin-masjids";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { useAnalytics } from "@/lib/analytics";
import { checkinToMasjid, checkoutFromMasjid } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { DEMO_LOCATION, DEMO_MASJIDS, isDemoEmail } from "@/lib/demo-mode";
import { useQueryClient } from "@tanstack/react-query";

type VisitState = "idle" | "nearby" | "checked_in";

interface ActiveVisit {
  masjidId: string;
  masjidName: string;
  location: string;
  checkInTime: Date;
  minimumDuration: number; // minutes
}

/**
 * Parse SQLite UTC datetime string to proper JavaScript Date.
 * SQLite stores UTC as: "2026-02-02 01:59:23"
 * JavaScript treats this as local time unless we add 'Z' to indicate UTC.
 *
 * @param dateString - SQLite datetime format (YYYY-MM-DD HH:MM:SS)
 * @returns Date object properly parsed as UTC
 */
function parseSQLiteUTC(dateString: string): Date {
  // Convert "2026-02-02 01:59:23" to "2026-02-02T01:59:23Z"
  // The 'Z' suffix tells JavaScript this is UTC time
  const isoString = dateString.replace(" ", "T") + "Z";
  const date = new Date(isoString);
  // Silently return current date if parsing fails - invalid dates should be handled by caller
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Format remaining seconds as MM:SS
 * Moved outside component to avoid re-creation on every render
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Separate component for the animated check-in button to isolate animation lifecycle
// Memoized to prevent unnecessary re-renders and animation restarts
const PulsingCheckInButton = memo(
  ({
    onPress,
    isLoading,
    colors,
  }: {
    onPress: () => void;
    isLoading: boolean;
    colors: typeof Colors.light;
  }) => {
    const pulseScale = useSharedValue(1);

    useEffect(() => {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true,
      );

      return () => {
        cancelAnimation(pulseScale);
      };
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
      transform: [{ scale: pulseScale.value }],
    }));

    return (
      <Animated.View style={[styles.checkInButtonContainer, pulseStyle]}>
        <TouchableOpacity
          style={[styles.checkInButton, { backgroundColor: colors.primary }]}
          onPress={onPress}
          activeOpacity={0.9}
          disabled={isLoading}
          accessible={true}
          accessibilityLabel="Check in"
          accessibilityHint="Double tap to check in to this masjid"
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol
                name="checkmark.circle.fill"
                size={32}
                color="#FFFFFF"
              />
              <Text style={styles.checkInButtonText}>CHECK IN</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

PulsingCheckInButton.displayName = "PulsingCheckInButton";

export default function CheckInScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);

  // Check if user is in demo mode
  const isDemoMode = session?.user?.email
    ? isDemoEmail(session.user.email)
    : false;

  // State
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Fetch active check-in from backend
  const {
    data: activeCheckin,
    isLoading: isActiveCheckinLoading,
    invalidate: invalidateActiveCheckin,
  } = useActiveCheckin();

  // Minimum duration for check-in (0 for testing, change to 10 for production)
  const MINIMUM_DURATION_MINUTES = 10;

  // Convert backend active checkin to local format
  const activeVisit: ActiveVisit | null = activeCheckin
    ? {
        masjidId: activeCheckin.masjidId,
        masjidName: activeCheckin.masjidName,
        location: "", // Location not provided by backend
        checkInTime: parseSQLiteUTC(activeCheckin.checkInAt),
        minimumDuration: MINIMUM_DURATION_MINUTES,
      }
    : null;

  // Location and nearby masjids
  const {
    location,
    isLoading: isLocationLoading,
    refresh: refreshLocation,
  } = useLocation();

  // Use demo location for demo users, or real location otherwise
  const effectiveLocation = isDemoMode ? DEMO_LOCATION : location;

  const {
    data: checkinMasjids,
    isLoading: isMasjidsLoading,
    refetch: refetchMasjids,
  } = useCheckinMasjids({
    latitude: effectiveLocation?.latitude ?? null,
    longitude: effectiveLocation?.longitude ?? null,
    enabled: !activeVisit,
  });

  // Get the first available masjid for check-in
  // For demo mode, use the demo masjids
  const nearbyMasjid = isDemoMode
    ? DEMO_MASJIDS[0] // Always show Masjid Negara as first option for demo
    : checkinMasjids?.[0];

  // Determine visit state
  const getVisitState = (): VisitState => {
    if (activeVisit) return "checked_in";
    if (nearbyMasjid) return "nearby";
    return "idle";
  };

  const visitState = getVisitState();
  const isLoading =
    isLocationLoading || isMasjidsLoading || isActiveCheckinLoading;
  const lastVisitState = useRef<VisitState | null>(null);

  useEffect(() => {
    if (hasTrackedView.current) return;
    screen("checkin");
    track("checkin_screen_viewed");
    hasTrackedView.current = true;
  }, [screen, track]);

  useEffect(() => {
    if (lastVisitState.current === visitState) return;
    track("checkin_state_changed", {
      state: visitState,
      has_nearby: Boolean(nearbyMasjid),
      has_active_visit: Boolean(activeVisit),
    });
    lastVisitState.current = visitState;
  }, [activeVisit, nearbyMasjid, track, visitState]);

  // Calculate checkout target time when active visit changes
  const checkoutTargetTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (activeVisit) {
      // Set the target checkout time to check-in time + minimum duration
      checkoutTargetTimeRef.current = new Date(
        activeVisit.checkInTime.getTime() +
          MINIMUM_DURATION_MINUTES * 60 * 1000,
      );
    } else {
      checkoutTargetTimeRef.current = null;
      setTimeRemaining(0);
    }
  }, [activeVisit]);

  // Timer countdown for active visit - only depends on activeVisit, not timeRemaining
  useEffect(() => {
    if (!activeVisit || !checkoutTargetTimeRef.current) {
      setTimeRemaining(0);
      return;
    }

    // Use ref to track interval so we can clear it when timer reaches 0
    const intervalRef = { current: null as number | null };

    // Calculate time remaining
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const target = checkoutTargetTimeRef.current!.getTime();
      const remaining = Math.max(0, Math.floor((target - now) / 1000));
      setTimeRemaining(remaining);

      // Stop interval when timer reaches zero to save resources
      if (remaining === 0 && intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Initial calculation
    calculateTimeRemaining();

    // Only set up interval if there's time remaining
    if (checkoutTargetTimeRef.current.getTime() > Date.now()) {
      intervalRef.current = setInterval(calculateTimeRemaining, 1000);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeVisit]);

  // Handle check-in
  const handleCheckIn = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!session?.user) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      track("checkin_auth_required");
      Alert.alert("Sign In Required", "Please sign in to check in to masjids.");
      router.push("/auth/login");
      return;
    }

    if (activeVisit) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      track("checkin_blocked", { reason: "active_visit" });
      Alert.alert(
        "Already Checked In",
        "You have an active visit. Check out to start a new one.",
      );

      return;
    }

    if (!nearbyMasjid) {
      track("checkin_blocked", { reason: "no_nearby_or_location" });
      return;
    }

    // For demo mode, use demo location; otherwise require real location
    const checkInLocation = isDemoMode ? DEMO_LOCATION : location;

    if (!checkInLocation && !isDemoMode) {
      track("checkin_blocked", { reason: "no_location" });
      Alert.alert(
        "Location Required",
        "Please enable location services to check in.",
      );
      return;
    }

    setIsCheckingIn(true);
    try {
      track("checkin_attempted", {
        masjid_id: nearbyMasjid.masjidId,
        distance_m: nearbyMasjid.distanceM,
        isDemo: isDemoMode,
      });
      const result = await checkinToMasjid(
        nearbyMasjid.masjidId,
        checkInLocation!.latitude,
        checkInLocation!.longitude,
      );

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        track("checkin_success", {
          masjid_id: nearbyMasjid.masjidId,
          distance_m: nearbyMasjid.distanceM,
          isDemo: isDemoMode,
        });
        // Invalidate and refetch active checkin from backend
        invalidateActiveCheckin();
        // Also invalidate user profile to update points
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        track("checkin_failed", { reason: result.message ?? "unknown" });
        Alert.alert("Check-in Failed", result.message);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      track("checkin_failed", { reason: "exception" });
      Alert.alert("Error", "Failed to check in. Please try again.");
    } finally {
      setIsCheckingIn(false);
    }
  }, [
    session,
    activeVisit,
    nearbyMasjid,
    location,
    isDemoMode,
    invalidateActiveCheckin,
    queryClient,
    track,
  ]);

  // Handle check-out
  const handleCheckOut = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!activeVisit || !activeCheckin) return;

    // For demo mode, use demo location; otherwise require real location
    const checkOutLocation = isDemoMode ? DEMO_LOCATION : location;

    if (!checkOutLocation && !isDemoMode) {
      Alert.alert(
        "Location Required",
        "Please enable location services to check out.",
      );
      return;
    }

    setIsCheckingOut(true);
    try {
      track("checkout_attempted", {
        masjid_id: activeVisit.masjidId,
        isDemo: isDemoMode,
      });
      const result = await checkoutFromMasjid(
        activeVisit.masjidId,
        checkOutLocation!.latitude,
        checkOutLocation!.longitude,
      );

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        track("checkout_success", {
          masjid_id: activeVisit.masjidId,
          points_earned:
            result.pointsEarned ?? activeCheckin.actualPointsEarned ?? 10,
          is_prayer_time: activeCheckin.isPrayerTime ?? false,
          is_first_visit: activeCheckin.isFirstVisitToMasjid ?? false,
          isDemo: isDemoMode,
        });
        // Invalidate queries to refresh data
        invalidateActiveCheckin();
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
        refetchMasjids();

        // Navigate to celebration screen with checkout result
        router.push({
          pathname: "/checkout-celebration",
          params: {
            pointsEarned: String(
              result.pointsEarned ?? activeCheckin.actualPointsEarned ?? 10,
            ),
            basePoints: String(activeCheckin.basePoints ?? 10),
            bonusPoints: String(activeCheckin.bonusPoints ?? 0),
            isPrayerTime: String(activeCheckin.isPrayerTime ?? false),
            isFirstVisit: String(activeCheckin.isFirstVisitToMasjid ?? false),
            masjidName: activeVisit.masjidName,
            unlockedAchievements: result.unlockedAchievements?.join(",") || "",
          },
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        track("checkout_failed", { reason: result.message ?? "unknown" });
        Alert.alert("Check-out Failed", result.message);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      track("checkout_failed", { reason: "exception" });
      Alert.alert("Error", "Failed to check out. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  }, [
    activeVisit,
    activeCheckin,
    location,
    isDemoMode,
    invalidateActiveCheckin,
    queryClient,
    refetchMasjids,
    track,
  ]);

  // Handle explore
  const handleExplore = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track("explore_from_checkin");
    router.push("/(tabs)/explore");
  }, [track]);

  const handleUpdateFacilities = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!activeVisit) return;
    track("checkin_update_facilities_clicked", {
      masjid_id: activeVisit.masjidId,
    });
    router.push({
      pathname: "/checkin/update-facilities",
      params: {
        masjidId: activeVisit.masjidId,
        masjidName: activeVisit.masjidName,
      },
    });
  }, [activeVisit, track]);

  const handleAddPhotos = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!activeVisit) return;
    track("checkin_add_photos_clicked", { masjid_id: activeVisit.masjidId });
    router.push({
      pathname: "/checkin/add-photos",
      params: {
        masjidId: activeVisit.masjidId,
        masjidName: activeVisit.masjidName,
      },
    });
  }, [activeVisit, track]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track("checkin_refresh_location");
    await refreshLocation();
    await refetchMasjids();
  }, [refreshLocation, refetchMasjids, track]);

  const minimumDuration =
    activeVisit?.minimumDuration ?? MINIMUM_DURATION_MINUTES;

  // Memoize calculations to prevent unnecessary re-renders
  const progressPercentage = useMemo(() => {
    if (!activeVisit) return 0;
    const totalSeconds = minimumDuration * 60;
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  }, [activeVisit, timeRemaining, minimumDuration]);

  const canCheckOut = useMemo(() => {
    // Use <= 1 to give a 1-second buffer for timing edge cases
    return timeRemaining <= 1;
  }, [timeRemaining]);

  const isLoadingState = isLoading && !activeVisit;
  let content: React.ReactNode;

  if (isLoadingState) {
    content = (
      <View style={styles.centeredContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {isLocationLoading
            ? "Getting your location..."
            : "Finding nearby masjids..."}
        </Text>
      </View>
    );
  } else if (visitState === "idle") {
    content = (
      <View style={styles.centeredContent}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <IconSymbol name="mosque" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.idleTitle, { color: colors.text }]}>
          No Masjid Nearby
        </Text>
        <Text style={[styles.idleSubtitle, { color: colors.textSecondary }]}>
          Get within 100 meters of a masjid to check in
        </Text>
        <View style={styles.idleButtons}>
          <Button
            title="Refresh Location"
            variant="outline"
            onPress={handleRefresh}
            style={styles.refreshButton}
          />
          <Button
            title="Explore Nearby Masjids"
            variant="primary"
            onPress={handleExplore}
            style={styles.exploreButton}
          />
        </View>
      </View>
    );
  } else if (visitState === "nearby" && nearbyMasjid) {
    content = (
      <View style={styles.centeredContent}>
        <Text style={[styles.masjidName, { color: colors.text }]}>
          {nearbyMasjid.name}
        </Text>
        <Text style={[styles.masjidLocation, { color: colors.textSecondary }]}>
          {nearbyMasjid.districtName}, {nearbyMasjid.stateName}
        </Text>

        {/* Distance indicator */}
        <View
          style={[
            styles.distanceBadge,
            { backgroundColor: colors.success + "20" },
          ]}
        >
          <IconSymbol name="location.fill" size={14} color={colors.success} />
          <Text style={[styles.distanceText, { color: colors.success }]}>
            {nearbyMasjid.distanceM}m away • Within range
          </Text>
        </View>

        {/* Check-in Button */}
        <PulsingCheckInButton
          onPress={handleCheckIn}
          isLoading={isCheckingIn}
          colors={colors}
        />
      </View>
    );
  } else {
    content = (
      <>
        {/* Header with Checkout Button */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Active Visit
          </Text>
          <TouchableOpacity
            style={[
              styles.headerCheckOutButton,
              {
                backgroundColor: canCheckOut
                  ? colors.primary
                  : colors.backgroundSecondary,
                opacity: canCheckOut ? 1 : 0.6,
              },
            ]}
            onPress={handleCheckOut}
            disabled={!canCheckOut || isCheckingOut}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={
              canCheckOut
                ? "Check out"
                : `Time remaining: ${formatTime(timeRemaining)}`
            }
            accessibilityHint={
              canCheckOut
                ? "Double tap to check out from this masjid"
                : "Wait for the minimum visit time to complete before checking out"
            }
            accessibilityRole="button"
            accessibilityState={{ disabled: !canCheckOut || isCheckingOut }}
          >
            {isCheckingOut ? (
              <ActivityIndicator
                size="small"
                color={canCheckOut ? "#FFFFFF" : colors.textSecondary}
              />
            ) : (
              <>
                <Text
                  style={[
                    styles.headerCheckOutButtonText,
                    { color: canCheckOut ? "#FFFFFF" : colors.textSecondary },
                  ]}
                >
                  {canCheckOut ? "CHECK OUT" : formatTime(timeRemaining)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Masjid Info */}
        <View style={styles.centeredContent}>
          <Text style={[styles.masjidName, { color: colors.text }]}>
            {activeVisit?.masjidName}
          </Text>
          {activeCheckin?.isPrayerTime && activeCheckin?.prayerName && (
            <Text style={[styles.masjidLocation, { color: colors.success }]}>
              {activeCheckin.prayerName} time • 2x points!
            </Text>
          )}
        </View>

        {/* Timer Card */}
        <Card variant="outlined" padding="lg" style={styles.timerCard}>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
            {canCheckOut ? "Ready to check out!" : "Time Remaining"}
          </Text>
          {canCheckOut ? (
            <View style={styles.timerCheckContainer}>
              <IconSymbol
                name="checkmark.circle.fill"
                size={48}
                color={colors.success}
              />
            </View>
          ) : (
            <Text style={[styles.timerValue, { color: colors.text }]}>
              {formatTime(timeRemaining)}
            </Text>
          )}
          <ProgressBar
            progress={progressPercentage}
            variant="primary"
            size="md"
          />
        </Card>

        {/* Contribute Section - Redesigned */}
        <View style={styles.contributeSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Help Other Travellers
          </Text>

          {/* Update Facilities Card */}
          <TouchableOpacity
            onPress={handleUpdateFacilities}
            activeOpacity={0.7}
            style={styles.actionCard}
            accessible={true}
            accessibilityLabel="Update facilities"
            accessibilityHint="Double tap to confirm or update masjid facilities and earn bonus points"
            accessibilityRole="button"
          >
            <Card
              variant="outlined"
              padding="md"
              style={styles.actionCardInner}
            >
              <View style={styles.actionCardHeader}>
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <IconSymbol
                    name="checkmark.seal.fill"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.actionCardInfo}>
                  <Text
                    style={[styles.actionCardTitle, { color: colors.text }]}
                  >
                    Update Facilities
                  </Text>
                  <Text
                    style={[
                      styles.actionCardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Confirm available facilities
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={colors.textTertiary}
                />
              </View>
              <View
                style={[
                  styles.actionBonusBadge,
                  { backgroundColor: Colors.light.gold + "20" },
                ]}
              >
                <IconSymbol
                  name="star.fill"
                  size={12}
                  color={Colors.light.gold}
                />
                <Text
                  style={[styles.actionBonusText, { color: Colors.light.gold }]}
                >
                  First update: +10 pts
                </Text>
              </View>
            </Card>
          </TouchableOpacity>

          {/* Add Photos Card */}
          <TouchableOpacity
            onPress={handleAddPhotos}
            activeOpacity={0.7}
            style={styles.actionCard}
            accessible={true}
            accessibilityLabel="Add photos"
            accessibilityHint="Double tap to share photos of this masjid and earn bonus points"
            accessibilityRole="button"
          >
            <Card
              variant="outlined"
              padding="md"
              style={styles.actionCardInner}
            >
              <View style={styles.actionCardHeader}>
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: colors.success + "15" },
                  ]}
                >
                  <IconSymbol
                    name="camera.fill"
                    size={24}
                    color={colors.success}
                  />
                </View>
                <View style={styles.actionCardInfo}>
                  <Text
                    style={[styles.actionCardTitle, { color: colors.text }]}
                  >
                    Add Photos
                  </Text>
                  <Text
                    style={[
                      styles.actionCardSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Share masjid photos
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={18}
                  color={colors.textTertiary}
                />
              </View>
              <View
                style={[
                  styles.actionBonusBadge,
                  { backgroundColor: Colors.light.gold + "20" },
                ]}
              >
                <IconSymbol
                  name="star.fill"
                  size={12}
                  color={Colors.light.gold}
                />
                <Text
                  style={[styles.actionBonusText, { color: Colors.light.gold }]}
                >
                  First photo: +10 pts
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Points Preview - Moved to bottom */}
        <Card variant="outlined" padding="md" style={styles.pointsPreview}>
          <Text style={[styles.pointsTitle, { color: colors.textSecondary }]}>
            Points You'll Earn
          </Text>
          <View style={styles.pointsRow}>
            <Text style={[styles.pointsLabel, { color: colors.text }]}>
              Base Visit
            </Text>
            <Text style={[styles.pointsValue, { color: colors.text }]}>
              {activeCheckin?.basePoints ?? 10} pts
            </Text>
          </View>
          {activeCheckin?.bonusPoints ? (
            <View style={styles.pointsRow}>
              <Text style={[styles.pointsLabel, { color: colors.text }]}>
                Bonus {activeCheckin.isPrayerTime ? "(Prayer time)" : ""}
                {activeCheckin.isFirstVisitToMasjid ? "(First visit)" : ""}
              </Text>
              <Text style={[styles.pointsValue, { color: colors.success }]}>
                +{activeCheckin.bonusPoints} pts
              </Text>
            </View>
          ) : null}
        </Card>
      </>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isDemoMode && <DemoBanner />}
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h3,
  },
  headerCheckOutButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minHeight: 44, // iOS minimum touch target
  },
  headerCheckOutButtonText: {
    ...Typography.button,
    fontWeight: "600",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  largeEmoji: {
    fontSize: 48,
  },
  veryLargeEmoji: {
    fontSize: 64,
  },
  idleTitle: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  idleSubtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  idleButtons: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  refreshButton: {
    marginBottom: Spacing.sm,
  },
  exploreButton: {
    marginTop: Spacing.md,
  },
  masjidImageLarge: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  masjidName: {
    ...Typography.h1,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  masjidLocation: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  distanceText: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  checkInButtonContainer: {
    marginBottom: Spacing.xl,
  },
  checkInButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00A9A5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  checkInButtonText: {
    color: "#FFFFFF",
    ...Typography.button,
    marginTop: Spacing.sm,
  },
  timerCard: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  timerLabel: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  timerCheckContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  pointsPreview: {
    marginBottom: Spacing.md,
  },
  pointsTitle: {
    ...Typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  pointsLabel: {
    ...Typography.body,
  },
  pointsValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  contributeSection: {
    marginBottom: Spacing.md,
  },
  actionCard: {
    marginBottom: Spacing.sm,
    minHeight: 44, // iOS minimum touch target
  },
  actionCardInner: {
    marginBottom: 0,
  },
  actionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  actionCardInfo: {
    flex: 1,
  },
  actionCardTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  actionCardSubtitle: {
    ...Typography.caption,
  },
  actionBonusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  actionBonusText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  demoToggle: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
});
