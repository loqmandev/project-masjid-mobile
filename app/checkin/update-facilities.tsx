import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFacilities, useMasjidFacilities } from '@/hooks/use-facilities';
import { useAnalytics } from '@/lib/analytics';
import { submitMasjidFacilities } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { useQueryClient } from '@tanstack/react-query';

const FACILITY_GROUPS: { title: string; codes: string[] }[] = [
  {
    title: 'Prayer',
    codes: ['PRAYER_MALE', 'PRAYER_FEMALE', 'PRAYER_AC', 'WOMEN_FRIENDLY_LAYOUT'],
  },
  {
    title: 'Wudhu',
    codes: ['WUDHU_MALE', 'WUDHU_FEMALE', 'WUDHU_OKU'],
  },
  {
    title: 'Toilets',
    codes: ['TOILET_MALE', 'TOILET_FEMALE', 'TOILET_OKU'],
  },
  {
    title: 'Accessibility',
    codes: ['WHEELCHAIR_ACCESS'],
  },
  {
    title: 'Parking',
    codes: ['PARKING_COMPOUND', 'PARKING_STREET'],
  },
  {
    title: 'Amenities',
    codes: ['WATER_DISPENSER', 'PHONE_CHARGER', 'REST_AREA', 'WORKING_SPACE'],
  },
  {
    title: 'Other',
    codes: ['EVENT_SPACE'],
  },
];

export default function UpdateFacilitiesScreen() {
  const { masjidId, masjidName } = useLocalSearchParams<{
    masjidId: string;
    masjidName?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  const {
    data: facilities,
    isLoading: isFacilitiesLoading,
    error: facilitiesError,
  } = useFacilities();

  const {
    data: confirmedFacilities,
    isLoading: isConfirmedLoading,
    error: confirmedError,
  } = useMasjidFacilities({
    masjidId,
    enabled: !!masjidId,
  });

  useEffect(() => {
    if (!masjidId) return;
    if (hasTrackedView.current) return;
    screen('update_facilities', { masjid_id: masjidId });
    track('update_facilities_viewed', { masjid_id: masjidId });
    hasTrackedView.current = true;
  }, [masjidId, screen, track]);

  useEffect(() => {
    if (!confirmedFacilities || hasInitialized.current) return;
    setSelectedCodes(new Set(confirmedFacilities.map((facility) => facility.code)));
    hasInitialized.current = true;
  }, [confirmedFacilities]);

  const facilityLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    facilities?.forEach((facility) => map.set(facility.code, facility.label));
    return map;
  }, [facilities]);

  const groupedFacilities = useMemo(() => {
    const availableCodes = new Set((facilities ?? []).map((facility) => facility.code));
    const groupCodes = new Set(FACILITY_GROUPS.flatMap((group) => group.codes));
    const groups = FACILITY_GROUPS.map((group) => ({
      ...group,
      codes: group.codes.filter((code) => availableCodes.has(code)),
    })).filter((group) => group.codes.length > 0);

    const remainingCodes = (facilities ?? [])
      .map((facility) => facility.code)
      .filter((code) => !groupCodes.has(code));

    if (remainingCodes.length > 0) {
      groups.push({ title: 'Additional', codes: remainingCodes });
    }

    return groups;
  }, [facilities]);

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      Alert.alert('Sign In Required', 'Please sign in to update facilities.');
      router.push('/auth/login');
      return;
    }
    if (!masjidId) {
      Alert.alert('Missing Masjid', 'Masjid information is unavailable.');
      return;
    }
    if (selectedCodes.size === 0) {
      Alert.alert('Select Facilities', 'Please confirm at least one facility.');
      return;
    }

    setIsSubmitting(true);
    try {
      track('update_facilities_submitted', {
        masjid_id: masjidId,
        facility_count: selectedCodes.size,
      });
      const response = await submitMasjidFacilities(masjidId, Array.from(selectedCodes));
      const pointsEarned = response.pointEarned ?? 0;

      queryClient.setQueryData(
        ['facility-contribution', masjidId],
        { pointsEarned, submittedAt: new Date().toISOString() }
      );
      queryClient.setQueryData(
        ['masjid-facilities', masjidId],
        Array.from(selectedCodes).map((code) => ({
          code,
          label: facilityLabelMap.get(code) ?? code,
        }))
      );
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      Alert.alert(
        'Facilities Saved',
        pointsEarned > 0
          ? `Thanks! You earned +${pointsEarned} points.`
          : 'Thanks! Your update is saved.'
      );
      router.back();
    } catch (error) {
      Alert.alert('Update Failed', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!masjidId) {
    return (
      <>
        <Stack.Screen options={{ title: 'Update Facilities' }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centeredContent}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              Missing masjid information.
            </Text>
            <Button title="Go Back" variant="primary" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (isFacilitiesLoading || isConfirmedLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Update Facilities' }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centeredContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading facilities...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (facilitiesError || confirmedError || !facilities) {
    return (
      <>
        <Stack.Screen options={{ title: 'Update Facilities' }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centeredContent}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {facilitiesError?.message || confirmedError?.message || 'Failed to load facilities.'}
            </Text>
            <Button title="Try Again" variant="primary" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Update Facilities',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card variant="outlined" padding="md" style={styles.headerCard}>
            <View style={styles.headerRow}>
              <IconSymbol name="checkmark.seal.fill" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {masjidName || 'This masjid'}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Tick the facilities you can confidently confirm.
            </Text>
          </Card>

          {groupedFacilities.map((group) => (
            <View key={group.title} style={styles.groupSection}>
              <Text style={[styles.groupTitle, { color: colors.text }]}>
                {group.title}
              </Text>
              <Card variant="outlined" padding="xs">
                {group.codes.map((code, index) => {
                  const label = facilityLabelMap.get(code) ?? code;
                  const checked = selectedCodes.has(code);
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[
                        styles.facilityRow,
                        index < group.codes.length - 1 && {
                          borderBottomColor: colors.border,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                        },
                      ]}
                      onPress={() => toggleCode(code)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.facilityLabel, { color: colors.text }]}>
                        {label}
                      </Text>
                      <Switch
                        value={checked}
                        onValueChange={() => toggleCode(code)}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </View>
          ))}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <Button
            title={isSubmitting ? 'Saving...' : 'Save Facilities'}
            variant="primary"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingText: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  groupSection: {
    marginBottom: Spacing.md,
  },
  groupTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  facilityRow: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  facilityLabel: {
    ...Typography.body,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
