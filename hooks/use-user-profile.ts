/**
 * User Profile Hook
 * Fetches the authenticated user's gamification profile with MMKV caching
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, UserProfileResponse } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import {
  loadCachedUserProfile,
  saveCachedUserProfile,
  clearCachedUserProfile,
} from '@/lib/storage';

export function useUserProfile() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  // Load cached data on mount (for same user)
  useEffect(() => {
    if (!userId) return;

    const cached = loadCachedUserProfile<UserProfileResponse>();
    // Only use cache if it belongs to current user
    if (cached && cached.userId === userId) {
      // Pre-populate React Query cache with stored data
      queryClient.setQueryData(['user-profile'], cached.data);
    } else if (cached && cached.userId !== userId) {
      // Different user, clear stale cache
      clearCachedUserProfile();
    }
  }, [userId, queryClient]);

  const query = useQuery<UserProfileResponse, Error>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const data = await getUserProfile();
      // Save to MMKV cache on successful fetch
      if (userId) {
        saveCachedUserProfile(data, userId);
      }
      return data;
    },
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (increased since we have persistent cache)
    refetchOnWindowFocus: false, // Don't refetch on every focus, only when invalidated
  });

  return query;
}
