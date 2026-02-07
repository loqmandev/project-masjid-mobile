import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFacilities } from '@/hooks/use-facilities';
import { useExploreFilters } from '@/hooks/use-explore-filters';

export default function ExploreFiltersScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { appliedFacilities, setFilters } = useExploreFilters();

  // Local state for pending selections (only applied when user taps "Search")
  const [pendingFacilities, setPendingFacilities] = useState<Set<string>>(new Set(appliedFacilities));

  const {
    data: facilities,
    isLoading: isFacilitiesLoading,
    error: facilitiesError,
  } = useFacilities();

  const handleToggleFacility = (facilityCode: string) => {
    setPendingFacilities((prev) => {
      const next = new Set(prev);
      if (next.has(facilityCode)) {
        next.delete(facilityCode);
      } else {
        next.add(facilityCode);
      }
      return next;
    });
  };

  const handleClear = () => {
    setPendingFacilities(new Set());
  };

  const handleSearch = () => {
    setFilters(pendingFacilities);
    router.back();
  };

  const screenHeight = Dimensions.get('window').height;
  const listMaxHeight = screenHeight * 0.5;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Filters',
          presentation: 'formSheet',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Facilities
          </Text>
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
          >
            <Text style={[styles.clearText, { color: colors.primary }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        {isFacilitiesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading facilities...
            </Text>
          </View>
        ) : facilitiesError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            Unable to load facilities
          </Text>
        ) : !facilities || facilities.length === 0 ? (
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            No facilities available
          </Text>
        ) : (
          <ScrollView
            style={{ maxHeight: listMaxHeight }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {facilities.map((facility) => {
              const isSelected = pendingFacilities.has(facility.code);
              return (
                <TouchableOpacity
                  key={facility.code}
                  onPress={() => handleToggleFacility(facility.code)}
                  style={[
                    styles.row,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.rowText, { color: colors.text }]}>
                    {facility.label}
                  </Text>
                  {isSelected && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.actions}>
          <Button
            title="Search"
            onPress={handleSearch}
            disabled={isFacilitiesLoading}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.h3,
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  loadingText: {
    ...Typography.caption,
  },
  errorText: {
    ...Typography.caption,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  row: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    ...Typography.body,
  },
  actions: {
    paddingTop: Spacing.sm,
  },
});
