/**
 * Check-in Masjids Hook
 * Fetches masjids available for check-in within proximity
 * Uses rounded coordinates for cache key stability
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCheckinEligibleMasjids, MasjidResponse } from '@/lib/api';
import { roundCoordinatesForCacheKey } from '@/lib/storage';

interface UseCheckinMasjidsOptions {
  latitude: number | null;
  longitude: number | null;
  enabled?: boolean;
}

export function useCheckinMasjids({
  latitude,
  longitude,
  enabled = true,
}: UseCheckinMasjidsOptions) {
  // Round coordinates for cache key stability (~50m grid)
  // This prevents unnecessary refetches when user moves slightly
  const roundedCoords = useMemo(() => {
    if (latitude === null || longitude === null) return null;
    return roundCoordinatesForCacheKey(latitude, longitude);
  }, [latitude, longitude]);

  return useQuery<MasjidResponse[], Error>({
    // Use rounded coordinates for cache key to improve cache hits
    queryKey: ['checkin-masjids', roundedCoords?.lat, roundedCoords?.lng],
    // Use actual coordinates for the API call for accuracy
    queryFn: () => getCheckinEligibleMasjids(latitude!, longitude!),
    enabled: enabled && latitude !== null && longitude !== null,
    staleTime: 60 * 1000, // Consider data fresh for 60 seconds (increased from 30s)
    refetchOnWindowFocus: true,
  });
}
