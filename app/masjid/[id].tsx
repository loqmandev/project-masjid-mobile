import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
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

type TabType = "photos" | "facilities" | "events";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Full-screen image viewer component with zoom/pan
function ImageViewerModal({
  visible,
  imageUri,
  onClose,
}: {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      "worklet";
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      "worklet";
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      "worklet";
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      "worklet";
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        const maxTranslateX = ((scale.value - 1) * SCREEN_WIDTH) / 2;
        const maxTranslateY = ((scale.value - 1) * SCREEN_HEIGHT) / 2;
        const clampedX = Math.max(
          -maxTranslateX,
          Math.min(maxTranslateX, translateX.value),
        );
        const clampedY = Math.max(
          -maxTranslateY,
          Math.min(maxTranslateY, translateY.value),
        );
        translateX.value = withSpring(clampedX);
        translateY.value = withSpring(clampedY);
        savedTranslateX.value = clampedX;
        savedTranslateY.value = clampedY;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      "worklet";
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const singleTapGesture = Gesture.Tap().runOnJS(true).onEnd(onClose);

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Simultaneous(
      panGesture,
      Gesture.Exclusive(doubleTapGesture, singleTapGesture),
    ),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Reset values when modal closes
  useEffect(() => {
    if (!visible) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [visible]);

  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={animatedStyle}>
            <Image
              source={{ uri: imageUri }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 }}
              contentFit="contain"
              recyclingKey={imageUri}
            />
          </Animated.View>
        </GestureDetector>
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: 50,
            right: 16,
            padding: 12,
            borderRadius: 24,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
          }}
          accessibilityLabel="Close image viewer"
          accessibilityRole="button"
        >
          <IconSymbol name="xmark" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

