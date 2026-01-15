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
  enabled?: boolean;
}

export function useNearbyMasjids({
  latitude,
  longitude,
  radius = 5,
  enabled = true,
}: UseNearbyMasjidsOptions) {
  // Round coordinates for cache key stability (~50m grid)
  const roundedCoords = useMemo(() => {
    if (latitude === null || longitude === null) return null;
    return roundCoordinatesForCacheKey(latitude, longitude);
  }, [latitude, longitude]);

  return useQuery<MasjidResponse[], Error>({
    // Use rounded coordinates for cache key to improve cache hits
    queryKey: ['nearby-masjids', roundedCoords?.lat, roundedCoords?.lng, radius],
    // Use actual coordinates for the API call for accuracy
    queryFn: () => getNearbyMasjids(latitude!, longitude!, radius),
    enabled: enabled && latitude !== null && longitude !== null,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: true,
  });
}
