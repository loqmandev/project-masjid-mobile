/**
 * Masjid Search Hook
 * Searches masjids by name with debouncing
 * Global search (not limited by location)
 */

import { useQuery } from '@tanstack/react-query';
import { searchMasjidsByName, MasjidSearchResult } from '@/lib/api';
import { useDebounce } from './use-debounce';

interface UseMasjidSearchOptions {
  query: string;
  enabled?: boolean;
  limit?: number;
}

export function useMasjidSearch({
  query,
  enabled = true,
  limit = 20,
}: UseMasjidSearchOptions) {
  const debouncedQuery = useDebounce(query.trim(), 400);
  const isQueryValid = debouncedQuery.length >= 2;

  return useQuery<MasjidSearchResult[], Error>({
    queryKey: ['masjid-search', debouncedQuery, limit],
    queryFn: () => searchMasjidsByName(debouncedQuery, limit),
    enabled: enabled && isQueryValid,
    staleTime: 60 * 1000, // Cache for 1 minute
    refetchOnWindowFocus: false,
    // Clear results when query drops below 2 characters to avoid stale results
    placeholderData: isQueryValid ? undefined : [],
  });
}
