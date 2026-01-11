/**
 * Nearby Masjids Hook
 * Fetches masjids within specified radius (default 5km)
 */

import { getNearbyMasjids, MasjidResponse } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

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
  return useQuery<MasjidResponse[], Error>({
    queryKey: ['nearby-masjids', latitude, longitude, radius],
    queryFn: () => getNearbyMasjids(latitude!, longitude!, radius),
    enabled: enabled && latitude !== null && longitude !== null,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: true,
  });
}
