import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TextInput } from "@/components/ui/text-input";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { useMasjidReport } from "@/hooks/use-masjid-report";

import type { MasjidReportData } from "@/types/masjid-report";

const POINTS_EARNED = 15;

export default function MasjidReportScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { submitReport, isSubmitting, error, clearError } = useMasjidReport();
  const { refresh } = useLocation();

  // Track when user explicitly requests location refresh
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get params from navigation
  const params = useLocalSearchParams<{
    masjidId?: string;
    masjidName?: string;
    address?: string;
    lat?: string;
    lng?: string;
  }>();

  const isEditingExisting = !!params.masjidId;

  // Success state - UI state that needs re-render
  const [showSuccess, setShowSuccess] = useState(false);

  // Text input values - use refs to avoid re-renders on every keystroke
  const masjidNameRef = useRef(params.masjidName ?? "");
  const addressRef = useRef(params.address ?? "");
  const coordinatesRef = useRef(
    params.lat && params.lng ? `${params.lat}, ${params.lng}` : "",
  );
  const descriptionRef = useRef("");

  // Ref for navigation timer to prevent memory leak
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-navigate back after success
  useEffect(() => {
    if (showSuccess) {
      navTimerRef.current = setTimeout(() => {
        router.back();
      }, 2000);
    }
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
        navTimerRef.current = null;
      }
    };
  }, [showSuccess]);

  const validateForm = (): boolean => {
    clearError();

    if (!masjidNameRef.current.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Required Field", "Please enter the masjid name.");
      return false;
    }

    if (!isEditingExisting && !addressRef.current.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Required Field", "Please enter the address.");
      return false;
    }

    if (!descriptionRef.current.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Required Field", "Please provide a description.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const reportData: MasjidReportData = {
        type: isEditingExisting ? "incorrect-info" : "missing-masjid",
        ...(isEditingExisting && { masjidId: params.masjidId }),
        masjidName: masjidNameRef.current.trim(),
        address: addressRef.current.trim(),
        coordinates: coordinatesRef.current.trim(),
        description: descriptionRef.current.trim(),
      };

      await submitReport(reportData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message =
        err instanceof Error ? err.message : "Failed to submit report";
      Alert.alert("Submission Failed", message);
    }
  };

  const handleUseCurrentLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGettingLocation(true);

    const location = await refresh(true); // Force refresh to get fresh location

    if (location) {
      coordinatesRef.current = `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}`;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert(
        "Location Not Available",
        "Unable to get your current location. Please enable location services.",
      );
    }

    setIsGettingLocation(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditingExisting ? "Edit Masjid Info" : "Add Missing Masjid",
          headerBackTitle: "Back",
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <Card variant="outlined" padding="md" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <IconSymbol
              name={
                isEditingExisting ? "pencil.circle.fill" : "plus.circle.fill"
              }
              size={20}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                {isEditingExisting ? "Suggest an edit" : "Add a new masjid"}
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {isEditingExisting
                  ? "Update the information below. Our team will verify your changes."
                  : "Fill in the details for a masjid not in our database. Earn 50 points after approval."}
              </Text>
            </View>
          </View>
        </Card>

        {/* Success State */}
        {showSuccess ? (
          <Card variant="outlined" padding="lg" style={styles.successCard}>
            <View style={styles.successContent}>
              <View
                style={[
                  styles.successIcon,
                  { backgroundColor: colors.success + "20" },
                ]}
              >
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={48}
                  color={colors.success}
                />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>
                Report Submitted!
              </Text>
              <Text
                style={[styles.successText, { color: colors.textSecondary }]}
                selectable
              >
                You earned {POINTS_EARNED} points for helping improve our masjid
                database.
              </Text>
              <Text
                style={[styles.successSubtext, { color: colors.textTertiary }]}
              >
                Returning to previous screen...
              </Text>
            </View>
          </Card>
        ) : (
          <>
            {/* Masjid Name */}
            <Text style={[styles.label, { color: colors.text }]}>
              Masjid Name *
            </Text>
            <TextInput
              defaultValue={masjidNameRef.current}
              onChangeText={(text) => {
                masjidNameRef.current = text;
              }}
              placeholder="Enter masjid name"
              placeholderTextColor={colors.textTertiary}
            />

            {/* Address */}
            <Text style={[styles.label, { color: colors.text }]}>
              Address {isEditingExisting && "(optional)"}
            </Text>
            <TextInput
              defaultValue={addressRef.current}
              onChangeText={(text) => {
                addressRef.current = text;
              }}
              placeholder="Enter full address"
              placeholderTextColor={colors.textTertiary}
            />

            {/* Coordinates */}
            <Text style={[styles.label, { color: colors.text }]}>
              Coordinates (optional)
            </Text>
            <TextInput
              defaultValue={coordinatesRef.current}
              onChangeText={(text) => {
                coordinatesRef.current = text;
              }}
              placeholder="3.123456, 101.234567"
              placeholderTextColor={colors.textTertiary}
            />
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              style={[styles.locationButton, { borderColor: colors.primary }]}
              disabled={isGettingLocation}
              accessible={true}
              accessibilityLabel="Use current location"
              accessibilityHint="Fill coordinates with your current GPS location"
            >
              {isGettingLocation ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[
                      styles.locationButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    Getting Location...
                  </Text>
                </>
              ) : (
                <>
                  <IconSymbol
                    name="location.fill"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.locationButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    Use Current Location
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Description */}
            <Text style={[styles.label, { color: colors.text }]}>
              Description *
            </Text>
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              {isEditingExisting
                ? "Describe what information is incorrect and provide the correct details."
                : "Provide any additional details about this masjid."}
            </Text>
            <View style={[styles.textAreaContainer]}>
              <TextInput
                defaultValue={descriptionRef.current}
                onChangeText={(text) => {
                  descriptionRef.current = text;
                }}
                placeholder={
                  isEditingExisting
                    ? "e.g., The coordinates are incorrect. The correct coordinates are..."
                    : "e.g., This masjid has parking and wudu facilities..."
                }
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                style={styles.textArea}
                textAlignVertical="top"
              />
            </View>

            {/* Error Display */}
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: colors.error + "15" },
                ]}
              >
                <IconSymbol
                  name="exclamationmark.triangle.fill"
                  size={16}
                  color={colors.error}
                />
                <Text
                  style={[styles.errorText, { color: colors.error }]}
                  selectable
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <View style={styles.buttonContainer}>
              <Button
                title={
                  isSubmitting
                    ? "Submitting..."
                    : `Submit Report (+${POINTS_EARNED} pts)`
                }
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={styles.submitButton}
              />
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  infoCard: {
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.caption,
    lineHeight: 18,
  },
  successCard: {
    marginTop: Spacing.lg,
  },
  successContent: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  successTitle: {
    ...Typography.h3,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  successText: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  successSubtext: {
    ...Typography.caption,
    textAlign: "center",
  },
  label: {
    ...Typography.body,
    fontWeight: "600",
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  hint: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    minHeight: 44,
  },
  locationButtonText: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  textAreaContainer: {
    minHeight: 100,
  },
  textArea: {
    ...Typography.body,
    flex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.caption,
    flex: 1,
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
  submitButton: {
    width: "100%",
  },
});
