import * as Haptics from "expo-haptics";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  PlatformColor,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";

import { EventListItem, formatEventDate, formatEventDistance, formatEventTime } from "@/components/explore/event-list-item";
import { MasjidListItem } from "@/components/explore/masjid-list-item";
import { BottomSheet } from "@/components/ui/bottom-sheet";
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

// Pre-compute platform-specific background color (tree-shakeable)
const TAB_CONTAINER_BG_LIGHT = process.env.EXPO_OS === "ios"
  ? PlatformColor("systemGray6Color")
  : Colors.light.backgroundSecondary;
const TAB_CONTAINER_BG_DARK = process.env.EXPO_OS === "ios"
  ? PlatformColor("systemGray6Color")
  : Colors.dark.backgroundSecondary;

type TabType = "masjids" | "events";

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data: session } = useSession();
  const { height: screenHeight } = useWindowDimensions();

  // Track component mount state for async operations
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check if user is in demo mode
  const isDemoMode = session?.user?.email
    ? isDemoEmail(session.user.email)
    : false;

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("masjids");

  // Search query state - used directly in useMemo for proper reactivity
  const [searchQuery, setSearchQuery] = useState("");
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
  // Uses for...of loop to reduce GC handle pressure vs .filter()
  const filteredMasjids = useMemo(() => {
    // Use demo data if location failed and demo mode is enabled
    if (showDemoData && (!nearbyMasjids || nearbyMasjids.length === 0)) {
      if (!DEMO_MASJIDS || DEMO_MASJIDS.length === 0) return [];

      const query = searchQuery.toLowerCase().trim();
      if (!query) return DEMO_MASJIDS;

      const results: MasjidResponse[] = [];
      for (const masjid of DEMO_MASJIDS) {
        const nameLower = masjid.name.toLowerCase();
        const districtLower = masjid.districtName.toLowerCase();
        const stateLower = masjid.stateName.toLowerCase();

        if (nameLower.includes(query) || districtLower.includes(query) || stateLower.includes(query)) {
          results.push(masjid);
        }
      }
      return results;
    }

    if (!nearbyMasjids || nearbyMasjids.length === 0) return [];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return nearbyMasjids;

    const results: MasjidResponse[] = [];
    for (const masjid of nearbyMasjids) {
      const nameLower = masjid.name.toLowerCase();
      const districtLower = masjid.districtName.toLowerCase();
      const stateLower = masjid.stateName.toLowerCase();

      if (nameLower.includes(query) || districtLower.includes(query) || stateLower.includes(query)) {
        results.push(masjid);
      }
    }
    return results;
  }, [nearbyMasjids, searchQuery, showDemoData]);

  // Determine which data to display: search results or nearby masjids
  // Memoized to prevent unnecessary re-renders
  const displayData = useMemo(() => {
    return isSearching && searchResults ? searchResults : filteredMasjids;
  }, [isSearching, searchResults, filteredMasjids]);

  // Calculate distances for events and pre-format date/time strings
  // Uses for...of loop to reduce GC handle pressure vs .map()
  // Pre-formatting date/time avoids formatting on every render
  const eventsWithFormattedData = useMemo(() => {
    if (!events || events.length === 0) return [];
    if (!location) {
      // Still format date/time even without location
      return events.map((event) => {
        const eventDate = new Date(event.startDateTime);
        return {
          ...event,
          distanceM: undefined,
          formattedDate: formatEventDate(eventDate),
          formattedTime: formatEventTime(eventDate),
          formattedDistance: null,
        };
      });
    }

    return events.map((event) => {
      const distanceM = getDistanceInMeters(
        location.latitude,
        location.longitude,
        event.masjidLat,
        event.masjidLng,
      );
      const eventDate = new Date(event.startDateTime);
      return {
        ...event,
        distanceM,
        formattedDate: formatEventDate(eventDate),
        formattedTime: formatEventTime(eventDate),
        formattedDistance: formatEventDistance(distanceM),
      };
    });
  }, [events, location]);

  // Compute loading and error states (must be before listData which depends on isLoading)
  const isLoading =
    activeTab === "events"
      ? isEventsLoading
      : isLocationLoading || isMasjidsLoading;
  const error =
    locationError ||
    (activeTab === "events" ? eventsError?.message : masjidsError?.message);

  // Memoize FlatList data to prevent unnecessary re-renders
  const listData = useMemo(() => {
    if (activeTab === "events") {
      return isEventsLoading ? [] : (eventsWithFormattedData ?? []);
    }
    return isLoading && !isSearchLoading ? [] : displayData;
  }, [activeTab, isEventsLoading, eventsWithFormattedData, isLoading, isSearchLoading, displayData]);

  // Pre-compute common styles based on color scheme
  const staticStyles = useMemo(() => ({
    tabContainerBg: colorScheme === "dark" ? TAB_CONTAINER_BG_DARK : TAB_CONTAINER_BG_LIGHT,
    checkinIndicatorBg: colors.success + "20",
    demoBannerBg: colors.primary + "15",
    emptyIconBg: colors.primary + "15",
    filterItemSelectedLight: colors.primary + "20",
    filterItemSelectedDark: colors.primary + "30",
  }), [colorScheme, colors.success, colors.primary]);

  // Handle search input changes
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
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
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [refreshLocation, refetchMasjids, refetchEvents, activeTab]);

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

  // Render masjid list item using memoized component
  const renderMasjidItem = useCallback(
    ({ item }: { item: MasjidResponse | MasjidSearchResult }) => (
      <MasjidListItem
        item={item}
        textColor={colors.text}
        textSecondaryColor={colors.textSecondary}
        textTertiaryColor={colors.textTertiary}
        successColor={colors.success}
        checkinIndicatorBg={staticStyles.checkinIndicatorBg}
        onPress={handleMasjidPress}
      />
    ),
    [colors.text, colors.textSecondary, colors.textTertiary, colors.success, staticStyles.checkinIndicatorBg, handleMasjidPress],
  );

  // Render event list item using memoized component
  const renderEventItem = useCallback(
    ({ item }: { item: typeof eventsWithFormattedData[number] }) => (
      <EventListItem
        id={item.id}
        name={item.name}
        masjidName={item.masjidName}
        dateStr={item.formattedDate}
        timeStr={item.formattedTime}
        distance={item.formattedDistance}
        textColor={colors.text}
        textSecondaryColor={colors.textSecondary}
        onPress={handleEventPress}
      />
    ),
    [colors.text, colors.textSecondary, handleEventPress],
  );

  // Memoize ListHeaderComponent to prevent unnecessary re-renders
  const listHeaderComponent = useMemo(() => {
    if (isLoading || error) return null;

    return (
      <View>
        {isDemoMode && <DemoBanner />}
        {showDemoData &&
          (!nearbyMasjids || nearbyMasjids.length === 0) && (
            <AnimatedView
              entering={FadeIn.delay(100)}
              style={[
                styles.demoBanner,
                { backgroundColor: staticStyles.demoBannerBg },
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
            ? `${eventsWithFormattedData?.length ?? 0} upcoming event${(eventsWithFormattedData?.length ?? 0) !== 1 ? "s" : ""}`
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
    );
  }, [
    isLoading,
    error,
    isDemoMode,
    showDemoData,
    nearbyMasjids,
    staticStyles,
    colors.primary,
    colors.textSecondary,
    activeTab,
    eventsWithFormattedData,
    isSearching,
    displayData,
    filteredMasjids,
    selectedFacilities.size,
    handleReportPress,
  ]);

  // Memoize ListEmptyComponent to prevent unnecessary re-renders
  const listEmptyComponent = useMemo(() => {
    return (
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
            ? eventsWithFormattedData?.length === 0
            : displayData.length === 0) && (
            <AnimatedView
              entering={FadeIn}
              style={styles.centerContainer}
            >
              <AnimatedView
                entering={FadeInDown.springify()}
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: staticStyles.emptyIconBg },
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
                    : searchQuery
                      ? "Try a different search term"
                      : "No masjids within 5km of your location"}
              </Text>
            </AnimatedView>
          )}
      </>
    );
  }, [
    isLoading,
    isSearchLoading,
    colors.primary,
    colors.textSecondary,
    colors.error,
    colors.text,
    isLocationLoading,
    activeTab,
    error,
    isSearching,
    searchError,
    eventsWithFormattedData,
    displayData,
    refetchEvents,
    refetchMasjids,
    searchQuery,
    staticStyles.emptyIconBg,
  ]);

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
          style={[styles.tabContainer, { backgroundColor: staticStyles.tabContainerBg as unknown as string }]}
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
          data={listData as (MasjidResponse | MasjidSearchResult | MasjidEvent)[]}
          renderItem={
            (activeTab === "events" ? renderEventItem : renderMasjidItem) as (
              info: { item: MasjidResponse | MasjidSearchResult | MasjidEvent }
            ) => React.ReactElement | null
          }
          keyExtractor={(item) => {
            if (item && "id" in item) return item.id;
            return (item as MasjidResponse).masjidId;
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
          ListHeaderComponent={listHeaderComponent}
          ListEmptyComponent={listEmptyComponent}
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
        snapPoints={[screenHeight * 0.65, screenHeight * 0.9]}
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
            {facilities.map((facility: FacilityOption) => {
              const isSelected = selectedFacilities.has(facility.code);
              return (
                <AnimatedTouchableOpacity
                  key={facility.code}
                  layout={LinearTransition}
                  onPress={() => handleToggleFacility(facility.code)}
                  style={[
                    styles.filterGridItem,
                    {
                      backgroundColor: isSelected
                        ? colorScheme === "dark"
                          ? staticStyles.filterItemSelectedDark
                          : staticStyles.filterItemSelectedLight
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
});
