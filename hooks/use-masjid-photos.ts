/**
 * Masjid Photos Hook
 * Fetches photos for a masjid
 */

import { useQuery } from '@tanstack/react-query';
import { getMasjidPhotosAll, MasjidPhoto } from '@/lib/api';

interface UseMasjidPhotosOptions {
  masjidId: string | undefined;
  limit?: number;
  category?: string;
  enabled?: boolean;
}

export function useMasjidPhotos({
  masjidId,
  limit = 100,
  category,
  enabled = true,
}: UseMasjidPhotosOptions) {
  return useQuery<MasjidPhoto[], Error>({
    queryKey: ['masjid-photos', masjidId, limit, category],
    queryFn: () => getMasjidPhotosAll(masjidId!, { limit, category }),
    enabled: enabled && !!masjidId,
    staleTime: 2 * 60 * 1000,
  });
}
