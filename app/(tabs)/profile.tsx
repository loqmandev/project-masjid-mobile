import { router, Stack } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

import {
  ActivityCalendar,
  MonthlyActivityDay,
} from "@/components/activity/activity-calendar";
import { BadgeSelectorModal } from "@/components/profile/badge-selector-modal";
import { ProfileHeaderCard } from "@/components/profile/profile-header-card";
import { ShareableProfileCard } from "@/components/profile/shareable-profile-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProgressBar } from "@/components/ui/progress-bar";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useShareProfile } from "@/hooks/use-share-profile";
import { useFeaturedBadges } from "@/hooks/use-user-limited-badges";
import { useAnalytics } from "@/lib/analytics";
import {
  getUserAchievements,
  getUserCheckins,
  getUserMonthlyActivity,
  getUserProfile,
  MonthlyActivityResponse,
  UserAchievementProgress,
  UserCheckin,
  UserProfileResponse,
} from "@/lib/api";
import { authClient, useSession } from "@/lib/auth-client";
import {
  clearAllAppData,
  loadCachedUserProfile,
  saveCachedUserProfile,
} from "@/lib/storage";
import { filterLast30DaysMasjids, getDisplayName } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

// Cache validity duration (5 minutes)
const PROFILE_CACHE_MAX_AGE_MS = 5 * 60 * 1000;

// Dummy/Preview data for guest users
const DUMMY_DISPLAY_NAME = "Ahmad Albab";
const DUMMY_TOTAL_POINTS = 2450;
const DUMMY_UNIQUE_MASJIDS = 18;
const DUMMY_TOTAL_CHECKINS = 42;

// Dummy monthly activity - realistic pattern with some gaps and streaks
function generateDummyMonthlyActivity(
  year: number,
  month: number,
): MonthlyActivityDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: MonthlyActivityDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    let count = 0;

    // Friday prayers (higher activity)
    if (dayOfWeek === 5) {
      count = Math.random() > 0.2 ? (Math.random() > 0.5 ? 2 : 1) : 0;
    }
    // Weekend (moderate activity)
    else if (dayOfWeek === 6 || dayOfWeek === 0) {
      count = Math.random() > 0.5 ? 1 : 0;
    }
    // Weekday (lower activity)
    else {
      count = Math.random() > 0.8 ? 1 : 0;
    }

    days.push({
      day,
      hasActivity: count > 0,
      count,
    });
  }

  return days;
}

