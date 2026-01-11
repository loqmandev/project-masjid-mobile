/**
 * Masjid Details Hook
 * Fetches full masjid details by ID
 */

import { useQuery } from '@tanstack/react-query';
import { getMasjidById, MasjidDetails } from '@/lib/api';

interface UseMasjidDetailsOptions {
  masjidId: string | undefined;
  enabled?: boolean;
}

export function useMasjidDetails({
  masjidId,
  enabled = true,
}: UseMasjidDetailsOptions) {
  return useQuery<MasjidDetails, Error>({
    queryKey: ['masjid-details', masjidId],
    queryFn: () => getMasjidById(masjidId!),
    enabled: enabled && !!masjidId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}
