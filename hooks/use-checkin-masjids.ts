/**
 * Check-in Masjids Hook
 * Fetches masjids available for check-in within proximity
 */

import { useQuery } from '@tanstack/react-query';
import { getCheckinEligibleMasjids, MasjidResponse } from '@/lib/api';

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
  return useQuery<MasjidResponse[], Error>({
    queryKey: ['checkin-masjids', latitude, longitude],
    queryFn: () => getCheckinEligibleMasjids(latitude!, longitude!),
    enabled: enabled && latitude !== null && longitude !== null,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });
}
