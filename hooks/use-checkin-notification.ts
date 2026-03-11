import * as Notifications from "expo-notifications";
import { useCallback, useEffect } from "react";
import { Platform } from "react-native";

import {
  clearCheckoutNotificationId,
  loadCheckoutNotificationId,
  loadCheckoutRemindersEnabled,
  saveCheckoutNotificationId,
} from "@/lib/storage";

const CHANNEL_ID = "checkin-reminders";

export function useCheckinNotification() {
  // Set up Android notification channel on mount
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Check-in Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  }, []);

  const cancelCheckoutReminder = useCallback(async () => {
    const id = loadCheckoutNotificationId();
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      clearCheckoutNotificationId();
    }
  }, []);

  const scheduleCheckoutReminder = useCallback(
    async (checkInTime: Date, masjidName: string, minimumMinutes = 10) => {
      // Respect user preference
      if (!loadCheckoutRemindersEnabled()) return;

      // Cancel any existing reminder first
      await cancelCheckoutReminder();

      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const triggerDate = new Date(
        checkInTime.getTime() + minimumMinutes * 60 * 1000,
      );

      // Don't schedule if the time has already passed
      if (triggerDate.getTime() <= Date.now()) return;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to check out! 🕌",
          body: `You've been at ${masjidName} for ${minimumMinutes} minutes. Check out now while you're still nearby!`,
          data: { url: "/(tabs)/checkin" },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      saveCheckoutNotificationId(id);
    },
    [cancelCheckoutReminder, requestPermissions],
  );

  return {
    scheduleCheckoutReminder,
    cancelCheckoutReminder,
    requestPermissions,
  };
}