export default function MasjidDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);
  const [activeTab, setActiveTab] = useState<TabType>("photos");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

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

  const handleCheckIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    track("masjid_checkin_clicked", { masjid_id: masjid?.id ?? id });
    router.push("/(tabs)/checkin");
  }, [masjid?.id, id, track]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      Haptics.selectionAsync();
      track("masjid_tab_changed", { tab, masjid_id: masjid?.id });
      setActiveTab(tab);
    },
    [masjid?.id, track],
  );

  const handleDirections = useCallback(() => {
    if (!masjid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  }, [masjid, track]);

  const handlePhotoPress = useCallback(
    (photoUrl: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      track("masjid_photo_viewed", {
        masjid_id: masjid?.id,
        photo_url: photoUrl,
      });
      setSelectedImageUri(photoUrl);
      setViewerVisible(true);
    },
    [masjid?.id, track],
  );

  const closeViewer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewerVisible(false);
    setSelectedImageUri(null);
  }, []);

  // Get available facilities
  const getAvailableFacilities = () => {
    if (!masjid?.facilities) return [];

    // Map facility codes to SF Symbol icon names
    const iconByCode: Record<string, string> = {
      PRAYER_MALE: "person.praying",
      PRAYER_FEMALE: "person.praying",
      PRAYER_AC: "snowflake",
      WOMEN_FRIENDLY_LAYOUT: "person.wave.2",
      WUDHU_MALE: "drop.fill",
      WUDHU_FEMALE: "drop.fill",
      WUDHU_OKU: "wheelchair",
      TOILET_MALE: "figure.w.cafe.and.toilet",
      TOILET_FEMALE: "figure.w.cafe.and.toilet",
      TOILET_OKU: "wheelchair",
      WHEELCHAIR_ACCESS: "wheelchair",
      PARKING_COMPOUND: "local.parking",
      PARKING_STREET: "local.parking",
      WATER_DISPENSER: "water.drop",
      PHONE_CHARGER: "cpu",
      REST_AREA: "chair.lounge.fill",
      WORKING_SPACE: "laptopcomputer",
      EVENT_SPACE: "calendar",
    };

    const facilitiesData = masjid.facilities as unknown;
    if (!Array.isArray(facilitiesData)) return [];

    return facilitiesData.map((facility: { code: string; label: string }) => ({
      key: facility.code,
      name: facility.label,
      iconName: iconByCode[facility.code] ?? "checkmark",
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
            accessible={true}
            accessibilityLabel="Retry loading masjid details"
            accessibilityHint="Double tap to retry"
            accessibilityRole="button"
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
          headerTransparent: false,
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
          {/* Masjid Info */}
          <View style={styles.infoSection}>
            <Text style={[styles.masjidName, { color: colors.text }]}>
              {masjid.name}
            </Text>
            {masjid.verified && (
              <View style={styles.verifiedBadgeInline}>
                <IconSymbol
                  name="checkmark.seal.fill"
                  size={14}
                  color={colors.success}
                />
                <Text
                  style={[styles.verifiedTextInline, { color: colors.success }]}
                >
                  Verified
                </Text>
              </View>
            )}
            <View style={styles.locationRow}>
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
              accessible={true}
              accessibilityLabel="Report incorrect masjid information"
              accessibilityHint="Double tap to report an issue"
              accessibilityRole="button"
            >
              <Text style={[styles.reportLinkText, { color: colors.primary }]}>
                Incorrect information? Report here
              </Text>
            </TouchableOpacity>
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
                activeTab === "photos" && [
                  styles.tabActive,
                  { backgroundColor: colors.card },
                ],
              ]}
              onPress={() => handleTabChange("photos")}
              accessible={true}
              accessibilityLabel="Photos tab"
              accessibilityHint="Show masjid photos"
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "photos" }}
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
                activeTab === "facilities" && [
                  styles.tabActive,
                  { backgroundColor: colors.card },
                ],
              ]}
              onPress={() => handleTabChange("facilities")}
              accessible={true}
              accessibilityLabel="Facilities tab"
              accessibilityHint="Show masjid facilities"
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "facilities" }}
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
                activeTab === "events" && [
                  styles.tabActive,
                  { backgroundColor: colors.card },
                ],
              ]}
              onPress={() => handleTabChange("events")}
              accessible={true}
              accessibilityLabel="Events tab"
              accessibilityHint="Show masjid events"
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "events" }}
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
              {availableFacilities.length > 0 ? (
                <View
                  style={styles.facilitiesGrid}
                  accessible={true}
                  accessibilityLabel="Available facilities"
                  accessibilityRole="list"
                >
                  {availableFacilities.map((facility) => (
                    <View
                      key={facility.key}
                      style={[
                        styles.facilityItem,
                        { backgroundColor: colors.primaryLight },
                      ]}
                      accessible={true}
                      accessibilityLabel={facility.name}
                    >
                      <IconSymbol
                        name={facility.iconName as any}
                        size={16}
                        color={colors.primary}
                      />
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
                    accessible={true}
                    accessibilityLabel="Retry loading photos"
                    accessibilityHint="Double tap to retry"
                    accessibilityRole="button"
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : masjidPhotos && masjidPhotos.length > 0 ? (
                <View
                  style={styles.photoGrid}
                  accessible={true}
                  accessibilityLabel="Masjid photos"
                  accessibilityRole="list"
                >
                  {masjidPhotos.map((photo: { id: string; url: string }) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={styles.photoItem}
                      accessible={true}
                      accessibilityLabel={`Photo ${photo.id}`}
                      accessibilityHint="Double tap to view full image"
                      onPress={() => handlePhotoPress(photo.url)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.photoImage}
                        contentFit="cover"
                        recyclingKey={photo.id}
                      />
                    </TouchableOpacity>
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
                      <IconSymbol
                        name="camera.fill"
                        size={24}
                        color={colors.textSecondary}
                      />
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
                    <IconSymbol
                      name="calendar"
                      size={24}
                      color={colors.textSecondary}
                    />
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
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Sticky Bottom Actions */}
        <View
          style={[
            styles.stickyActions,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.stickyActionsInner}>
            <Button
              title="Check In"
              variant="primary"
              size="lg"
              onPress={handleCheckIn}
              style={styles.checkInButtonSticky}
              icon={
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={20}
                  color="#fff"
                />
              }
            />
            <Button
              title=""
              variant="outline"
              size="md"
              onPress={handleDirections}
              style={styles.directionsButtonSticky}
              icon={
                <IconSymbol
                  name="arrow.triangle.turn.up.right.diamond.fill"
                  size={24}
                  color={colors.primary}
                />
              }
            />
          </View>
        </View>

        {/* Full-screen Image Viewer */}
        <ImageViewerModal
          visible={viewerVisible}
          imageUri={selectedImageUri}
          onClose={closeViewer}
        />
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
  verifiedBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
    alignSelf: "flex-start",
  },
  verifiedTextInline: {
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
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    minHeight: 44, // Minimum touch target
  },
  reportLinkText: {
    ...Typography.bodySmall,
    textDecorationLine: "underline",
  },
  stickyActions: {
    borderTopWidth: 1,
    padding: Spacing.md,
    paddingBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stickyActionsInner: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  checkInButtonSticky: {
    flex: 9,
  },
  directionsButtonSticky: {
    flex: 1,
    minWidth: 56,
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
    paddingVertical: Spacing.md, // Increased from sm for better touch target
    minHeight: 44, // iOS minimum touch target
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
    paddingVertical: Spacing.md, // Increased from sm for better touch target
    minHeight: 44, // iOS minimum touch target
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
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
    paddingVertical: Spacing.md, // Increased from xs for better touch target
    minHeight: 44, // iOS minimum touch target
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
    borderRadius: BorderRadius.sm,
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
