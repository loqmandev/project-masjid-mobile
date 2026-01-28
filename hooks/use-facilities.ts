/**
 * Facilities Hooks
 * Fetches facility lookup list and confirmed facilities for a masjid
 */

import { useQuery } from '@tanstack/react-query';
import {
  FacilityOption,
  getFacilities,
  getMasjidFacilities,
} from '@/lib/api';

interface UseMasjidFacilitiesOptions {
  masjidId: string | undefined;
  enabled?: boolean;
}

export function useFacilities(enabled: boolean = true) {
  return useQuery<FacilityOption[], Error>({
    queryKey: ['facilities'],
    queryFn: getFacilities,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useMasjidFacilities({
  masjidId,
  enabled = true,
}: UseMasjidFacilitiesOptions) {
  return useQuery<FacilityOption[], Error>({
    queryKey: ['masjid-facilities', masjidId],
    queryFn: () => getMasjidFacilities(masjidId!),
    enabled: enabled && !!masjidId,
    staleTime: 5 * 60 * 1000,
  });
}
