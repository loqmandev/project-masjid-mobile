import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMasjidDetails } from "@/hooks/use-masjid-details";
import { useMasjidPhotos } from "@/hooks/use-masjid-photos";
import { useAnalytics } from "@/lib/analytics";

type TabType = "facilities" | "photos" | "events";

export default function MasjidDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);
  const [activeTab, setActiveTab] = useState<TabType>("facilities");

  // Fetch masjid details
  const {
    data: masjid,
    isLoading,
    error,
    refetch,
  } = useMasjidDetails({ masjidId: id });
  const {
    data: masjidPhotos,
    isLoading: isPhotosLoading,
    isError: isPhotosError,
    refetch: refetchPhotos,
  } = useMasjidPhotos({ masjidId: id, limit: 100 });

  useEffect(() => {
    if (!masjid || hasTrackedView.current) return;
    screen("masjid_detail", { masjid_id: masjid.id ?? id });
    track("masjid_detail_viewed", { masjid_id: masjid.id ?? id });
    hasTrackedView.current = true;
  }, [id, masjid, screen, track]);

  const handleCheckIn = () => {
    track("masjid_checkin_clicked", { masjid_id: masjid?.id ?? id });
    router.push("/(tabs)/checkin");
  };

  const handleDirections = () => {
    if (!masjid) return;
    track("masjid_directions_clicked", { masjid_id: masjid.id });

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
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      );
    });
  };

  // Get available facilities
  const getAvailableFacilities = () => {
    if (!masjid?.facilities) return [];

    const iconByCode: Record<string, string> = {
      PRAYER_MALE: "🕌",
      PRAYER_FEMALE: "🕌",
      PRAYER_AC: "❄️",
      WOMEN_FRIENDLY_LAYOUT: "👩",
      WUDHU_MALE: "💧",
      WUDHU_FEMALE: "💧",
      WUDHU_OKU: "♿",
      TOILET_MALE: "🚻",
      TOILET_FEMALE: "🚻",
      TOILET_OKU: "♿",
      WHEELCHAIR_ACCESS: "♿",
      PARKING_COMPOUND: "🅿️",
      PARKING_STREET: "🅿️",
      WATER_DISPENSER: "🚰",
      PHONE_CHARGER: "🔌",
      REST_AREA: "🪑",
      WORKING_SPACE: "💻",
      EVENT_SPACE: "🎪",
    };

    const facilitiesData = masjid.facilities as unknown;
    if (!Array.isArray(facilitiesData)) return [];

    return facilitiesData.map((facility: { code: string; label: string }) => ({
      key: facility.code,
      name: facility.label,
      icon: iconByCode[facility.code] ?? "✅",
    }));
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "", headerTransparent: true }} />
        <SafeAreaView
          style={[
            styles.container,
            styles.centerContent,
            { backgroundColor: colors.background },
          ]}
        >
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
        <Stack.Screen
          options={{
            title: "",
            headerTransparent: true,
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <SafeAreaView
          style={[
            styles.container,
            styles.centerContent,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error?.message || "Masjid not found"}
          </Text>
          <TouchableOpacity
            onPress={() => {
              track("masjid_detail_refetch", { masjid_id: id });
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
          title: "",
          headerTransparent: true,
          headerBackTitle: "Back",
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image */}
          <View
            style={[
              styles.heroImage,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <View
              style={[
                styles.heroIconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <IconSymbol name="camera.fill" size={40} color={colors.primary} />
            </View>
            {masjid.verified && (
              <View style={styles.verifiedBadge}>
                <IconSymbol
                  name="checkmark.seal.fill"
                  size={16}
                  color={colors.success}
                />
                <Text style={[styles.verifiedText, { color: colors.success }]}>
                  Verified
                </Text>
              </View>
            )}
          </View>

          {/* Masjid Info */}
          <View style={styles.infoSection}>
            <Text style={[styles.masjidName, { color: colors.text }]}>
              {masjid.name}
            </Text>
            <View style={styles.locationRow}>
              <IconSymbol
                name="location.fill"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.locationText, { color: colors.textSecondary }]}
              >
                {masjid.districtName}, {masjid.stateName}
              </Text>
            </View>
            <Text style={[styles.addressText, { color: colors.textTertiary }]}>
              {masjid.address}
            </Text>
            {masjid.jakimCode && (
              <View style={styles.jakimRow}>
                <Badge
                  label={`JAKIM: ${masjid.jakimCode}`}
                  variant="default"
                  size="sm"
                />
              </View>
            )}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/masjid-report",
                  params: {
                    masjidId: masjid.masjidId,
                    masjidName: masjid.name,
                    address: masjid.address,
                    lat: masjid.lat.toString(),
                    lng: masjid.lng.toString(),
                  },
                })
              }
              style={styles.reportLink}
            >
              <IconSymbol
                name="exclamationmark.circle"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.reportLinkText, { color: colors.primary }]}>
                Incorrect information? Report here
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Check In"
              variant="primary"
              onPress={handleCheckIn}
              style={styles.checkInButton}
              icon={
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={20}
                  color="#fff"
                />
              }
            />
            <Button
              title="Directions"
              variant="outline"
              onPress={handleDirections}
              style={styles.directionsButton}
              icon={
                <IconSymbol
                  name="arrow.triangle.turn.up.right.diamond.fill"
                  size={20}
                  color={colors.primary}
                />
              }
            />
          </View>

          {/* Tabs */}
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "facilities" && [
                  styles.tabActive,
                  { backgroundColor: colors.card },
                ],
              ]}
              onPress={() => setActiveTab("facilities")}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "facilities"
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                Facilities
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "photos" && [
                  styles.tabActive,
                  { backgroundColor: colors.card },
                ],
              ]}
              onPress={() => setActiveTab("photos")}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "photos"
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                Photos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "events" && [
                  styles.tabActive,
                  { backgroundColor: colors.card },
                ],
              ]}
              onPress={() => setActiveTab("events")}
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
            </TouchableOpacity>
          </View>

          {activeTab === "facilities" && (
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
                      <Text
                        style={[styles.facilityName, { color: colors.primary }]}
                      >
                        {facility.name}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  style={[
                    styles.noFacilitiesText,
                    { color: colors.textTertiary },
                  ]}
                >
                  No facilities information available
                </Text>
              )}
            </View>
          )}

          {activeTab === "photos" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Photos
              </Text>
              {isPhotosLoading ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[
                      styles.loadingInlineText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Loading photos...
                  </Text>
                </View>
              ) : isPhotosError ? (
                <View style={styles.errorInline}>
                  <Text
                    style={[styles.errorInlineText, { color: colors.error }]}
                  >
                    Failed to load photos
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      track("masjid_photos_refetch", { masjid_id: masjid.id });
                      refetchPhotos();
                    }}
                    style={[
                      styles.retryButtonInline,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : masjidPhotos && masjidPhotos.length > 0 ? (
                <View style={styles.photoGrid}>
                  {masjidPhotos.map((photo) => (
                    <View key={photo.id} style={styles.photoItem}>
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.photoImage}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <Card
                  variant="outlined"
                  padding="md"
                  style={styles.placeholderCard}
                >
                  <View style={styles.placeholderHeader}>
                    <View
                      style={[
                        styles.placeholderIcon,
                        { backgroundColor: colors.backgroundSecondary },
                      ]}
                    >
                      <Text style={styles.placeholderEmoji}>📸</Text>
                    </View>
                    <View style={styles.placeholderContent}>
                      <Text
                        style={[
                          styles.placeholderTitle,
                          { color: colors.text },
                        ]}
                      >
                        No photos yet
                      </Text>
                      <Text
                        style={[
                          styles.placeholderText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Photos can be added after checking in. We’ll review
                        before publishing.
                      </Text>
                    </View>
                  </View>
                </Card>
              )}
            </View>
          )}

          {activeTab === "events" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Events
              </Text>
              <Card
                variant="outlined"
                padding="md"
                style={styles.placeholderCard}
              >
                <View style={styles.placeholderHeader}>
                  <View
                    style={[
                      styles.placeholderIcon,
                      { backgroundColor: colors.backgroundSecondary },
                    ]}
                  >
                    <Text style={styles.placeholderEmoji}>🗓️</Text>
                  </View>
                  <View style={styles.placeholderContent}>
                    <Text
                      style={[styles.placeholderTitle, { color: colors.text }]}
                    >
                      Coming soon
                    </Text>
                    <Text
                      style={[
                        styles.placeholderText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Events will show upcoming programs and prayer schedules.
                    </Text>
                    <View style={styles.lockHint}>
                      <IconSymbol
                        name="lock.fill"
                        size={12}
                        color={colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.lockHintText,
                          { color: colors.textTertiary },
                        ]}
                      >
                        Available after check-in
                      </Text>
                    </View>
                  </View>
                </View>
                <Button
                  title="Notify me"
                  variant="outline"
                  onPress={() => {}}
                  style={styles.placeholderButton}
                />
              </Card>
            </View>
          )}
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
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: "#fff",
    ...Typography.button,
  },
  heroImage: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  verifiedText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  infoSection: {
    padding: Spacing.md,
  },
  masjidName: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
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
  reportLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  reportLinkText: {
    ...Typography.bodySmall,
    textDecorationLine: "underline",
  },
  actionButtons: {
    flexDirection: "row",
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
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    padding: 4,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    ...Typography.bodySmall,
    fontWeight: "600",
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "500",
  },
  noFacilitiesText: {
    ...Typography.bodySmall,
    fontStyle: "italic",
  },
  placeholderCard: {
    gap: Spacing.md,
  },
  placeholderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  placeholderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 24,
  },
  placeholderContent: {
    flex: 1,
  },
  placeholderTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  placeholderText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  placeholderButton: {
    alignSelf: "flex-start",
  },
  loadingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  loadingInlineText: {
    ...Typography.bodySmall,
  },
  errorInline: {
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  errorInlineText: {
    ...Typography.bodySmall,
  },
  retryButtonInline: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  photoItem: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: "#F2F2F2",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  lockHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  lockHintText: {
    ...Typography.caption,
  },
});
