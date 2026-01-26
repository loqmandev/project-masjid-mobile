import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, primary, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMasjidDetails } from '@/hooks/use-masjid-details';
import { useAnalytics } from '@/lib/analytics';
import { MasjidFacilities } from '@/lib/api';

// Facility configuration for display
const FACILITY_CONFIG: Record<keyof MasjidFacilities, { name: string; icon: string }> = {
  parking: { name: 'Parking', icon: '🅿️' },
  wudhuArea: { name: 'Wudhu Area', icon: '💧' },
  airConditioning: { name: 'Air Conditioning', icon: '❄️' },
  wheelchairAccess: { name: 'Wheelchair Access', icon: '♿' },
  womenSection: { name: 'Women Section', icon: '👩' },
  funeralServices: { name: 'Funeral Services', icon: '🕊️' },
  library: { name: 'Library', icon: '📚' },
  conferenceRoom: { name: 'Conference Room', icon: '🏢' },
};

export default function MasjidDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);

  // Fetch masjid details
  const {
    data: masjid,
    isLoading,
    error,
    refetch,
  } = useMasjidDetails({ masjidId: id });

  useEffect(() => {
    if (!masjid || hasTrackedView.current) return;
    screen('masjid_detail', { masjid_id: masjid.id ?? id });
    track('masjid_detail_viewed', { masjid_id: masjid.id ?? id });
    hasTrackedView.current = true;
  }, [id, masjid, screen, track]);

  const handleCheckIn = () => {
    track('masjid_checkin_clicked', { masjid_id: masjid?.id ?? id });
    router.push('/(tabs)/checkin');
  };

  const handleDirections = () => {
    if (!masjid) return;
    track('masjid_directions_clicked', { masjid_id: masjid.id });

    const { lat, lng, name } = masjid;
    const encodedName = encodeURIComponent(name);

    // Create Google Maps URL
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${encodedName}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedName}`,
    });

    Linking.openURL(url).catch(() => {
      // Fallback to web URL if app URL fails
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      );
    });
  };

  // Get available facilities
  const getAvailableFacilities = () => {
    if (!masjid?.facilities) return [];

    return Object.entries(masjid.facilities)
      .filter(([_, available]) => available)
      .map(([key]) => ({
        key,
        ...FACILITY_CONFIG[key as keyof MasjidFacilities],
      }));
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: '', headerTransparent: true }} />
        <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading masjid details...
          </Text>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error || !masjid) {
    return (
      <>
        <Stack.Screen options={{ title: '', headerTransparent: true,  headerBackButtonDisplayMode: 'minimal' }} />
        <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error?.message || 'Masjid not found'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              track('masjid_detail_refetch', { masjid_id: id });
              refetch();
            }}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </>
    );
  }

  const availableFacilities = getAvailableFacilities();

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image */}
          <View style={[styles.heroImage, { backgroundColor: primary[100] }]}>
            <Text style={styles.heroEmoji}>🕌</Text>
            {masjid.verified && (
              <View style={styles.verifiedBadge}>
                <IconSymbol name="checkmark.seal.fill" size={16} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
              </View>
            )}
          </View>

          {/* Masjid Info */}
          <View style={styles.infoSection}>
            <Text style={[styles.masjidName, { color: colors.text }]}>
              {masjid.name}
            </Text>
            <View style={styles.locationRow}>
              <IconSymbol name="location.fill" size={14} color={colors.textSecondary} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                {masjid.districtName}, {masjid.stateName}
              </Text>
            </View>
            <Text style={[styles.addressText, { color: colors.textTertiary }]}>
              {masjid.address}
            </Text>
            {masjid.jakimCode && (
              <View style={styles.jakimRow}>
                <Badge label={`JAKIM: ${masjid.jakimCode}`} variant="default" size="sm" />
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Check In"
              variant="primary"
              onPress={handleCheckIn}
              style={styles.checkInButton}
              icon={<IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />}
            />
            <Button
              title="Directions"
              variant="outline"
              onPress={handleDirections}
              style={styles.directionsButton}
              icon={<IconSymbol name="arrow.triangle.turn.up.right.diamond.fill" size={20} color={colors.primary} />}
            />
          </View>

          {/* Facilities */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Facilities
            </Text>
            {availableFacilities.length > 0 ? (
              <View style={styles.facilitiesGrid}>
                {availableFacilities.map((facility) => (
                  <View
                    key={facility.key}
                    style={[
                      styles.facilityItem,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={styles.facilityIcon}>{facility.icon}</Text>
                    <Text style={[styles.facilityName, { color: colors.primary }]}>
                      {facility.name}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noFacilitiesText, { color: colors.textTertiary }]}>
                No facilities information available
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
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
  heroImage: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 80,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  verifiedText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  infoSection: {
    padding: Spacing.md,
  },
  masjidName: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  locationText: {
    ...Typography.bodySmall,
  },
  addressText: {
    ...Typography.caption,
  },
  jakimRow: {
    marginTop: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  checkInButton: {
    flex: 1,
  },
  directionsButton: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  facilityIcon: {
    fontSize: 16,
  },
  facilityName: {
    ...Typography.caption,
    fontWeight: '500',
  },
  noFacilitiesText: {
    ...Typography.bodySmall,
    fontStyle: 'italic',
  },
});
