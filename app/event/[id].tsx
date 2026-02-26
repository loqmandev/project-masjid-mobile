import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useEventDetails } from "@/hooks/use-event-details";
import { useAnalytics } from "@/lib/analytics";

export default function EventDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);

  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useEventDetails({ eventId: id });

  // Analytics tracking
  useEffect(() => {
    if (!event || hasTrackedView.current) return;
    screen("event_detail", { event_id: event.id });
    track("event_detail_viewed", { event_id: event.id });
    hasTrackedView.current = true;
  }, [id, event, screen, track]);

  // Handlers (for future implementation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShare = useCallback(() => {
    if (!event) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track("event_share_clicked", { event_id: event.id });
    // Share implementation - can be extended with actual share API
    const shareText = `${event.name} at ${event.masjidName}`;
    const shareUrl = `https://jejakmasjid.com/events/${event.id}`;
    // Use React Native Share if available
    void shareText;
    void shareUrl;
  }, [event, track]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddToCalendar = useCallback(() => {
    if (!event) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    track("event_add_to_calendar", { event_id: event.id });
    // Calendar integration - can be extended with actual calendar API
  }, [event, track]);

  const handleDirections = useCallback(() => {
    if (!event) return;

    const { masjidLat, masjidLng } = event;

    // Validate coordinates before opening maps
    const isValidCoordinate = (coord: number) =>
      !isNaN(coord) && coord >= -90 && coord <= 90;

    if (
      !isValidCoordinate(masjidLat) ||
      !isValidCoordinate(masjidLng)
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Invalid Location",
        "Unable to open directions for this location.",
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track("event_directions_clicked", { event_id: event.id });

    const { masjidName } = event;
    const encodedName = encodeURIComponent(masjidName);

    const url = Platform.select({
      ios: `maps://app?daddr=${masjidLat},${masjidLng}&q=${encodedName}`,
      android: `google.navigation:q=${masjidLat},${masjidLng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${masjidLat},${masjidLng}`,
    });

    Linking.openURL(url!).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${masjidLat},${masjidLng}`,
      );
    });
  }, [event, track]);

  const handleMasjidPress = useCallback(() => {
    if (!event) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    track("event_masjid_clicked", {
      event_id: event.id,
      masjid_id: event.masjidId,
    });
    router.push(`/masjid/${event.masjidId}`);
  }, [event, track]);

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
            Loading event details...
          </Text>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error || !event) {
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
            {error?.message || "Event not found"}
          </Text>
          <TouchableOpacity
            onPress={() => {
              track("event_detail_refetch", { event_id: id });
              refetch();
            }}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            accessible={true}
            accessibilityLabel="Retry loading event details"
            accessibilityHint="Double tap to retry"
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </>
    );
  }

  // Format date/time with defensive validation
  const startDate = event.startDateTime ? new Date(event.startDateTime) : null;
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;

  // Validate parsed dates
  const isValidDate = (date: Date | null): date is Date =>
    date !== null && !isNaN(date.getTime());

  if (!isValidDate(startDate)) {
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
            Invalid event date
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </>
    );
  }

  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeRange = isValidDate(endDate)
    ? `${startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
    : startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTransparent: false,
          headerBackTitle: "Back",
          // headerRight: () => (
          //   <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          //     <IconSymbol
          //       name="square.and.arrow.up"
          //       size={22}
          //       color={colors.primary}
          //     />
          //   </TouchableOpacity>
          // ),
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Image */}
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.heroImage} />
          ) : (
            <View
              style={[
                styles.heroPlaceholder,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <IconSymbol name="calendar" size={64} color={colors.primary} />
            </View>
          )}

          {/* Event Title & Category */}
          <View style={styles.contentSection}>
            <View style={styles.titleRow}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>
                {event.name}
              </Text>
              {event.category && (
                <Badge label={event.category} variant="default" size="sm" />
              )}
            </View>

            {/* Date & Time */}
            <View style={styles.infoRow}>
              <IconSymbol name="calendar" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Date & Time
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.textSecondary }]}
                >
                  {dateStr}
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.textSecondary }]}
                >
                  {timeRange}
                </Text>
              </View>
            </View>

            {/* Bonus Points */}
            <View style={styles.infoRow}>
              <IconSymbol
                name="star.fill"
                size={20}
                color={Colors.light.gold}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>
                  Bonus Points
                </Text>
                <Text
                  style={[styles.infoValue, { color: colors.textSecondary }]}
                >
                  {event.bonusPoints} points for attending
                </Text>
              </View>
            </View>

            {/* Description */}
            {event.description && (
              <View
                style={[
                  styles.descriptionSection,
                  { borderTopColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.description, { color: colors.textSecondary }]}
                >
                  {event.description}
                </Text>
              </View>
            )}

            {/* Masjid Location Card */}
            <View
              style={[styles.locationSection, { borderTopColor: colors.border }]}
            >
              <TouchableOpacity
                onPress={handleMasjidPress}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={`View ${event.masjidName} details`}
                accessibilityHint="Double tap to view masjid details"
                accessibilityRole="button"
              >
                <Card variant="outlined" padding="md">
                  <View style={styles.masjidCard}>
                    <View style={styles.masjidInfo}>
                      <Text style={[styles.masjidName, { color: colors.text }]}>
                        {event.masjidName}
                      </Text>
                      {event.masjidAddress && (
                        <Text
                          style={[
                            styles.masjidAddress,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={2}
                        >
                          {event.masjidAddress}
                        </Text>
                      )}
                    </View>
                    <IconSymbol
                      name="chevron.right"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* For future implementation - can integrate with device calendar */}
            {/* <Button
              title="Add to Calendar"
              variant="primary"
              onPress={handleAddToCalendar}
              icon={<IconSymbol name="calendar.badge.plus" size={20} color="#fff" />}
              style={styles.actionButton}
            /> */}
            <Button
              title="Get Directions"
              variant="outline"
              onPress={handleDirections}
              icon={
                <IconSymbol
                  name="location.fill"
                  size={20}
                  color={colors.primary}
                />
              }
              style={styles.actionButton}
            />
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
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  headerButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  heroImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  heroPlaceholder: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  contentSection: {
    padding: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  eventTitle: {
    ...Typography.h2,
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.bodySmall,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.body,
  },
  descriptionSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    // Note: borderTopColor is set dynamically in the component to support dark mode
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    lineHeight: 24,
  },
  locationSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    // Note: borderTopColor is set dynamically in the component to support dark mode
  },
  masjidCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  masjidInfo: {
    flex: 1,
  },
  masjidName: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  masjidAddress: {
    ...Typography.caption,
  },
  actionButtons: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    width: "100%",
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
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 44,
  },
  retryButtonText: {
    color: "#fff",
    ...Typography.button,
  },
});
