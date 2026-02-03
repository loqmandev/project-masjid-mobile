import {
  Group,
  Host,
  BottomSheet as IOSBottomSheet,
} from '@expo/ui/swift-ui';
import { router, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFacilities } from '@/hooks/use-facilities';
import { useLocation } from '@/hooks/use-location';
import { useNearbyMasjids } from '@/hooks/use-nearby-masjids';
import { MasjidResponse } from '@/lib/api';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFacilities, setAppliedFacilities] = useState<Set<string>>(new Set());
  const [pendingFacilities, setPendingFacilities] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get user's current location
  const { location, isLoading: isLocationLoading, error: locationError, refresh: refreshLocation } = useLocation();

  const {
    data: facilities,
    isLoading: isFacilitiesLoading,
    error: facilitiesError,
  } = useFacilities();

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
    facilityCodes: Array.from(appliedFacilities),
  });

  // Filter masjids based on search query
  const filteredMasjids = useMemo(() => {
    if (!nearbyMasjids) return [];

    return nearbyMasjids.filter((masjid) => {
      // Search filter
      const matchesSearch =
        masjid.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        masjid.districtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        masjid.stateName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [nearbyMasjids, searchQuery]);

  const handleMasjidPress = (masjidId: string) => {
    router.push(`/masjid/${masjidId}`);
  };

  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force refresh to bypass cache on pull-to-refresh
      await refreshLocation(true);
      await refetchMasjids();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = isLocationLoading || isMasjidsLoading;
  const error = locationError || masjidsError?.message;
  const hasFacilityFilter = appliedFacilities.size > 0;

  const formatDistance = (distanceM: number): string => {
    if (distanceM < 1000) {
      return `${distanceM}m`;
    }
    return `${(distanceM / 1000).toFixed(1)}km`;
  };

  const renderMasjidItem = ({ item: masjid }: { item: MasjidResponse }) => (
    <TouchableOpacity
      onPress={() => handleMasjidPress(masjid.masjidId)}
      activeOpacity={0.7}
    >
      <Card variant="outlined" padding="md" style={styles.masjidCard}>
        <View style={styles.masjidCardContent}>
          {/* Main Content */}
          <View style={styles.masjidMainContent}>
            <View style={styles.masjidHeader}>
              <Text style={[styles.masjidName, { color: colors.text }]} numberOfLines={2}>
                {masjid.name}
              </Text>
              {masjid.canCheckin && (
                <View style={[styles.checkinIndicator, { backgroundColor: colors.success + '20' }]}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                </View>
              )}
            </View>

            <View style={styles.masjidMetaRow}>
              <IconSymbol name="location.fill" size={14} color={colors.textTertiary} />
              <Text style={[styles.masjidMeta, { color: colors.textSecondary }]}>
                {formatDistance(masjid.distanceM)} • {masjid.districtName}, {masjid.stateName}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <Badge
              label={masjid.canCheckin ? 'Ready' : 'Too far'}
              variant={masjid.canCheckin ? 'success' : 'default'}
              size="sm"
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Shared bottom sheet content component
  const renderSheetContent = () => {
    const screenHeight = Dimensions.get('window').height;
    const listMaxHeight = screenHeight * 0.5;

    return (
    <View style={[styles.sheetContent, { backgroundColor: colors.background }]}>
      <View style={styles.sheetHeader}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          Facilities
        </Text>
        <TouchableOpacity
          onPress={() => setPendingFacilities(new Set())}
          style={styles.sheetClearButton}
        >
          <Text style={[styles.sheetClearText, { color: colors.primary }]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {isFacilitiesLoading ? (
        <View style={styles.facilitiesLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.facilitiesLoadingText, { color: colors.textSecondary }]}>
            Loading facilities...
          </Text>
        </View>
      ) : facilitiesError ? (
        <Text style={[styles.facilitiesErrorText, { color: colors.error }]}>
          Unable to load facilities
        </Text>
      ) : !facilities || facilities.length === 0 ? (
        <Text style={[styles.facilitiesLoadingText, { color: colors.textSecondary }]}>
          No facilities available
        </Text>
      ) : (
        <ScrollView
          style={{ maxHeight: listMaxHeight }}
          contentContainerStyle={styles.sheetList}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {facilities.map((facility) => {
            const isSelected = pendingFacilities.has(facility.code);
            return (
              <TouchableOpacity
                key={facility.code}
                onPress={() =>
                  setPendingFacilities((prev) => {
                    const next = new Set(prev);
                    if (next.has(facility.code)) {
                      next.delete(facility.code);
                    } else {
                      next.add(facility.code);
                    }
                    return next;
                  })
                }
                style={[
                  styles.sheetRow,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.sheetRowText, { color: colors.text }]}>
                  {facility.label}
                </Text>
                {isSelected && (
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={18}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.sheetActions}>
        <Button
          title="Search"
          onPress={() => {
            setAppliedFacilities(new Set(pendingFacilities));
            setIsFilterOpen(false);
          }}
          disabled={isFacilitiesLoading}
        />
      </View>
    </View>
    );
  };

  const screenContent = (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: 'Search masjid name...',
            onChangeText: (event) => setSearchQuery(event.nativeEvent.text),
            onSearchButtonPress: (event) => setSearchQuery(event.nativeEvent.text),
            onCancelButtonPress: () => setSearchQuery(''),
          },
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Results Count */}
        {!isLoading && !error && (
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {filteredMasjids.length} masjids within 5km
            {hasFacilityFilter ? ' matching selected facilities' : ''}
          </Text>
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
              onPress={() => refetchMasjids()}
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
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
              {searchQuery
                ? 'Try a different search term'
                : hasFacilityFilter
                  ? 'No masjids match the selected facilities'
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
          onPress={() => {
            setPendingFacilities(new Set(appliedFacilities));
            setIsFilterOpen(true);
          }}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <IconSymbol name="line.3.horizontal.decrease.circle.fill" size={22} color="#fff" />
          {hasFacilityFilter && (
            <View style={[styles.fabBadge, { backgroundColor: colors.card }]}>
              <Text style={[styles.fabBadgeText, { color: colors.primary }]}>
                {appliedFacilities.size}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Sheet - Platform Specific */}
      {Platform.OS === 'ios' ? (
        <IOSBottomSheet
          isOpened={isFilterOpen}
          onIsOpenedChange={setIsFilterOpen}
          presentationDetents={['medium', 'large'] as any}
          presentationDragIndicator={'visible' as any}
        >
          <Group>
            <Host>
              {renderSheetContent()}
            </Host>
          </Group>
        </IOSBottomSheet>
      ) : (
        <Modal
          visible={isFilterOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsFilterOpen(false)}
          statusBarTranslucent
        >
          <View style={styles.androidModalOverlay}>
            <TouchableOpacity
              style={styles.androidModalBackdrop}
              activeOpacity={1}
              onPress={() => setIsFilterOpen(false)}
            />
            <View style={[styles.androidSheetContainer, { backgroundColor: colors.background }]}>
              {/* Drag Indicator */}
              <View style={styles.dragIndicatorContainer}>
                <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
              </View>
              {renderSheetContent()}
            </View>
          </View>
        </Modal>
      )}
    </>
  );

  if (Platform.OS === 'ios') {
    return <Host style={styles.host}>{screenContent}</Host>;
  }

  return screenContent;
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
  host: {
    flex: 1,
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
  // Android Modal styles
  androidModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  androidModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  androidSheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  // Sheet content styles (shared between iOS and Android)
  sheetContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    ...Typography.h3,
  },
  sheetClearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sheetClearText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  facilitiesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  facilitiesLoadingText: {
    ...Typography.caption,
  },
  facilitiesErrorText: {
    ...Typography.caption,
  },
  sheetScroll: {
    minHeight: 0,
  },
  sheetList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  sheetRow: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetRowText: {
    ...Typography.body,
  },
  sheetActions: {
    paddingTop: Spacing.sm,
  },
  resultsCount: {
    ...Typography.bodySmall,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#fff',
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
});
