import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { Image as ExpoImage } from "expo-image";
import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "@/components/ui/card";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getAvatarUploadUrl, getUserProfile, updateUserProfile } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { clearCachedUserProfile } from "@/lib/storage";

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data: session } = useSession();

  // Text input value stored in ref to avoid re-renders on every keystroke
  const nameRef = useRef("");
  const originalNameRef = useRef("");

  // Avatar state
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<{
    uri: string;
    mimeType: string;
  } | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const originalAvatarRef = useRef<string | null>(null);

  // Character count display - minimal state that only updates the count display
  const [charCount, setCharCount] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track whether user has an existing display name (for conditional display)
  const [hasExistingName, setHasExistingName] = useState(false);

  // Track if component is mounted for async operations
  const isMountedRef = useRef(true);

  // Load current profile data
  useEffect(() => {
    isMountedRef.current = true;

    async function loadProfile() {
      if (!session?.user) {
        if (isMountedRef.current) setIsLoading(false);
        return;
      }

      try {
        const profileData = await getUserProfile();
        const name = profileData.user.name || "";
        nameRef.current = name;
        originalNameRef.current = name;
        setCharCount(name.length);
        setHasExistingName(name.length > 0);

        // Load avatar URL
        const avatarUrl = profileData.user.image;
        setCurrentAvatarUrl(avatarUrl);
        originalAvatarRef.current = avatarUrl;

        if (isMountedRef.current) setError(null);
      } catch (err) {
        // Error logged but not using console.error in production
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMountedRef.current = false;
    };
  }, [session?.user]);

  // User has changes when they enter a new name (different from original).
  // Leaving the field empty is treated as "no changes" - users can navigate back to keep their current name.
  // Also includes avatar changes.
  const hasChanges =
    (nameRef.current.trim().length > 0 &&
      nameRef.current.trim() !== originalNameRef.current) ||
    selectedAvatar !== null ||
    (currentAvatarUrl !== originalAvatarRef.current && selectedAvatar === null);

  // Avatar helper functions
  const normalizeAssetUri = async (
    asset: ImagePicker.ImagePickerAsset,
  ): Promise<string> => {
    let uri = asset.uri;
    if (Platform.OS === "android" && uri.startsWith("content://")) {
      const ext = asset.fileName?.split(".").pop() || "jpg";
      const targetUri = `${FileSystem.cacheDirectory}avatar-${Date.now()}.${ext}`;
      await FileSystem.copyAsync({ from: uri, to: targetUri });
      uri = targetUri;
    }
    return uri;
  };

  const processSelectedImage = async (
    asset: ImagePicker.ImagePickerAsset,
  ): Promise<void> => {
    const uri = await normalizeAssetUri(asset);
    const mimeType = asset.mimeType || "image/jpeg";
    setSelectedAvatar({ uri, mimeType });
  };

  const pickFromLibrary = async (): Promise<void> => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync(false);
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Allow photo access to change your avatar.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processSelectedImage(result.assets[0]);
    }
  };

  const takePhoto = async (): Promise<void> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Allow camera access to take a photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processSelectedImage(result.assets[0]);
    }
  };

  const removeAvatar = (): void => {
    setSelectedAvatar(null);
    setCurrentAvatarUrl(null);
  };

  const showAvatarOptions = (): void => {
    Alert.alert(
      "Profile Photo",
      undefined,
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: pickFromLibrary },
        ...(currentAvatarUrl || selectedAvatar
          ? [
              {
                text: "Remove Photo",
                onPress: removeAvatar,
                style: "destructive" as const,
              },
            ]
          : []),
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const handleSave = async () => {
    const trimmedName = nameRef.current.trim();

    if (!trimmedName) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Invalid Name", "Please enter a display name.");
      return;
    }

    if (trimmedName.length < 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Invalid Name",
        "Display name must be at least 2 characters.",
      );
      return;
    }

    if (trimmedName.length > 20) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Invalid Name",
        "Display name must be 20 characters or less.",
      );
      return;
    }

    // Haptic feedback for submission start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);

    try {
      let avatarUrl = currentAvatarUrl;

      // Upload new avatar if selected
      if (selectedAvatar) {
        setIsUploadingAvatar(true);
        const uploadData = await getAvatarUploadUrl(selectedAvatar.mimeType);

        const fileBytes = await new File(selectedAvatar.uri).bytes();
        const body = fileBytes.buffer.slice(
          fileBytes.byteOffset,
          fileBytes.byteOffset + fileBytes.byteLength,
        );

        const uploadResult = await fetch(uploadData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": uploadData.contentType },
          body,
        });

        if (!uploadResult.ok) {
          throw new Error("Failed to upload avatar");
        }

        avatarUrl = uploadData.publicUrl;
        setIsUploadingAvatar(false);
      }

      // Update profile
      await updateUserProfile({
        name: trimmedName,
        avatarUrl,
      });

      // Clear the cached profile so it refreshes with new data
      clearCachedUserProfile();
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your profile has been updated.", [
        {
          text: "OK",
          onPress: () => {
            if (isMountedRef.current) router.back();
          },
        },
      ]);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Update Failed",
        err instanceof Error
          ? err.message
          : "Failed to update profile. Please try again.",
      );
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
        setIsUploadingAvatar(false);
      }
    }
  };

  // Handle text input changes with minimal state update for character count
  // Count trimmed length since validation uses trimmed value
  const handleTextChange = useCallback((text: string) => {
    nameRef.current = text;
    setCharCount(text.trim().length);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{ title: "Edit Profile", headerBackTitle: "Back" }}
        />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={["bottom"]}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading profile...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Stack.Screen
          options={{ title: "Edit Profile", headerBackTitle: "Back" }}
        />
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
          edges={["bottom"]}
        >
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
              accessible={true}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: "Edit Profile", headerBackTitle: "Back" }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["bottom"]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={showAvatarOptions}
                style={styles.avatarContainer}
                accessibilityLabel="Change profile photo"
                accessibilityRole="button"
              >
                {selectedAvatar ? (
                  <ExpoImage source={{ uri: selectedAvatar.uri }} style={styles.avatar} />
                ) : currentAvatarUrl ? (
                  <ExpoImage source={{ uri: currentAvatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="person" size={48} color={colors.primary} />
                  </View>
                )}
                {isUploadingAvatar ? (
                  <View style={[styles.editOverlay, { backgroundColor: colors.primary }]}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={[styles.editOverlay, { backgroundColor: colors.primary }]}>
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
                Tap to change profile photo
              </Text>
            </View>

            <Card variant="outlined" padding="md" style={styles.card}>
              <Text style={[styles.label, { color: colors.text }]}>
                Display Name
              </Text>
              <Text
                style={[styles.description, { color: colors.textSecondary }]}
              >
                {hasExistingName
                  ? "Your current display name is shown below. Enter a new name (2-20 characters) to change it"
                  : "Enter your display name (2-20 characters). This will be shown on your profile and can be displayed on the leaderboard based on your privacy settings."}
              </Text>

              {/* Current Name Display - non-editable, shown when user has an existing name */}
              {hasExistingName && (
                <View
                  style={[
                    styles.currentNameContainer,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderLeftColor: colors.primary,
                    },
                  ]}
                  accessible={true}
                  accessibilityLabel="Current display name"
                  accessibilityRole="text"
                >
                  <Text
                    style={[
                      styles.currentNameLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Your current display name:
                  </Text>
                  <Text
                    style={[styles.currentNameValue, { color: colors.text }]}
                  >
                    {originalNameRef.current}
                  </Text>
                </View>
              )}

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: isInputFocused
                      ? colors.primary
                      : colors.border,
                    color: colors.text,
                  },
                ]}
                defaultValue=""
                onChangeText={handleTextChange}
                placeholder={
                  hasExistingName
                    ? "Enter a new display name"
                    : "Enter your display name"
                }
                placeholderTextColor={colors.textTertiary}
                maxLength={20}
                autoCapitalize="words"
                autoCorrect={false}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                accessible={true}
                accessibilityLabel="Display name input"
                accessibilityHint={
                  hasExistingName
                    ? "Enter a new name to change your display name, or navigate back to keep your current name"
                    : "Enter the name displayed on your profile and leaderboard"
                }
                textContentType="name"
              />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>
                {charCount}/20
              </Text>
            </Card>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: hasChanges ? colors.primary : colors.border,
                },
              ]}
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
              accessible={true}
              accessibilityLabel="Save changes"
              accessibilityRole="button"
              accessibilityState={{ disabled: !hasChanges || isSaving }}
              accessibilityHint={!hasChanges ? "No changes to save" : undefined}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: hasChanges ? "#FFFFFF" : colors.textTertiary },
                  ]}
                >
                  {isUploadingAvatar ? "Uploading..." : "Save Changes"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  // Avatar styles
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  editOverlay: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarHint: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  errorText: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md, // Increased from sm to md for better touch target
    borderRadius: BorderRadius.md,
    minHeight: 44, // iOS minimum touch target
  },
  retryButtonText: {
    color: "#FFFFFF",
    ...Typography.button,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48, // Minimum touch target for Android (48dp) / iOS (44pt)
    ...Typography.body,
  },
  charCount: {
    ...Typography.caption,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  // Current name display styles
  currentNameContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
  },
  currentNameLabel: {
    ...Typography.caption,
    marginBottom: 2,
  },
  currentNameValue: {
    ...Typography.body,
  },
  saveButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  saveButtonText: {
    ...Typography.button,
    fontWeight: "600",
  },
});
