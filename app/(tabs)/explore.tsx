import { router, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useExploreFilters } from '@/hooks/use-explore-filters';
import { useLocation } from '@/hooks/use-location';
import { useNearbyMasjids } from '@/hooks/use-nearby-masjids';
import { MasjidResponse } from '@/lib/api';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { appliedFacilities } = useExploreFilters();

  // Get user's current location
  const { location, isLoading: isLocationLoading, error: locationError, refresh: refreshLocation } = useLocation();

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
          <>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {filteredMasjids.length} masjids within 5km
              {hasFacilityFilter ? ' matching selected facilities' : ''}
            </Text>
            <TouchableOpacity onPress={() => router.push('/masjid-report')}>
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
          onPress={() => router.push('/explore-filters')}
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
    </>
  );

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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  reportLink: {
    ...Typography.bodySmall,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    textDecorationLine: 'underline',
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
