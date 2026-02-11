import * as Haptics from 'expo-haptics';
import { router, Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFacilities } from '@/hooks/use-facilities';
import { useLocation } from '@/hooks/use-location';
import { useNearbyMasjids } from '@/hooks/use-nearby-masjids';
import { FacilityOption, MasjidResponse } from '@/lib/api';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Search query stored in ref to avoid re-renders on every keystroke
  const searchQueryRef = useRef('');
  const [searchDisplayCount, setSearchDisplayCount] = useState(0); // Minimal state for triggering filter updates

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected facilities for filtering
  const [selectedFacilities, setSelectedFacilities] = useState<Set<string>>(new Set());

  // Bottom sheet for filters
  const filterSheet = useBottomSheet();

  // Get user's current location
  const { location, isLoading: isLocationLoading, error: locationError, refresh: refreshLocation } = useLocation();

  // Refresh location and masjids when explore tab gains focus
  useFocusEffect(
    useCallback(() => {
      // Force refresh location when explore screen comes into focus
      refreshLocation(true);
    }, [refreshLocation])
  );

  // Fetch facilities for filter
  const { data: facilities, isLoading: isFacilitiesLoading } = useFacilities();

  // Fetch nearby masjids (5km radius)
  const {
    data: nearbyMasjids,
    isLoading: isMasjidsLoading,
    error: masjidsError,
    refetch: refetchMasjids,
  } = useNearbyMasjids({
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    radius: 5,
    facilityCodes: Array.from(selectedFacilities),
  });

  // Filter masjids based on search query
  // Note: searchDisplayCount is intentionally included to trigger re-filter when search changes
  const filteredMasjids = useMemo(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyMasjids, searchDisplayCount]);

  // Handle search input changes without re-render
  const handleSearchChange = useCallback((text: string) => {
    searchQueryRef.current = text;
    setSearchDisplayCount(prev => prev + 1); // Trigger filter re-computation
  }, []);

  // Handle masjid press with haptic feedback
  const handleMasjidPress = useCallback((masjidId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/masjid/${masjidId}`);
  }, []);

  // Handle pull to refresh with haptic feedback
  const handlePullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Force refresh to bypass cache on pull-to-refresh
      await refreshLocation(true);
      await refetchMasjids();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshLocation, refetchMasjids]);

  const isLoading = isLocationLoading || isMasjidsLoading;
  const error = locationError || masjidsError?.message;

  const formatDistance = useCallback((distanceM: number): string => {
    if (distanceM < 1000) {
      return `${distanceM}m`;
    }
    return `${(distanceM / 1000).toFixed(1)}km`;
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

  const handleRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refetchMasjids();
  }, [refetchMasjids]);

  const handleReportPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/masjid-report');
  }, []);

  // Render masjid list item
  const renderMasjidItem = useCallback(({ item }: { item: MasjidResponse }) => {
    const distance = formatDistance(item.distanceM);
    return (
      <TouchableOpacity
        onPress={() => handleMasjidPress(item.masjidId)}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`${item.name}, ${distance} away`}
        accessibilityHint="Double tap to view details"
        accessibilityRole="button"
      >
        <Card variant="outlined" padding="md" style={styles.masjidCard}>
          <View style={styles.masjidCardContent}>
            {/* Main Content */}
            <View style={styles.masjidMainContent}>
              <View style={styles.masjidHeader}>
                <Text style={[styles.masjidName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.canCheckin && (
                  <View style={[styles.checkinIndicator, { backgroundColor: colors.success + '20' }]}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                  </View>
                )}
              </View>

              <View style={styles.masjidMetaRow}>
                <IconSymbol name="location.fill" size={14} color={colors.textTertiary} />
                <Text style={[styles.masjidMeta, { color: colors.textSecondary }]}>
                  {distance} • {item.districtName}, {item.stateName}
                </Text>
              </View>
            </View>

            {/* Status Badge */}
            <View style={styles.statusBadgeContainer}>
              <Badge
                label={item.canCheckin ? 'Ready' : 'Too far'}
                variant={item.canCheckin ? 'success' : 'default'}
                size="sm"
              />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }, [handleMasjidPress, formatDistance, colors]);

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: 'Search masjid name...',
            onChangeText: (event) => handleSearchChange(event.nativeEvent.text),
            onSearchButtonPress: (event) => handleSearchChange(event.nativeEvent.text),
            onCancelButtonPress: () => handleSearchChange(''),
          },
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Results Count */}
        {!isLoading && !error && (
          <>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {filteredMasjids.length} masjids within 5km
              {selectedFacilities.size > 0 ? ` • ${selectedFacilities.size} filter${selectedFacilities.size > 1 ? 's' : ''} applied` : ''}
            </Text>
            <TouchableOpacity onPress={handleReportPress} style={styles.reportLinkContainer}>
              <Text style={[styles.reportLink, { color: colors.primary }]}>
                Incorrect information? Report here
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {isLocationLoading ? 'Getting your location...' : 'Finding nearby masjids...'}
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              onPress={handleRetry}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              accessible={true}
              accessibilityLabel="Retry loading masjids"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredMasjids.length === 0 && (
          <View style={styles.centerContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name="map.fill" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No masjids found
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {searchQueryRef.current
                ? 'Try a different search term'
                  : 'No masjids within 5km of your location'}
            </Text>
          </View>
        )}

        {/* Masjid List */}
        {!isLoading && !error && filteredMasjids.length > 0 && (
          <FlatList
            data={filteredMasjids}
            renderItem={renderMasjidItem}
            keyExtractor={(item) => item.masjidId}
            contentContainerStyle={styles.listContent}
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
          />
        )}

        {/* Floating Filter Button */}
        <TouchableOpacity
          onPress={handleOpenFilters}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          accessible={true}
          accessibilityLabel="Open filters"
          accessibilityHint="Filter masjids by facilities"
          accessibilityRole="button"
          accessibilityState={{ expanded: false }}
        >
          <IconSymbol name="line.3.horizontal.decrease.circle.fill" size={22} color="#FFFFFF" />
          {selectedFacilities.size > 0 && (
            <View style={[styles.fabBadge, { backgroundColor: colors.card }]}>
              <Text style={[styles.fabBadgeText, { color: colors.primary }]}>
                {selectedFacilities.size}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>

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
          <View style={styles.filterLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.filterLoadingText, { color: colors.textSecondary }]}>
              Loading facilities...
            </Text>
          </View>
        ) : facilities && facilities.length > 0 ? (
          <View style={styles.filterGrid}>
            {facilities.map((facility: FacilityOption) => {
              const isSelected = selectedFacilities.has(facility.code);
              return (
                <TouchableOpacity
                  key={facility.code}
                  onPress={() => handleToggleFacility(facility.code)}
                  style={[
                    styles.filterGridItem,
                    {
                      backgroundColor: isSelected
                        ? (colorScheme === 'dark' ? colors.primary + '30' : colors.primary + '20')
                        : (colorScheme === 'dark' ? '#2A2C2E' : '#F5F5F5'),
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  accessible={true}
                  accessibilityLabel={facility.label}
                  accessibilityRole="checkbox"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.filterGridItemText, { color: colors.text }]}>
                    {facility.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.filterEmptyText, { color: colors.textSecondary }]}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    ...Typography.h2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  radiusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radiusText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  fabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resultsCount: {
    ...Typography.bodySmall,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  reportLink: {
    ...Typography.bodySmall,
    textDecorationLine: 'underline',
  },
  reportLinkContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minHeight: 44, // Ensure touch target
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  masjidCard: {
    marginBottom: Spacing.sm,
  },
  masjidCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masjidMainContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  masjidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  masjidName: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  checkinIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masjidMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  masjidMeta: {
    ...Typography.caption,
    flex: 1,
  },
  statusBadgeContainer: {
    alignSelf: 'flex-start',
  },
  firstVisitorBadge: {
    gap: 2,
  },
  firstVisitorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  bonusText: {
    fontSize: 11,
  },
  visitedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lastVisited: {
    ...Typography.caption,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, // Increased from sm to md
    borderRadius: BorderRadius.md,
    minHeight: 44, // iOS minimum touch target
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.button,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.h3,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.body,
    textAlign: 'center',
  },
  // Filter styles
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  filterTitle: {
    ...Typography.h3,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: Spacing.sm, // Increased from 4
    paddingHorizontal: Spacing.md, // Increased from 8
    minHeight: 44, // iOS minimum touch target
    justifyContent: 'center',
  },
  clearText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  filterLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  filterLoadingText: {
    ...Typography.bodySmall,
    marginLeft: Spacing.xs,
  },
  filterEmptyText: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  filterGridItem: {
    width: '48%',
    paddingVertical: Spacing.md, // Was 12, now using theme constant
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // iOS minimum touch target
  },
  filterGridItemText: {
    ...Typography.body,
    textAlign: 'center',
  },
  filterActions: {
    paddingTop: Spacing.sm,
  },
});
