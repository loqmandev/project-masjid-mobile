/**
 * Nearby Masjids Hook
 * Fetches masjids within specified radius (default 5km)
 * Uses rounded coordinates for cache key stability
 */

import { useMemo } from 'react';
import { getNearbyMasjids, MasjidResponse } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { roundCoordinatesForCacheKey } from '@/lib/storage';

interface UseNearbyMasjidsOptions {
  latitude: number | null;
  longitude: number | null;
  radius?: number;
  facilityCodes?: string[];
  enabled?: boolean;
}

export function useNearbyMasjids({
  latitude,
  longitude,
  radius = 5,
  facilityCodes = [],
  enabled = true,
}: UseNearbyMasjidsOptions) {
  const normalizedFacilityCodes = useMemo(() => {
    const uniqueCodes = new Set(facilityCodes.filter(Boolean));
    return Array.from(uniqueCodes).sort();
  }, [facilityCodes]);

  // Round coordinates for cache key stability (~50m grid)
  const roundedCoords = useMemo(() => {
    if (latitude === null || longitude === null) return null;
    return roundCoordinatesForCacheKey(latitude, longitude);
  }, [latitude, longitude]);

  return useQuery<MasjidResponse[], Error>({
    // Use rounded coordinates for cache key to improve cache hits
    queryKey: [
      'nearby-masjids',
      roundedCoords?.lat,
      roundedCoords?.lng,
      radius,
      normalizedFacilityCodes,
    ],
    // Use actual coordinates for the API call for accuracy
    queryFn: async () => {
      if (normalizedFacilityCodes.length === 0) {
        return getNearbyMasjids(latitude!, longitude!, radius);
      }

      const results = await Promise.all(
        normalizedFacilityCodes.map((code) =>
          getNearbyMasjids(latitude!, longitude!, radius, code)
        )
      );

      if (results.length === 0) return [];

      const base = results[0];
      if (base.length === 0) return [];

      // Single filter - no intersection needed
      if (results.length === 1) return base;

      // Create intersection of masjid IDs across all filter results
      // Using incremental intersection to avoid creating multiple Set objects
      const allowedIds = new Set(base.map((m) => m.masjidId));
      for (let i = 1; i < results.length; i++) {
        const currentIds = new Set(results[i].map((m) => m.masjidId));
        for (const id of allowedIds) {
          if (!currentIds.has(id)) {
            allowedIds.delete(id);
          }
        }
      }

      return base.filter((masjid) => allowedIds.has(masjid.masjidId));
    },
    enabled: enabled && latitude !== null && longitude !== null,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: false,
  });
}