const DUMMY_ACHIEVEMENTS: UserAchievementProgress[] = [
  {
    achievement: {
      id: "1",
      code: "first_checkin",
      name: "First Steps",
      nameEn: null,
      description: "Complete your first check-in",
      descriptionEn: null,
      type: "explorer",
      badgeTier: "bronze",
      requiredCount: 1,
      bonusPoints: 10,
      sortOrder: 1,
      iconUrl: null,
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    progress: {
      id: "dummy-1",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      userProfileId: "dummy",
      achievementDefinitionId: "1",
      currentProgress: 1,
      requiredProgress: 1,
      progressPercentage: 100,
      isUnlocked: true,
      unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      progressMetadata: null,
    },
  },
  {
    achievement: {
      id: "2",
      code: "week_streak",
      name: "Week Warrior",
      nameEn: null,
      description: "7 days check-in streak",
      descriptionEn: null,
      type: "streak",
      badgeTier: "silver",
      requiredCount: 7,
      bonusPoints: 50,
      sortOrder: 2,
      iconUrl: null,
      isActive: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    progress: {
      id: "dummy-2",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      userProfileId: "dummy",
      achievementDefinitionId: "2",
      currentProgress: 7,
      requiredProgress: 7,
      progressPercentage: 100,
      isUnlocked: true,
      unlockedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      progressMetadata: null,
    },
  },
  {
    achievement: {
      id: "3",
      code: "masjid_explorer",
      name: "Masjid Explorer",
      nameEn: null,
      description: "Visit 10 unique masjids",
      descriptionEn: null,
      type: "geographic",
      badgeTier: "gold",
      requiredCount: 10,
      bonusPoints: 100,
      sortOrder: 3,
      iconUrl: null,
      isActive: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    progress: {
      id: "dummy-3",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      userProfileId: "dummy",
      achievementDefinitionId: "3",
      currentProgress: 10,
      requiredProgress: 10,
      progressPercentage: 100,
      isUnlocked: true,
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      progressMetadata: null,
    },
  },
  {
    achievement: {
      id: "4",
      code: "month_streak",
      name: "Monthly Devotion",
      nameEn: null,
      description: "30 days check-in streak",
      descriptionEn: null,
      type: "streak",
      badgeTier: "platinum",
      requiredCount: 30,
      bonusPoints: 200,
      sortOrder: 4,
      iconUrl: null,
      isActive: true,
      createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    },
    progress: {
      id: "dummy-4",
      createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      userProfileId: "dummy",
      achievementDefinitionId: "4",
      currentProgress: 23,
      requiredProgress: 30,
      progressPercentage: 77,
      isUnlocked: false,
      unlockedAt: null,
      progressMetadata: null,
    },
  },
];

const DUMMY_RECENT_VISITS: UserCheckin[] = [
  {
    id: "1",
    masjidName: "Masjid Negara",
    checkInAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    checkOutAt: null,
    actualPointsEarned: 25,
    isFirstVisitToMasjid: false,
    status: "completed",
  },
  {
    id: "2",
    masjidName: "Masjid Jamek Sultan Abdul Samad",
    checkInAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    checkOutAt: null,
    actualPointsEarned: 30,
    isFirstVisitToMasjid: false,
    status: "completed",
  },
  {
    id: "3",
    masjidName: "Masjid Al-Bukhary",
    checkInAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    checkOutAt: null,
    actualPointsEarned: 20,
    isFirstVisitToMasjid: true,
    status: "completed",
  },
];
interface CachedProfileData {
  profile: UserProfileResponse;
  achievements: UserAchievementProgress[];
  checkins: UserCheckin[];
  monthlyActivity?: MonthlyActivityResponse;
}
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
 * Map achievement tier to badge variant
 */
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
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data: session } = useSession();
  const { track, screen } = useAnalytics();
  const { shareProfile, isSharing, shareableCardRef } = useShareProfile();
  const hasTrackedView = useRef(false);
  const queryClient = useQueryClient();
  // Badge selector modal state
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  // Featured badges for showcase
  const { featuredBadges } = useFeaturedBadges();
  // Current date for month navigation - memoized to avoid dependency warnings
  const today = useMemo(() => new Date(), []);
  // State for API data
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(
    null,
  );
  const [achievements, setAchievements] = useState<UserAchievementProgress[]>(
    [],
  );
  const [recentVisits, setRecentVisits] = useState<UserCheckin[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivityDay[]>(
    [],
  );
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Get user data from session or profile data
  const user = session?.user;
  // Load monthly activity data
  const loadMonthlyActivity = useCallback(
    async (year: number, month: number) => {
      if (!session?.user?.id) return;
      try {
        setIsLoadingActivity(true);
        const response = await getUserMonthlyActivity(year, month);
        setMonthlyActivity(response.days);
      } catch (err) {
        console.error("Failed to load monthly activity:", err);
        // Don't show error for activity loading - it's not critical
        setMonthlyActivity([]);
      } finally {
        setIsLoadingActivity(false);
      }
    },
    [session?.user?.id],
  );
  // Load profile data from API
  const loadProfileData = useCallback(
    async (useCache: boolean = true) => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        // Check cache first
        if (useCache) {
          const cached = loadCachedUserProfile<CachedProfileData>();
          if (cached && cached.userId === session.user.id) {
            const cacheAge = Date.now() - cached.timestamp;
            if (cacheAge < PROFILE_CACHE_MAX_AGE_MS) {
              setProfileData(cached.data.profile);
              setAchievements(cached.data.achievements);
              setRecentVisits(cached.data.checkins);
              if (cached.data.monthlyActivity) {
                setMonthlyActivity(cached.data.monthlyActivity.days);
                setCurrentYear(cached.data.monthlyActivity.year);
                setCurrentMonth(cached.data.monthlyActivity.month);
              }
              setIsLoading(false);
              // Load current month activity in background
              loadMonthlyActivity(today.getFullYear(), today.getMonth() + 1);
              return;
            }
          }
        }
        // Fetch fresh data from API
        const [profile, userAchievements, checkins] = await Promise.all([
          getUserProfile(),
          getUserAchievements(),
          getUserCheckins(100),
        ]);
        setProfileData(profile);
        setAchievements(userAchievements);
        setRecentVisits(checkins);
        setError(null);
        // Load current month activity
        loadMonthlyActivity(today.getFullYear(), today.getMonth() + 1);
        // Cache the data
        saveCachedUserProfile<CachedProfileData>(
          {
            profile,
            achievements: userAchievements,
            checkins,
            monthlyActivity: {
              year: today.getFullYear(),
              month: today.getMonth() + 1,
              days: [],
              totalActiveDays: 0,
              totalVisits: 0,
            },
          },
          session.user.id,
        );
      } catch (err) {
        console.error("Failed to load profile data:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [session?.user?.id, loadMonthlyActivity, today],
  );
  // Load data on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      loadProfileData();
    } else {
      setIsLoading(false);
    }
  }, [session?.user, loadProfileData, loadMonthlyActivity]);
  useEffect(() => {
    if (hasTrackedView.current) return;
    screen("profile");
    track("profile_viewed");
    hasTrackedView.current = true;
  }, [screen, track]);
  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    track("profile_refreshed");
    setIsRefreshing(true);
    loadProfileData(false); // Skip cache on refresh
  }, [loadProfileData, track]);
  const handleMenuPress = (route: string) => {
    track("profile_menu_selected", { route });
    router.push(route as any);
  };
  const handleSignOut = async () => {
    try {
      track("profile_signout");
      // Clear ALL app data including profile cache, demo mode, etc.
      clearAllAppData();
      // Clear all React Query cache to remove stale data
      queryClient.clear();
      // Sign out from auth
      await authClient.signOut();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  // Guest mode - show dummy data to encourage sign-up
  const isGuest = !session?.user;
  const displayName = isGuest
    ? DUMMY_DISPLAY_NAME
    : getDisplayName(
        profileData?.user?.name || user?.name || null,
        profileData?.user?.email || user?.email,
      );
  const avatarUrl = profileData?.user?.image || user?.image || null;
  const totalPoints =
    profileData?.profile?.totalPoints ?? (isGuest ? DUMMY_TOTAL_POINTS : 0);
  const uniqueMasjidsVisited =
    profileData?.profile?.uniqueMasjidsVisited ??
    (isGuest ? DUMMY_UNIQUE_MASJIDS : 5);
  const displayAchievements = (
    isGuest ? DUMMY_ACHIEVEMENTS : (achievements ?? [])
  ).slice(0, 4);
  const displayRecentVisits = isGuest ? DUMMY_RECENT_VISITS : recentVisits;
  const displayMonthlyActivity = isGuest
    ? generateDummyMonthlyActivity(currentYear, currentMonth)
    : monthlyActivity;
  const handleSignUpPress = () => {
    track("profile_sign_up_clicked");
    router.push({
      pathname: "/auth/login",
      params: { returnTo: "/(tabs)/profile" },
    } as any);
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: "Profile", headerShown: false }} />
      {process.env.EXPO_OS === "ios" && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Spacer />
          {!isGuest && (
            <Stack.Toolbar.Button
              icon="square.and.arrow.up"
              onPress={shareProfile}
              disabled={isSharing}
            />
          )}
          <Stack.Toolbar.Button
            icon="gearshape.fill"
            onPress={() => handleMenuPress("/settings")}
          />
        </Stack.Toolbar>
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
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
        {/* Profile Header Card */}
        <Animated.View entering={FadeIn} layout={LinearTransition}>
          <ProfileHeaderCard
            displayName={displayName}
            avatarUrl={avatarUrl}
            level={Math.floor(totalPoints / 100)}
            totalPoints={totalPoints}
            uniqueMasjidsVisited={uniqueMasjidsVisited}
            totalCheckins={
              isGuest
                ? DUMMY_TOTAL_CHECKINS
                : (profileData?.profile?.totalCheckIns ?? recentVisits.length)
            }
            currentStreak={profileData?.profile?.currentStreak ?? 0}
            featuredBadges={isGuest ? [] : featuredBadges}
            onBadgePress={() => setShowBadgeSelector(true)}
            isOwnProfile={!isGuest}
          />
        </Animated.View>
        {/* Activity Calendar Section */}
        <Animated.View
          entering={FadeIn.delay(100)}
          layout={LinearTransition}
          style={styles.section}
        >
          <ActivityCalendar
            year={currentYear}
            month={currentMonth}
            data={displayMonthlyActivity}
            isLoading={isGuest ? false : isLoadingActivity}
          />
        </Animated.View>
        {/* Achievements Section */}
        <Animated.View
          entering={FadeIn.delay(200)}
          layout={LinearTransition}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Achievements
            </Text>
            <TouchableOpacity onPress={() => handleMenuPress("/achievements")}>
              <Text style={[styles.viewAllLink, { color: colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          {displayAchievements.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {displayAchievements.map((item) => {
                const currentProgress = item.progress?.currentProgress ?? 0;
                const requiredCount = item.achievement.requiredCount ?? 1;
                const isUnlocked = item.progress?.isUnlocked ?? false;
                const progressPercent =
                  requiredCount > 0
                    ? Math.round((currentProgress / requiredCount) * 100)
                    : 0;
                return (
                  <Card
                    key={item.achievement.code}
                    variant="outlined"
                    padding="sm"
                    style={[
                      styles.achievementCard,
                      !isUnlocked && styles.achievementCardLocked,
                    ]}
                  >
                    <View style={styles.achievementBadge}>
                      {isUnlocked ? (
                        <IconSymbol
                          name="medal"
                          size={32}
                          color={colors.primary}
                        />
                      ) : (
                        <IconSymbol
                          name="lock"
                          size={32}
                          color={colors.textTertiary}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.achievementName,
                        {
                          color: isUnlocked ? colors.text : colors.textTertiary,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {item.achievement.name}
                    </Text>
                    {isUnlocked ? (
                      <Badge
                        label={
                          item.achievement.badgeTier.charAt(0).toUpperCase() +
                          item.achievement.badgeTier.slice(1)
                        }
                        variant={getTierBadgeVariant(
                          item.achievement.badgeTier,
                        )}
                        size="sm"
                      />
                    ) : (
                      <View style={styles.progressContainer}>
                        <ProgressBar
                          progress={progressPercent}
                          variant="primary"
                          size="sm"
                        />
                        <Text
                          style={[
                            styles.progressText,
                            { color: colors.textTertiary },
                          ]}
                        >
                          {currentProgress}/{requiredCount}
                        </Text>
                      </View>
                    )}
                  </Card>
                );
              })}
            </ScrollView>
          ) : (
            <Card variant="outlined" padding="md">
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                Start checking in to unlock achievements!
              </Text>
            </Card>
          )}
        </Animated.View>
        {/* Recent Visits */}
        <Animated.View
          entering={FadeIn.delay(300)}
          layout={LinearTransition}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Visits
            </Text>
            <TouchableOpacity onPress={() => handleMenuPress("/history")}>
              <Text style={[styles.viewAllLink, { color: colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          {displayRecentVisits.length > 0 ? (
            displayRecentVisits.map((visit) => (
              <View
                key={visit.id}
                style={[styles.visitItem, { borderBottomColor: colors.border }]}
              >
                <View
                  style={[
                    styles.visitIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <IconSymbol
                    name="building.2.fill"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.visitInfo}>
                  <Text style={[styles.visitName, { color: colors.text }]}>
                    {visit.masjidName}
                  </Text>
                  <Text
                    style={[styles.visitDate, { color: colors.textTertiary }]}
                  >
                    {formatRelativeTime(visit.checkInAt)}
                  </Text>
                </View>
                <Text style={[styles.visitPoints, { color: colors.primary }]}>
                  +{visit.actualPointsEarned} pts
                </Text>
              </View>
            ))
          ) : (
            <Card variant="outlined" padding="md">
              <Text
                style={[styles.emptyStateText, { color: colors.textSecondary }]}
              >
                No visits yet. Start exploring masjids!
              </Text>
            </Card>
          )}
        </Animated.View>
        {/* Sign Out Button - Only for authenticated users */}
        {!isGuest && (
          <Animated.View
            entering={FadeIn.delay(400)}
            layout={LinearTransition}
            style={styles.signOutButtonContainer}
          >
            <TouchableOpacity
              style={[
                styles.signOutButton,
                { backgroundColor: colors.error + "15" },
              ]}
              onPress={handleSignOut}
            >
              <IconSymbol
                name="rectangle.portrait.and.arrow.right"
                size={20}
                color={colors.error}
              />
              <Text style={[styles.signOutText, { color: colors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        {/* App Version */}
        <Text style={[styles.versionText, { color: colors.textTertiary }]}>
          Jejak Masjid v1.0.0
        </Text>
      </ScrollView>
      {/* Sign Up Overlay - Only for guest users */}
      {isGuest && (
        <Animated.View
          entering={FadeIn}
          // exiting={FadeOut}
          style={styles.overlayContainer}
        >
          <View
            style={[
              styles.overlayContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.overlayTitle, { color: colors.text }]}>
              Join Jejak Masjid
            </Text>
            <Text
              style={[styles.overlaySubtitle, { color: colors.textSecondary }]}
            >
              Start your journey, earn points, and unlock achievements!
            </Text>
            <TouchableOpacity
              style={[styles.signUpButton, { backgroundColor: colors.primary }]}
              onPress={handleSignUpPress}
            >
              <Text style={[styles.signUpButtonText, { color: "#fff" }]}>
                Sign up Now
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      {/* Floating action buttons — Android only, rendered after overlay to stay on top */}
      {process.env.EXPO_OS === "android" && (
        <Animated.View entering={FadeIn} style={styles.floatingRow}>
          {!isGuest && (
            <TouchableOpacity
              onPress={shareProfile}
              disabled={isSharing}
              style={[styles.fab, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              accessible={true}
              accessibilityLabel="Share profile"
              accessibilityRole="button"
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol
                  name="square.and.arrow.up"
                  size={22}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleMenuPress("/settings")}
            style={[styles.fab, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            accessible={true}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <IconSymbol name="gearshape.fill" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}
      {/* Badge Selector Modal */}
      <BadgeSelectorModal
        visible={showBadgeSelector}
        onClose={() => setShowBadgeSelector(false)}
      />
      {/* Hidden Shareable Profile Card - positioned off-screen for capture */}
      <View style={{ position: "absolute", left: -10000, top: -10000 }}>
        <ShareableProfileCard
          ref={shareableCardRef}
          displayName={displayName}
          avatarUrl={avatarUrl}
          level={Math.floor(totalPoints / 100)}
          totalPoints={totalPoints}
          uniqueMasjidsVisited={uniqueMasjidsVisited}
          totalCheckins={
            isGuest
              ? DUMMY_TOTAL_CHECKINS
              : (profileData?.profile?.totalCheckIns ?? recentVisits.length)
          }
          currentStreak={profileData?.profile?.currentStreak ?? 0}
          last30DaysMasjids={
            filterLast30DaysMasjids(
              isGuest ? DUMMY_RECENT_VISITS : recentVisits,
              10,
            ).masjids
          }
          last30DaysCount={
            filterLast30DaysMasjids(
              isGuest ? DUMMY_RECENT_VISITS : recentVisits,
              10,
            ).totalCount
          }
        />
      </View>
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
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  floatingRow: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 6px 16px rgba(0, 169, 165, 0.35)",
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
  },
  viewAllLink: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  achievementsScroll: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  achievementCard: {
    width: 120,
    alignItems: "center",
  },
  achievementCardLocked: {
    opacity: 0.7,
  },
  achievementBadge: {
    marginBottom: Spacing.xs,
  },
  achievementName: {
    ...Typography.caption,
    textAlign: "center",
    marginBottom: Spacing.xs,
    minHeight: 32,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressText: {
    ...Typography.caption,
    marginTop: 2,
  },
  visitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  visitIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    borderCurve: "continuous",
  },
  visitInfo: {
    flex: 1,
  },
  visitName: {
    ...Typography.bodySmall,
    fontWeight: "500",
  },
  visitDate: {
    ...Typography.caption,
  },
  visitPoints: {
    ...Typography.bodySmall,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  signOutButtonContainer: {
    marginTop: Spacing.md,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderCurve: "continuous",
  },
  signOutText: {
    ...Typography.button,
  },
  versionText: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  emptyStateText: {
    ...Typography.body,
    textAlign: "center",
  },
  // Overlay styles for guest sign-up CTA
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  overlayContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    borderCurve: "continuous",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
  },
  overlayTitle: {
    ...Typography.h2,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  overlaySubtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  signUpButton: {
    width: "100%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderCurve: "continuous",
  },
  signUpButtonText: {
    ...Typography.button,
    fontWeight: "600",
  },
});
