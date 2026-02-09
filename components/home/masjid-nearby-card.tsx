import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Badge } from '@/components/ui/badge';
import { MasjidResponse } from '@/lib/api';

interface MasjidNearbyCardProps {
  masjid: MasjidResponse;
  onPress: () => void;
}

export function MasjidNearbyCard({ masjid, onPress }: MasjidNearbyCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const isReady = masjid.canCheckin;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: isReady ? colors.success : colors.border,
          shadowColor: colorScheme === 'light' ? '#000' : undefined,
        },
      ]}
    >
      {/* Masjid Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isReady ? colors.success + '15' : colors.primary + '15' },
        ]}
      >
        <IconSymbol
          name="mosque"
          size={24}
          color={isReady ? colors.success : colors.primary}
        />
      </View>

      {/* Masjid Info */}
      <Text
        style={[styles.name, { color: colors.text }]}
        numberOfLines={1}
      >
        {masjid.name}
      </Text>

      {/* Distance */}
      <View style={styles.distanceRow}>
        <IconSymbol name="location" size={12} color={colors.textSecondary} />
        <Text style={[styles.distance, { color: colors.textSecondary }]}>
          {formatDistance(masjid.distanceM)}
        </Text>
      </View>

      {/* Ready Badge */}
      {isReady && (
        <View style={[styles.readyBadge, { backgroundColor: colors.success }]}>
          <IconSymbol name="checkmark" size={10} color="#fff" />
          <Text style={styles.readyText}>Ready</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    // Elevation effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distance: {
    ...Typography.caption,
    fontWeight: '500',
  },
  readyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  readyText: {
    ...Typography.caption,
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
});
