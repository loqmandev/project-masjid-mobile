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
import { BorderRadius, Colors, primary, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocation } from '@/hooks/use-location';
import { useNearbyMasjids } from '@/hooks/use-nearby-masjids';
import { MasjidResponse } from '@/lib/api';

type FilterType = 'all' | 'checkin' | 'visited';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  });

  // Filter masjids based on search query and selected filter
  const filteredMasjids = useMemo(() => {
    if (!nearbyMasjids) return [];

    return nearbyMasjids.filter((masjid) => {
      // Search filter
      const matchesSearch =
        masjid.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        masjid.districtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        masjid.stateName.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      if (selectedFilter === 'checkin') {
        return matchesSearch && masjid.canCheckin;
      }
      // Note: 'visited' filter would require user visit history from API
      return matchesSearch;
    });
  }, [nearbyMasjids, searchQuery, selectedFilter]);

  const handleMasjidPress = (masjidId: string) => {
    router.push(`/masjid/${masjidId}`);
  };

  const handleRefresh = async () => {
    // Force refresh to bypass cache when user explicitly requests it
    await refreshLocation(true);
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
          {/* Masjid Image/Icon */}
          <View style={[styles.masjidImage, { backgroundColor: primary[50] }]}>
            <Text style={styles.masjidEmoji}>🕌</Text>
          </View>

          {/* Masjid Info */}
          <View style={styles.masjidInfo}>
            <Text style={[styles.masjidName, { color: colors.text }]} numberOfLines={2}>
              {masjid.name}
            </Text>
            <Text style={[styles.masjidMeta, { color: colors.textSecondary }]}>
              {formatDistance(masjid.distanceM)} away • {masjid.districtName}
            </Text>

            {/* Status Badges */}
            <View style={styles.badgeContainer}>
              {masjid.canCheckin ? (
                <Badge label="Ready to check in" variant="success" size="sm" />
              ) : (
                <Badge label="Not in range" variant="default" size="sm" />
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

      {/* Filter Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedFilter === 'all' && [styles.tabActive, { backgroundColor: colors.card }],
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedFilter === 'all' ? colors.primary : colors.textSecondary },
            ]}
          >
            All Masjids
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedFilter === 'checkin' && [styles.tabActive, { backgroundColor: colors.card }],
          ]}
          onPress={() => setSelectedFilter('checkin')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedFilter === 'checkin' ? colors.primary : colors.textSecondary },
            ]}
          >
            Can Check In
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      {!isLoading && !error && (
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {filteredMasjids.length} masjids within 5km
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
          <Text style={styles.emptyIcon}>🕌</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No masjids found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            {searchQuery ? 'Try a different search term' : 'No masjids within 5km of your location'}
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
    </SafeAreaView>
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    padding: 4,
    borderRadius: BorderRadius.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...Typography.bodySmall,
    fontWeight: '600',
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
  },
  masjidImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  masjidEmoji: {
    fontSize: 32,
  },
  masjidInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  masjidName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  masjidMeta: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  badgeContainer: {
    marginTop: Spacing.xs,
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
  },
  emptySubtext: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
