import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography, primary, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocation } from '@/hooks/use-location';
import { useCheckinMasjids } from '@/hooks/use-checkin-masjids';
import { checkinToMasjid } from '@/lib/api';
import { loadActiveVisit, saveActiveVisit, clearActiveVisit } from '@/lib/storage';

type VisitState = 'idle' | 'nearby' | 'checked_in';

interface ActiveVisit {
  masjidId: string;
  masjidName: string;
  location: string;
  checkInTime: Date;
  minimumDuration: number; // minutes
}

export default function CheckInScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // State
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [activeVisit, setActiveVisit] = useState<ActiveVisit | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Location and nearby masjids
  const { location, isLoading: isLocationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const {
    data: checkinMasjids,
    isLoading: isMasjidsLoading,
    refetch: refetchMasjids,
  } = useCheckinMasjids({
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    enabled: !activeVisit,
  });

  // Get the first available masjid for check-in
  const nearbyMasjid = checkinMasjids?.[0];

  // Determine visit state
  const getVisitState = (): VisitState => {
    if (activeVisit) return 'checked_in';
    if (nearbyMasjid) return 'nearby';
    return 'idle';
  };

  const visitState = getVisitState();
  const isLoading = isLocationLoading || isMasjidsLoading;

  // Pulse animation for check-in button
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visitState === 'nearby') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [visitState]);

  useEffect(() => {
    const storedVisit = loadActiveVisit();
    if (!storedVisit) return;

    const checkInTime = new Date(storedVisit.checkInTime);
    const minimumDuration = storedVisit.minimumDuration ?? 5;
    const elapsedSeconds = Math.floor((Date.now() - checkInTime.getTime()) / 1000);
    const remainingSeconds = Math.max(0, minimumDuration * 60 - elapsedSeconds);

    setActiveVisit({
      masjidId: storedVisit.masjidId,
      masjidName: storedVisit.masjidName,
      location: storedVisit.location,
      checkInTime,
      minimumDuration,
    });
    setTimeRemaining(remainingSeconds);
  }, []);

  // Timer for active visit
  useEffect(() => {
    if (activeVisit && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeVisit, timeRemaining]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle check-in
  const handleCheckIn = useCallback(async () => {
    if (activeVisit) {
      Alert.alert('Already Checked In', 'You have an active visit. Check out to start a new one.');
      return;
    }

    if (!nearbyMasjid || !location) return;

    setIsCheckingIn(true);
    try {
      const result = await checkinToMasjid(
        nearbyMasjid.masjidId,
        location.latitude,
        location.longitude
      );

      if (result.success && result.masjid) {
        const minimumDuration = 5; // 5 minutes minimum stay
        const checkInTime = new Date();
        const visit = {
          masjidId: result.masjid.masjidId,
          masjidName: result.masjid.name,
          location: `${result.masjid.districtName}, ${result.masjid.stateName}`,
          checkInTime,
          minimumDuration,
        };
        setActiveVisit(visit);
        setTimeRemaining(minimumDuration * 60);
        saveActiveVisit({
          masjidId: visit.masjidId,
          masjidName: visit.masjidName,
          location: visit.location,
          checkInTime: checkInTime.toISOString(),
          minimumDuration: visit.minimumDuration,
        });
      } else {
        Alert.alert('Check-in Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  }, [activeVisit, nearbyMasjid, location]);

  // Handle check-out
  const handleCheckOut = useCallback(() => {
    setActiveVisit(null);
    setTimeRemaining(0);
    clearActiveVisit();
    // Refetch to update the list
    refetchMasjids();
  }, [refetchMasjids]);

  // Handle explore
  const handleExplore = useCallback(() => {
    router.push('/(tabs)/explore');
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshLocation();
    await refetchMasjids();
  }, [refreshLocation, refetchMasjids]);

  const minimumDuration = activeVisit?.minimumDuration ?? 5;
  const progressPercentage = activeVisit
    ? ((minimumDuration * 60 - timeRemaining) / (minimumDuration * 60)) * 100
    : 0;
  const canCheckOut = timeRemaining === 0;

  // Loading state
  if (isLoading && !activeVisit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {isLocationLoading ? 'Getting your location...' : 'Finding nearby masjids...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Idle state - no masjid nearby
  if (visitState === 'idle') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centeredContent}>
          <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.largeEmoji}>🕌</Text>
          </View>
          <Text style={[styles.idleTitle, { color: colors.text }]}>
            No Masjid Nearby
          </Text>
          <Text style={[styles.idleSubtitle, { color: colors.textSecondary }]}>
            Get within 100 meters of a masjid to check in
          </Text>
          <View style={styles.idleButtons}>
            <Button
              title="Refresh Location"
              variant="outline"
              onPress={handleRefresh}
              style={styles.refreshButton}
            />
            <Button
              title="Explore Nearby Masjids"
              variant="primary"
              onPress={handleExplore}
              style={styles.exploreButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Nearby state - masjid in range, can check in
  if (visitState === 'nearby' && nearbyMasjid) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centeredContent}>
            {/* Masjid Image */}
            <View style={[styles.masjidImageLarge, { backgroundColor: primary[50] }]}>
              <Text style={styles.veryLargeEmoji}>🕌</Text>
            </View>

            <Text style={[styles.masjidName, { color: colors.text }]}>
              {nearbyMasjid.name}
            </Text>
            <Text style={[styles.masjidLocation, { color: colors.textSecondary }]}>
              {nearbyMasjid.districtName}, {nearbyMasjid.stateName}
            </Text>

            {/* Distance indicator */}
            <View style={[styles.distanceBadge, { backgroundColor: colors.success + '20' }]}>
              <IconSymbol name="location.fill" size={14} color={colors.success} />
              <Text style={[styles.distanceText, { color: colors.success }]}>
                {nearbyMasjid.distanceM}m away • Within range
              </Text>
            </View>

            {/* Check-in Button */}
            <Animated.View style={[styles.checkInButtonContainer, pulseStyle]}>
              <TouchableOpacity
                style={[styles.checkInButton, { backgroundColor: primary[500] }]}
                onPress={handleCheckIn}
                activeOpacity={0.9}
                disabled={isCheckingIn}
              >
                {isCheckingIn ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="checkmark.circle.fill" size={32} color="#fff" />
                    <Text style={styles.checkInButtonText}>CHECK IN</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Points Preview */}
            <Card variant="outlined" padding="md" style={styles.pointsPreview}>
              <Text style={[styles.pointsTitle, { color: colors.textSecondary }]}>
                Points Preview
              </Text>
              <View style={styles.pointsRow}>
                <Text style={[styles.pointsLabel, { color: colors.text }]}>Base Visit</Text>
                <Text style={[styles.pointsValue, { color: colors.text }]}>10 pts</Text>
              </View>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Checked in state - active visit
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Active Visit</Text>
        </View>

        {/* Masjid Info */}
        <View style={styles.centeredContent}>
          <View style={[styles.masjidImageLarge, { backgroundColor: primary[50] }]}>
            <Text style={styles.veryLargeEmoji}>🕌</Text>
          </View>

          <Text style={[styles.masjidName, { color: colors.text }]}>
            {activeVisit?.masjidName}
          </Text>
          <Text style={[styles.masjidLocation, { color: colors.textSecondary }]}>
            {activeVisit?.location}
          </Text>
        </View>

        {/* Timer Card */}
        <Card variant="elevated" padding="lg" style={styles.timerCard}>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
            {canCheckOut ? 'Ready to check out!' : 'Time Remaining'}
          </Text>
          <Text style={[styles.timerValue, { color: canCheckOut ? colors.success : colors.text }]}>
            {canCheckOut ? '✓' : formatTime(timeRemaining)}
          </Text>
          <ProgressBar
            progress={progressPercentage}
            variant="primary"
            size="md"
          />
        </Card>

        {/* Points Preview */}
        <Card variant="outlined" padding="md" style={styles.pointsPreview}>
          <Text style={[styles.pointsTitle, { color: colors.textSecondary }]}>
            Points Preview
          </Text>
          <View style={styles.pointsRow}>
            <Text style={[styles.pointsLabel, { color: colors.text }]}>Base Visit</Text>
            <Text style={[styles.pointsValue, { color: colors.text }]}>10 pts</Text>
          </View>
          <View style={styles.pointsRow}>
            <Text style={[styles.pointsLabel, { color: colors.text, fontWeight: '600' }]}>Total</Text>
            <Text style={[styles.pointsValue, { color: colors.primary, fontWeight: '700' }]}>
              10 pts
            </Text>
          </View>
        </Card>

        {/* Check Out Button */}
        <Button
          title={canCheckOut ? 'CHECK OUT' : `CHECK OUT (${formatTime(timeRemaining)})`}
          variant={canCheckOut ? 'primary' : 'secondary'}
          disabled={!canCheckOut}
          onPress={handleCheckOut}
          style={styles.checkOutButton}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.actionButtonIcon}>📷</Text>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Add Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.actionButtonIcon}>ℹ️</Text>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Update Info</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.demoToggle}
          onPress={handleRefresh}
        >
          <Text style={{ color: colors.textTertiary }}>Refresh nearby masjids</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h3,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  largeEmoji: {
    fontSize: 48,
  },
  veryLargeEmoji: {
    fontSize: 64,
  },
  idleTitle: {
    ...Typography.h2,
    marginBottom: Spacing.sm,
  },
  idleSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  idleButtons: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },
  refreshButton: {
    marginBottom: Spacing.sm,
  },
  exploreButton: {
    marginTop: Spacing.md,
  },
  masjidImageLarge: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  masjidName: {
    ...Typography.h3,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  masjidLocation: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  distanceText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  checkInButtonContainer: {
    marginBottom: Spacing.xl,
  },
  checkInButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  checkInButtonText: {
    color: '#fff',
    ...Typography.button,
    marginTop: Spacing.sm,
  },
  timerCard: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timerLabel: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  pointsPreview: {
    marginBottom: Spacing.md,
  },
  pointsTitle: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  pointsLabel: {
    ...Typography.body,
  },
  pointsValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  checkOutButton: {
    marginBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  demoToggle: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
});
