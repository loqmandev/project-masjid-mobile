import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TextInput } from "@/components/ui/text-input";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocation } from "@/hooks/use-location";
import { useMasjidReport } from "@/hooks/use-masjid-report";

import type {
  MasjidReportFieldName,
  MasjidReportType,
} from "@/types/masjid-report";

const FIELD_OPTIONS: { value: MasjidReportFieldName; label: string }[] = [
  { value: "name", label: "Masjid Name" },
  { value: "address", label: "Address" },
  { value: "coordinates", label: "Coordinates (Location)" },
  { value: "facilities", label: "Facilities" },
  { value: "other", label: "Other" },
];

const POINTS_EARNED = 50;

export default function MasjidReportScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { submitReport, isSubmitting, error, clearError } = useMasjidReport();
  const { location: currentLocation } = useLocation();

  // Get params from navigation
  const params = useLocalSearchParams<{
    masjidId?: string;
    masjidName?: string;
    address?: string;
    lat?: string;
    lng?: string;
  }>();

  const hasPreFilledMasjid = !!params.masjidId;

  // Report type state - UI state that needs re-render
  const [reportType, setReportType] = useState<MasjidReportType>(
    hasPreFilledMasjid ? "incorrect-info" : "missing-masjid",
  );

  // Field selection state - UI state that needs re-render
  const [fieldName, setFieldName] = useState<MasjidReportFieldName>("address");

  // Success state - UI state that needs re-render
  const [showSuccess, setShowSuccess] = useState(false);

  // Text input values - use refs to avoid re-renders on every keystroke
  const correctValueRef = useRef("");
  const masjidNameRef = useRef(params.masjidName ?? "");
  const addressRef = useRef(params.address ?? "");
  const coordinatesRef = useRef("");
  const descriptionRef = useRef("");

  // Ref for navigation timer to prevent memory leak
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, []);

  // Auto-navigate back after success with cleanup
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

  // Update coordinates when location is available for missing masjid
  useEffect(() => {
    if (reportType === "missing-masjid" && currentLocation && !coordinatesRef.current) {
      coordinatesRef.current = `${currentLocation.latitude.toFixed(6)},${currentLocation.longitude.toFixed(6)}`;
    }
  }, [reportType, currentLocation]);

  const validateForm = (): boolean => {
    clearError();

    if (reportType === "incorrect-info") {
      if (!params.masjidId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Masjid information is missing.");
        return false;
      }
      // Only require correctValue for name, address, coordinates
      const correctValue = correctValueRef.current.trim();
      if (
        (fieldName === "name" ||
          fieldName === "address" ||
          fieldName === "coordinates") &&
        !correctValue
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Required Field",
          "Please provide the correct information.",
        );
        return false;
      }
    } else {
      // missing-masjid
      if (!masjidNameRef.current.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Required Field", "Please enter the masjid name.");
        return false;
      }
      if (!addressRef.current.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Required Field", "Please enter the address.");
        return false;
      }
      if (!coordinatesRef.current.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Required Field", "Please provide the coordinates.");
        return false;
      }
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

    // Haptic feedback for submission start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const reportData = {
        type: reportType,
        ...(reportType === "incorrect-info" && {
          masjidId: params.masjidId,
          fieldName,
          currentValue: getCurrentValueDisplay(),
          correctValue: correctValueRef.current.trim(),
        }),
        ...(reportType === "missing-masjid" && {
          masjidName: masjidNameRef.current.trim(),
          address: addressRef.current.trim(),
          coordinates: coordinatesRef.current.trim(),
        }),
        description: descriptionRef.current.trim(),
      };

      await submitReport(reportData);

      // Trigger haptic success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setShowSuccess(true);
    } catch (err) {
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Error is already set in the hook
      const message =
        err instanceof Error ? err.message : "Failed to submit report";
      Alert.alert("Submission Failed", message);
    }
  };

  const getCurrentValueDisplay = (): string => {
    if (fieldName === "name") return params.masjidName ?? "";
    if (fieldName === "address") return params.address ?? "";
    if (fieldName === "coordinates" && params.lat && params.lng) {
      return `${params.lat}, ${params.lng}`;
    }
    return "";
  };

  // Reset form fields when switching report types
  const handleReportTypeChange = (type: MasjidReportType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReportType(type);
    correctValueRef.current = "";
    descriptionRef.current = "";
  };

  // Handle field selection with haptic feedback
  const handleFieldSelect = (field: MasjidReportFieldName) => {
    Haptics.selectionAsync();
    setFieldName(field);
  };

  // Handle use current location with haptic feedback
  const handleUseCurrentLocation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentLocation) {
      coordinatesRef.current = `${currentLocation.latitude.toFixed(6)},${currentLocation.longitude.toFixed(6)}`;
    } else {
      Alert.alert(
        "Location Not Available",
        "Unable to get your current location. Please enable location services.",
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Report Masjid",
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
          {/* Info Card */}
          <Card variant="outlined" padding="md" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <IconSymbol
                name="info.circle.fill"
                size={20}
                color={colors.primary}
              />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>
                  Help us improve
                </Text>
                <Text
                  style={[styles.infoText, { color: colors.textSecondary }]}
                >
                  {hasPreFilledMasjid
                    ? "Report incorrect information about this masjid. Our team will verify and update it."
                    : "Submit a missing masjid that is not in our database. You will earn 50 points after submission."}
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
                >
                  You earned {POINTS_EARNED} points for helping improve our
                  masjid database.
                </Text>
                <Text
                  style={[
                    styles.successSubtext,
                    { color: colors.textTertiary },
                  ]}
                >
                  Returning to previous screen...
                </Text>
              </View>
            </Card>
          ) : (
            <>
              {/* Report Type Selector */}
              <Text style={[styles.label, { color: colors.text }]}>
                Report Type
              </Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    reportType === "incorrect-info" && [
                      styles.typeButtonActive,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ],
                    { borderColor: colors.border },
                  ]}
                  onPress={() => handleReportTypeChange("incorrect-info")}
                  disabled={!hasPreFilledMasjid}
                  accessible={true}
                  accessibilityLabel="Report incorrect information"
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: reportType === "incorrect-info",
                  }}
                  accessibilityHint={
                    !hasPreFilledMasjid
                      ? "Not available - no masjid selected"
                      : undefined
                  }
                >
                  <IconSymbol
                    name="exclamationmark.bubble.fill"
                    size={18}
                    color={
                      reportType === "incorrect-info"
                        ? "#fff"
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      {
                        color:
                          reportType === "incorrect-info"
                            ? "#fff"
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    Incorrect Info
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    reportType === "missing-masjid" && [
                      styles.typeButtonActive,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ],
                    { borderColor: colors.border },
                  ]}
                  onPress={() => handleReportTypeChange("missing-masjid")}
                  accessible={true}
                  accessibilityLabel="Submit a missing masjid"
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: reportType === "missing-masjid",
                  }}
                >
                  <IconSymbol
                    name="plus.circle.fill"
                    size={18}
                    color={
                      reportType === "missing-masjid"
                        ? "#fff"
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      {
                        color:
                          reportType === "missing-masjid"
                            ? "#fff"
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    Missing Masjid
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Incorrect Info Form */}
              {reportType === "incorrect-info" && (
                <>
                  {/* Pre-filled masjid info */}
                  <Card
                    variant="default"
                    padding="sm"
                    style={styles.preFillCard}
                  >
                    <Text
                      style={[
                        styles.preFillLabel,
                        { color: colors.textTertiary },
                      ]}
                    >
                      Reporting masjid:
                    </Text>
                    <Text style={[styles.preFillValue, { color: colors.text }]}>
                      {params.masjidName}
                    </Text>
                    {params.address && (
                      <Text
                        style={[
                          styles.preFillSubtext,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {params.address}
                      </Text>
                    )}
                  </Card>

                  {/* Field Selector */}
                  <Text style={[styles.label, { color: colors.text }]}>
                    What information is incorrect?
                  </Text>
                  <View
                    style={[
                      styles.fieldSelector,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    {FIELD_OPTIONS.map((field) => (
                      <TouchableOpacity
                        key={field.value}
                        style={[
                          styles.fieldOption,
                          fieldName === field.value && {
                            backgroundColor: colors.primaryLight,
                          },
                        ]}
                        onPress={() => handleFieldSelect(field.value)}
                        accessible={true}
                        accessibilityLabel={field.label}
                        accessibilityRole="radio"
                        accessibilityState={{
                          selected: fieldName === field.value,
                        }}
                      >
                        <View
                          style={[
                            styles.fieldRadio,
                            {
                              borderColor:
                                fieldName === field.value
                                  ? colors.primary
                                  : colors.border,
                            },
                          ]}
                        >
                          {fieldName === field.value && (
                            <View
                              style={[
                                styles.fieldRadioInner,
                                { backgroundColor: colors.primary },
                              ]}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.fieldOptionText,
                            { color: colors.text },
                          ]}
                        >
                          {field.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Current Value Display */}
                  {getCurrentValueDisplay() && (
                    <>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Current Value
                      </Text>
                      <View
                        style={[
                          styles.currentValue,
                          { backgroundColor: colors.backgroundSecondary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.currentValueText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {getCurrentValueDisplay()}
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Correct Value Input - only for name, address, coordinates */}
                  {fieldName === "name" ||
                  fieldName === "address" ||
                  fieldName === "coordinates" ? (
                    <>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Correct Value *
                      </Text>
                      <TextInput
                        defaultValue={correctValueRef.current}
                        onChangeText={(text) => {
                          correctValueRef.current = text;
                        }}
                        placeholder={
                          fieldName === "name"
                            ? "Enter correct masjid name"
                            : fieldName === "address"
                              ? "Enter correct address"
                              : "Enter correct coordinates (lat, lng)"
                        }
                        placeholderTextColor={colors.textTertiary}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.label, { color: colors.text }]}>
                        Additional Information
                      </Text>
                      <Text
                        style={[styles.hint, { color: colors.textTertiary }]}
                      >
                        {fieldName === "facilities"
                          ? "Please describe which facilities are incorrect or missing."
                          : "Please describe the issue in detail."}
                      </Text>
                    </>
                  )}
                </>
              )}

              {/* Missing Masjid Form */}
              {reportType === "missing-masjid" && (
                <>
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

                  <Text style={[styles.label, { color: colors.text }]}>
                    Address *
                  </Text>
                  <TextInput
                    defaultValue={addressRef.current}
                    onChangeText={(text) => {
                      addressRef.current = text;
                    }}
                    placeholder="Enter full address"
                    placeholderTextColor={colors.textTertiary}
                  />

                  <Text style={[styles.label, { color: colors.text }]}>
                    Coordinates *
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
                    style={[
                      styles.locationButton,
                      { borderColor: colors.primary },
                    ]}
                    accessible={true}
                    accessibilityLabel="Use current location"
                    accessibilityHint="Fill coordinates with your current GPS location"
                  >
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
                  </TouchableOpacity>
                </>
              )}

              {/* Description */}
              <Text style={[styles.label, { color: colors.text }]}>
                Description *
              </Text>
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                Please provide additional details to help us verify this report.
              </Text>
              <View style={[styles.textAreaContainer]}>
                <TextInput
                  defaultValue={descriptionRef.current}
                  onChangeText={(text) => {
                    descriptionRef.current = text;
                  }}
                  placeholder="Describe the issue or provide additional information..."
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
                  <Text style={[styles.errorText, { color: colors.error }]}>
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
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  typeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md, // Increased from sm to md
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 44, // iOS minimum touch target
  },
  typeButtonActive: {},
  typeButtonText: {
    ...Typography.bodySmall,
    fontWeight: "600",
  },
  preFillCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  preFillLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  preFillValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  preFillSubtext: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  fieldSelector: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
  },
  fieldOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md, // Increased from sm to md
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minHeight: 44, // iOS minimum touch target
  },
  fieldRadio: {
    width: 24, // Increased from 20 for better visibility
    height: 24, // Increased from 20 for better visibility
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  fieldRadioInner: {
    width: 12, // Increased from 10
    height: 12, // Increased from 10
    borderRadius: 6,
  },
  fieldOptionText: {
    ...Typography.body,
  },
  currentValue: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  currentValueText: {
    ...Typography.body,
    fontStyle: "italic",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md, // Increased from sm to md
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    minHeight: 44, // iOS minimum touch target
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
