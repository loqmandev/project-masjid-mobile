import * as Haptics from "expo-haptics";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  PlatformColor,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  LinearTransition,
  SlideInRight,
} from "react-native-reanimated";

import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Card } from "@/components/ui/card";
import { DemoBanner } from "@/components/ui/demo-banner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography
} from "@/constants/theme";
import { useBottomSheet } from "@/hooks/use-bottom-sheet";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEvents } from "@/hooks/use-events";
import { useFacilities } from "@/hooks/use-facilities";
import { useLocation } from "@/hooks/use-location";
import { useMasjidSearch } from "@/hooks/use-masjid-search";
import { useNearbyMasjids } from "@/hooks/use-nearby-masjids";
import {
  FacilityOption,
  MasjidEvent,
  MasjidResponse,
  MasjidSearchResult,
} from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { DEMO_LOCATION, DEMO_MASJIDS, isDemoEmail } from "@/lib/demo-mode";
import { getDistanceInMeters } from "@/lib/storage";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

const SCREEN_HEIGHT = Dimensions.get("window").height;

type TabType = "masjids" | "events";

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data: session } = useSession();

  // Check if user is in demo mode
  const isDemoMode = session?.user?.email
    ? isDemoEmail(session.user.email)
    : false;

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("masjids");

  // Search query stored in ref to avoid re-renders on every keystroke
  const searchQueryRef = useRef("");
  const [searchQuery, setSearchQuery] = useState(""); // Track search query for API
  const [searchDisplayCount, setSearchDisplayCount] = useState(0); // Minimal state for triggering filter updates
  const isSearching = searchQuery.trim().length >= 2; // Search mode threshold

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDemoData, setShowDemoData] = useState(false);

  // Selected facilities for filtering
  const [selectedFacilities, setSelectedFacilities] = useState<Set<string>>(
    new Set(),
  );

  // Bottom sheet for filters
  const filterSheet = useBottomSheet();

  // Get user's current location
  const {
    location,
    isLoading: isLocationLoading,
    error: locationError,
    refresh: refreshLocation,
  } = useLocation();

  // Refresh location and masjids when explore tab gains focus
  useFocusEffect(
    useCallback(() => {
      // Skip location refresh in demo mode - use demo location instead
      if (!isDemoMode) {
        refreshLocation(true);
      }
      setShowDemoData(false);
    }, [refreshLocation, isDemoMode]),
  );

  // Fetch facilities for filter
  const { data: facilities, isLoading: isFacilitiesLoading } = useFacilities();

  // Fetch nearby masjids (5km radius)
  // Use demo location when in demo mode
  const {
    data: nearbyMasjids,
    isLoading: isMasjidsLoading,
    error: masjidsError,
    refetch: refetchMasjids,
  } = useNearbyMasjids({
    latitude: isDemoMode
      ? DEMO_LOCATION.latitude
      : (location?.latitude ?? null),
    longitude: isDemoMode
      ? DEMO_LOCATION.longitude
      : (location?.longitude ?? null),
    radius: 5,
    facilityCodes: isSearching ? [] : Array.from(selectedFacilities), // Clear facility filters when searching
  });

  // Fetch upcoming events (only enabled when events tab is active)
  const {
    data: events,
    isLoading: isEventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useEvents({ enabled: activeTab === "events" });

  // Global search by masjid name (not location-based)
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = useMasjidSearch({ query: searchQuery });

  // Filter masjids based on search query (client-side filter for nearby masjids)
  // Uses a ref-based pattern to avoid re-renders on every keystroke:
  //   - searchQueryRef.current holds the search text without triggering renders
  //   - searchDisplayCount is incremented to signal that filtering should re-run
  //   - This pattern is intentional for performance with frequent search input
  const filteredMasjids = useMemo(() => {
    // Use demo data if location failed and demo mode is enabled
    if (showDemoData && (!nearbyMasjids || nearbyMasjids.length === 0)) {
      const searchQuery = searchQueryRef.current.toLowerCase();
      return DEMO_MASJIDS.filter((masjid: MasjidResponse) => {
        return (
          masjid.name.toLowerCase().includes(searchQuery) ||
          masjid.districtName.toLowerCase().includes(searchQuery) ||
          masjid.stateName.toLowerCase().includes(searchQuery)
        );
      });
    }

    if (!nearbyMasjids) return [];

    const searchQuery = searchQueryRef.current.toLowerCase();
    return nearbyMasjids.filter((masjid: MasjidResponse) => {
      // Search filter
      const matchesSearch =
        masjid.name.toLowerCase().includes(searchQuery) ||
        masjid.districtName.toLowerCase().includes(searchQuery) ||
        masjid.stateName.toLowerCase().includes(searchQuery);
      return matchesSearch;
    });
    // Note: searchQueryRef is intentionally not included in deps to avoid re-renders on every keystroke.
    // The searchDisplayCount state acts as a trigger - when incremented via handleSearchChange,
    // the useMemo re-runs and giving us client-side filtering without expensive re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyMasjids, searchDisplayCount, showDemoData, isDemoMode]);

  // Determine which data to display: search results or nearby masjids
  const displayData = useMemo(() => {
    // Search mode: use API search results (global search, not location-based)
    if (isSearching && searchResults) {
      return searchResults;
    }
    // Normal mode: use nearby masjids with client-side filter
    return filteredMasjids;
  }, [isSearching, searchResults, filteredMasjids]);

  // Calculate distances for events
  const eventsWithDistance = useMemo(() => {
    if (!events || !location) return events;
    return events.map((event) => ({
      ...event,
      distanceM: getDistanceInMeters(
        location.latitude,
        location.longitude,
        event.masjidLat,
        event.masjidLng,
      ),
    }));
  }, [events, location]);

  // Handle search input changes without re-render
  const handleSearchChange = useCallback((text: string) => {
    searchQueryRef.current = text;
    setSearchQuery(text); // Update search query state for API hook
    setSearchDisplayCount((prev) => prev + 1); // Trigger filter re-computation
  }, []);

  // Handle masjid press with haptic feedback
  const handleMasjidPress = useCallback((masjidId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/masjid/${masjidId}`);
  }, []);

  // Handle event press with haptic feedback
  const handleEventPress = useCallback((eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/event/${eventId}`);
  }, []);

  // Handle pull to refresh with haptic feedback
  const handlePullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Force refresh to bypass cache on pull-to-refresh
      await refreshLocation(true);
      await refetchMasjids();
      if (activeTab === "events") {
        await refetchEvents();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshLocation, refetchMasjids, refetchEvents, activeTab]);

  const isLoading =
    activeTab === "events"
      ? isEventsLoading
      : isLocationLoading || isMasjidsLoading;
  const error =
    locationError ||
    (activeTab === "events" ? eventsError?.message : masjidsError?.message);

  const formatDistance = useCallback((distanceM: number): string => {
    if (distanceM < 1000) {
      return `${distanceM}m`;
    }
    return `${(distanceM / 1000).toFixed(1)}km`;
  }, []);

  const formatDate = useCallback((date: Date): string => {
    // Format: "Sat, 15 Mar"
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }, []);

  const formatTime = useCallback((date: Date): string => {
    // Format: "2:30 PM"
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  const handleOpenFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    filterSheet.open();
  }, [filterSheet]);

  const handleToggleFacility = useCallback((facilityCode: string) => {
    Haptics.selectionAsync();
    setSelectedFacilities((prev) => {
      const next = new Set(prev);
      if (next.has(facilityCode)) {
        next.delete(facilityCode);
      } else {
        next.add(facilityCode);
      }
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFacilities(new Set());
  }, []);

  const handleReportPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/masjid-report");
  }, []);

  // Render masjid list item
  const renderMasjidItem = useCallback(
    ({
      item,
      index,
    }: {
      item: MasjidResponse | MasjidSearchResult;
      index: number;
    }) => {
      // Check if item has distanceM (nearby masjid) or not (search result)
      const isNearbyMasjid = "distanceM" in item && "canCheckin" in item;
      const distance = isNearbyMasjid ? formatDistance(item.distanceM) : null;

      return (
        <AnimatedTouchableOpacity
          onPress={() => handleMasjidPress(item.masjidId)}
          entering={SlideInRight.delay(index * 50).springify()}
          layout={Layout.springify()}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={`${item.name}${distance ? `, ${distance} away` : ""}`}
          accessibilityHint="Double tap to view details"
          accessibilityRole="button"
          style={styles.masjidCardWrapper}
        >
          <Card variant="outlined" padding="md" style={styles.masjidCard}>
            <View style={styles.masjidCardContent}>
              {/* Main Content */}
              <View style={styles.masjidMainContent}>
                <View style={styles.masjidHeader}>
                  <Text
                    style={[styles.masjidName, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  {isNearbyMasjid && item.canCheckin && (
                    <View
                      style={[
                        styles.checkinIndicator,
                        { backgroundColor: colors.success + "20" },
                      ]}
                    >
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={16}
                        color={colors.success}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.masjidMetaRow}>
                  <IconSymbol
                    name="location.fill"
                    size={14}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.masjidMeta, { color: colors.textSecondary }]}
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
                    label={item.canCheckin ? "Ready" : "Too far"}
                    variant={item.canCheckin ? "success" : "default"}
                    size="sm"
                  />
                </View>
              )}
            </View>
          </Card>
        </AnimatedTouchableOpacity>
      );
    },
    [handleMasjidPress, formatDistance, colors],
  );

  // Render event list item
  const renderEventItem = useCallback(
    ({ item, index }: { item: MasjidEvent; index: number }) => {
      const distance =
        item.distanceM !== undefined ? formatDistance(item.distanceM) : null;
      const eventDate = new Date(item.startDateTime);
      const dateStr = formatDate(eventDate);
      const timeStr = formatTime(eventDate);

      return (
        <AnimatedTouchableOpacity
          onPress={() => handleEventPress(item.id)}
          entering={SlideInRight.delay(index * 50).springify()}
          layout={Layout.springify()}
          activeOpacity={0.7}
          accessible={true}
          accessibilityLabel={`${item.name} at ${item.masjidName}`}
          accessibilityHint="Double tap to view event details"
          accessibilityRole="button"
          style={styles.eventCardWrapper}
        >
          <Card variant="outlined" padding="md" style={styles.eventCard}>
            <View style={styles.eventCardContent}>
              <Text
                style={[styles.eventTitle, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <View style={styles.eventMetaRow}>
                <IconSymbol
                  name="calendar"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.eventMetaText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {dateStr} • {timeStr}
                </Text>
              </View>
              <View style={styles.eventMetaRow}>
                <IconSymbol
                  name="location.fill"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.eventMetaText,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {item.masjidName}
                  {distance && ` • ${distance}`}
                </Text>
              </View>
            </View>
          </Card>
        </AnimatedTouchableOpacity>
      );
    },
    [handleEventPress, formatDistance, formatDate, formatTime, colors],
  );

  // Get tab container background color with platform-native feel on iOS
  const tabContainerBg = Platform.select({
    ios: PlatformColor("systemGray6Color") as unknown as string,
    default: colors.backgroundSecondary,
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
          headerSearchBarOptions: {
            placeholder: "Search masjid name...",
            onChangeText: (event) => handleSearchChange(event.nativeEvent.text),
            onSearchButtonPress: (event) =>
              handleSearchChange(event.nativeEvent.text),
            onCancelButtonPress: () => handleSearchChange(""),
          },
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Tab Container - always visible */}
        <AnimatedView
          style={[styles.tabContainer, { backgroundColor: tabContainerBg }]}
          layout={LinearTransition.springify()}
        >
          <AnimatedTouchableOpacity
            style={[
              styles.tab,
              activeTab === "masjids" && [
                styles.tabActive,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("masjids");
            }}
            accessible={true}
            accessibilityLabel="Masjids tab"
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "masjids" }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "masjids"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Masjids
            </Text>
          </AnimatedTouchableOpacity>
          <AnimatedTouchableOpacity
            style={[
              styles.tab,
              activeTab === "events" && [
                styles.tabActive,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("events");
            }}
            accessible={true}
            accessibilityLabel="Events tab"
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "events" }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "events"
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Events
            </Text>
          </AnimatedTouchableOpacity>
        </AnimatedView>

        {/* Masjid List - always rendered for iOS large title collapse */}
        <FlatList
          data={
            (activeTab === "events"
              ? isEventsLoading
                ? []
                : (eventsWithDistance ?? [])
              : isLoading && !isSearchLoading
                ? []
                : displayData) as any
          }
          renderItem={
            activeTab === "events" ? renderEventItem : (renderMasjidItem as any)
          }
          keyExtractor={(item: any) => {
            if (item && "id" in item) return item.id;
            return item.masjidId;
          }}
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handlePullRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          // Results count header
          ListHeaderComponent={
            !isLoading && !error ? (
              <View>
                {isDemoMode && <DemoBanner />}
                {showDemoData &&
                  (!nearbyMasjids || nearbyMasjids.length === 0) && (
                    <AnimatedView
                      entering={FadeIn.delay(100)}
                      style={[
                        styles.demoBanner,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <IconSymbol
                        name="star.fill"
                        size={14}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.demoBannerText,
                          { color: colors.primary },
                        ]}
                      >
                        Demo mode - showing sample masjids
                      </Text>
                    </AnimatedView>
                  )}
                <Text
                  style={[styles.resultsCount, { color: colors.textSecondary }]}
                >
                  {activeTab === "events"
                    ? `${eventsWithDistance?.length ?? 0} upcoming event${(eventsWithDistance?.length ?? 0) !== 1 ? "s" : ""}`
                    : isSearching
                      ? `${displayData.length} search result${displayData.length !== 1 ? "s" : ""} found`
                      : `${filteredMasjids.length} masjids ${showDemoData && (!nearbyMasjids || nearbyMasjids.length === 0) ? "(demo)" : "within 5km"}${selectedFacilities.size > 0 ? ` • ${selectedFacilities.size} filter${selectedFacilities.size > 1 ? "s" : ""} applied` : ""}`}
                </Text>
                {activeTab === "masjids" && (
                  <TouchableOpacity
                    onPress={handleReportPress}
                    style={styles.reportLinkContainer}
                  >
                    <Text
                      style={[styles.reportLink, { color: colors.primary }]}
                    >
                      Incorrect information? Report here
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
          // Loading state as empty component
          ListEmptyComponent={
            <>
              {/* Loading state */}
              {(isLoading || isSearchLoading) && (
                <AnimatedView entering={FadeIn} style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {isSearchLoading
                      ? "Searching..."
                      : isLocationLoading
                        ? "Getting your location..."
                        : activeTab === "events"
                          ? "Loading events..."
                          : "Finding nearby masjids..."}
                  </Text>
                </AnimatedView>
              )}
              {/* Error state */}
              {error && !isLoading && !isSearching && (
                <AnimatedView entering={FadeIn} style={styles.centerContainer}>
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (activeTab === "events") {
                        refetchEvents();
                      } else {
                        refetchMasjids();
                      }
                    }}
                    style={[
                      styles.retryButton,
                      { backgroundColor: colors.primary },
                    ]}
                    accessible={true}
                    accessibilityLabel={
                      activeTab === "events"
                        ? "Retry loading events"
                        : "Retry loading masjids"
                    }
                    accessibilityRole="button"
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </AnimatedView>
              )}
              {/* Search error state */}
              {searchError && isSearching && !isSearchLoading && (
                <AnimatedView entering={FadeIn} style={styles.centerContainer}>
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {searchError.message}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSearchQuery(searchQuery);
                    }}
                    style={[
                      styles.retryButton,
                      { backgroundColor: colors.primary },
                    ]}
                    accessible={true}
                    accessibilityLabel="Retry search"
                    accessibilityRole="button"
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </AnimatedView>
              )}
              {/* Empty state */}
              {!isLoading &&
                !isSearchLoading &&
                !error &&
                !searchError &&
                (activeTab === "events"
                  ? eventsWithDistance?.length === 0
                  : displayData.length === 0) && (
                  <AnimatedView
                    entering={FadeIn}
                    style={styles.centerContainer}
                  >
                    <AnimatedView
                      entering={FadeInDown.springify()}
                      style={[
                        styles.emptyIconContainer,
                        { backgroundColor: colors.primary + "15" },
                      ]}
                    >
                      <IconSymbol
                        name={
                          activeTab === "events"
                            ? "calendar"
                            : isSearching
                              ? "magnifyingglass"
                              : "map.fill"
                        }
                        size={48}
                        color={colors.primary}
                      />
                    </AnimatedView>
                    <Text style={[styles.emptyText, { color: colors.text }]}>
                      {activeTab === "events"
                        ? "No upcoming events"
                        : "No masjids found"}
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtext,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {activeTab === "events"
                        ? "Check back later for new events"
                        : isSearching
                          ? "No masjids match your search"
                          : searchQueryRef.current
                            ? "Try a different search term"
                            : "No masjids within 5km of your location"}
                    </Text>
                  </AnimatedView>
                )}
            </>
          }
        />

        {/* Floating Filter Button - hide when searching or on events tab */}
        {!isSearching && activeTab === "masjids" && (
          <AnimatedTouchableOpacity
            onPress={handleOpenFilters}
            style={[styles.fab, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            accessible={true}
            accessibilityLabel="Open filters"
            accessibilityHint="Filter masjids by facilities"
            accessibilityRole="button"
            accessibilityState={{ expanded: false }}
          >
            <IconSymbol
              name="line.3.horizontal.decrease.circle.fill"
              size={22}
              color="#FFFFFF"
            />
            {selectedFacilities.size > 0 && (
              <AnimatedView
                entering={FadeIn}
                style={[styles.fabBadge, { backgroundColor: colors.card }]}
              >
                <Text style={[styles.fabBadgeText, { color: colors.primary }]}>
                  {selectedFacilities.size}
                </Text>
              </AnimatedView>
            )}
          </AnimatedTouchableOpacity>
        )}
      </View>

      {/* Filter Bottom Sheet */}
      <BottomSheet
        ref={filterSheet.ref}
        snapPoints={[SCREEN_HEIGHT * 0.65, SCREEN_HEIGHT * 0.9]}
        backgroundColor={colors.card}
        onClose={filterSheet.handleClose}
        showHandle={true}
      >
        {/* Filter Header */}
        <View style={styles.filterHeader}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            Filter by Facilities
          </Text>
          {selectedFacilities.size > 0 && (
            <TouchableOpacity
              onPress={handleClearFilters}
              style={styles.clearButton}
              accessible={true}
              accessibilityLabel="Clear all filters"
              accessibilityRole="button"
            >
              <Text style={[styles.clearText, { color: colors.primary }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Facilities Grid - 2 Columns */}
        {isFacilitiesLoading ? (
          <AnimatedView entering={FadeIn} style={styles.filterLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text
              style={[
                styles.filterLoadingText,
                { color: colors.textSecondary },
              ]}
            >
              Loading facilities...
            </Text>
          </AnimatedView>
        ) : facilities && facilities.length > 0 ? (
          <View style={styles.filterGrid}>
            {facilities.map((facility: FacilityOption, index: number) => {
              const isSelected = selectedFacilities.has(facility.code);
              return (
                <AnimatedTouchableOpacity
                  key={facility.code}
                  entering={FadeIn.delay(index * 30).springify()}
                  layout={LinearTransition.springify()}
                  onPress={() => handleToggleFacility(facility.code)}
                  style={[
                    styles.filterGridItem,
                    {
                      backgroundColor: isSelected
                        ? colorScheme === "dark"
                          ? colors.primary + "30"
                          : colors.primary + "20"
                        : colorScheme === "dark"
                          ? "#2A2C2E"
                          : "#F5F5F5",
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  accessible={true}
                  accessibilityLabel={facility.label}
                  accessibilityRole="checkbox"
                  accessibilityState={{ selected: isSelected }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.filterGridItemText, { color: colors.text }]}
                  >
                    {facility.label}
                  </Text>
                  {isSelected && (
                    <IconSymbol
                      name="checkmark"
                      size={14}
                      color={colors.primary}
                    />
                  )}
                </AnimatedTouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text
            style={[styles.filterEmptyText, { color: colors.textSecondary }]}
          >
            No facilities available
          </Text>
        )}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    padding: 4,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    minHeight: 44,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderCurve: "continuous",
  },
  tabActive: {
    // Modern CSS boxShadow (works on RN 0.71+)
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
  },
  tabText: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  // Masjid card styles
  masjidCardWrapper: {
    marginBottom: Spacing.sm,
  },
  masjidCard: {
    minHeight: 88,
    borderRadius: 16,
    borderCurve: "continuous",
    // Modern CSS boxShadow
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
  },
  masjidCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  masjidIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  masjidMainContent: {
    flex: 1,
  },
  masjidHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  masjidName: {
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
  masjidMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  masjidMeta: {
    ...Typography.caption,
    flex: 1,
  },
  statusBadgeContainer: {
    alignSelf: "flex-start",
  },
  // Event card styles
  eventCardWrapper: {
    marginBottom: Spacing.sm,
  },
  eventCard: {
    minHeight: 88,
    borderRadius: 16,
    borderCurve: "continuous",
    // Modern CSS boxShadow
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
  },
  eventCardContent: {
    gap: Spacing.xs,
  },
  eventTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  eventMetaText: {
    ...Typography.caption,
    flex: 1,
  },
  // Header styles (kept for reference)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    ...Typography.h2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  radiusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  radiusText: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  // FAB styles with modern design
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    // Modern CSS boxShadow with primary color tint
    boxShadow: "0px 6px 16px rgba(0, 169, 165, 0.35)",
  },
  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderCurve: "continuous",
  },
  fabBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderCurve: "continuous",
  },
  demoBannerText: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  resultsCount: {
    ...Typography.bodySmall,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  reportLink: {
    ...Typography.bodySmall,
    textDecorationLine: "underline",
  },
  reportLinkContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minHeight: 44, // Ensure touch target
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  // First visitor badge styles (kept for reference)
  firstVisitorBadge: {
    gap: 2,
  },
  firstVisitorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9800",
  },
  bonusText: {
    fontSize: 11,
  },
  visitedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  lastVisited: {
    ...Typography.caption,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderCurve: "continuous",
    minHeight: 44, // iOS minimum touch target
  },
  retryButtonText: {
    color: "#FFFFFF",
    ...Typography.button,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderCurve: "continuous",
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
  },
  // Filter styles
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  filterTitle: {
    ...Typography.h3,
    fontWeight: "600",
  },
  clearButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44, // iOS minimum touch target
    justifyContent: "center",
  },
  clearText: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  filterLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  filterLoadingText: {
    ...Typography.bodySmall,
    marginLeft: Spacing.xs,
  },
  filterEmptyText: {
    ...Typography.body,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  filterGridItem: {
    width: "48%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    minHeight: 48,
  },
  filterGridItemText: {
    ...Typography.body,
    textAlign: "center",
    flex: 1,
  },
  filterActions: {
    paddingTop: Spacing.sm,
  },
});
