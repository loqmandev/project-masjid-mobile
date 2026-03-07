/**
 * useShareProfile Hook
 * Handles capturing and sharing user's profile card via native share sheet
 */

import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { useCallback, useRef, useState } from "react";
import { Alert, findNodeHandle, View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { useAnalytics } from "@/lib/analytics";

interface UseShareProfileReturn {
  shareProfile: () => Promise<void>;
  isSharing: boolean;
  shareableCardRef: React.RefObject<View | null>;
}

export function useShareProfile(): UseShareProfileReturn {
  const [isSharing, setIsSharing] = useState(false);
  const shareableCardRef = useRef<View>(null);
  const { track } = useAnalytics();

  const shareProfile = useCallback(async () => {
    if (isSharing) return;

    try {
      setIsSharing(true);

      // Haptic feedback on press
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      track("profile_share_tapped");

      // Capture the shareable card view
      const ref = shareableCardRef.current;
      if (!ref) {
        throw new Error("Shareable card ref not available");
      }

      const nodeHandle = findNodeHandle(ref);
      if (!nodeHandle) {
        throw new Error("Could not find node handle for shareable card");
      }

      // Capture as PNG with high quality
      const uri = await captureRef(ref, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Sharing Not Available",
          "Sharing is not available on this device.",
        );
        track("profile_share_error", { error: "sharing_not_available" });
        return;
      }

      // Open native share sheet
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share Profile",
        UTI: "public.png",
      });

      track("profile_shared");
    } catch (error) {
      console.error("Failed to share profile:", error);
      track("profile_share_error", {
        error: error instanceof Error ? error.message : "unknown",
      });
      Alert.alert(
        "Share Failed",
        "Unable to share your profile. Please try again.",
      );
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, track]);

  return {
    shareProfile,
    isSharing,
    shareableCardRef,
  };
}
