/**
 * Event Banner Component
 * Displays a single event banner with countdown and progress
 */

import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatTimeRemaining } from "@/hooks/use-limited-events";
import type {
  LimitedEvent,
  UserEventParticipation,
} from "@/types/limited-event";

interface EventBannerProps {
  event: LimitedEvent;
  participation?: UserEventParticipation | null;
  onPress?: () => void;
}

export function EventBanner({
  event,
  participation,
  onPress,
}: EventBannerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const [, setTick] = useState(0);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeRemaining = formatTimeRemaining(event.endDateTime);
  const hasStarted = participation !== undefined;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/limited-event/${event.id}`);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        {event.bannerUrl || event.imageUrl ? (
          <Image
            source={{ uri: event.bannerUrl || event.imageUrl || undefined }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.image,
              styles.placeholderImage,
              { backgroundColor: colors.primary },
            ]}
          />
        )}
        {/* Gradient overlay using nested Views */}
        <View style={styles.gradientOverlay} pointerEvents="none">
          <View style={styles.gradientTop} />
          <View style={styles.gradientBottom} />
        </View>
        <View style={styles.contentOverlay}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: colors.gold }]}>
              <Text style={styles.badgeText}>LIMITED EVENT</Text>
            </View>
            <Text style={styles.countdown}>{timeRemaining}</Text>
          </View>
          <Text style={styles.eventName} numberOfLines={2}>
            {event.name}
          </Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>
          <View style={styles.missionsContainer}>
            {event.missions.map((mission, missionIndex) => {
              const missionProgress = participation?.missionProgress.find(
                (p) => p.missionId === mission.id,
              );
              const currentProgress = missionProgress?.currentProgress ?? 0;
              const MAX_VISIBLE = 10;
              const displayCount = Math.min(mission.targetCount, MAX_VISIBLE);
              const overflow = mission.targetCount - MAX_VISIBLE;

              return (
                <View key={mission.id} style={styles.missionRow}>
                  {Array.from({ length: displayCount }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.circle,
                        i < currentProgress
                          ? styles.circleFilled
                          : styles.circleEmpty,
                      ]}
                    />
                  ))}
                  {overflow > 0 && (
                    <Text style={styles.overflowText}>+{overflow}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientTop: {
    flex: 3,
    backgroundColor: "transparent",
  },
  gradientBottom: {
    flex: 7,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  contentOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  countdown: {
    color: "#FFCC00",
    fontSize: 12,
    fontWeight: "600",
  },
  eventName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  eventDescription: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  missionsContainer: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  missionRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "stretch",
    width: "100%",
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 9999,
  },
  circleFilled: {
    backgroundColor: "#FFCC00",
  },
  circleEmpty: {
    backgroundColor: "rgba(255,255,255,0.35)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  overflowText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
  },
});
