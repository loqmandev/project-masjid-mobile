/**
 * User Profile Hook
 * Fetches the authenticated user's gamification profile with MMKV caching
 */

import {
  getUserProfile,
  UserAchievementProgress,
  UserCheckin,
  UserProfileResponse,
} from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { clearCachedUserProfile, loadCachedUserProfile } from '@/lib/storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// Must match the interface used in profile.tsx for cache consistency
interface CachedProfileData {
  profile: UserProfileResponse;
  achievements: UserAchievementProgress[];
  checkins: UserCheckin[];
}

export function useUserProfile() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  // Load cached data on mount (for same user)
  useEffect(() => {
    if (!userId) return;

    const cached = loadCachedUserProfile<CachedProfileData>();
    // Only use cache if it belongs to current user
    if (cached && cached.userId === userId && cached.data?.profile) {
      // Pre-populate React Query cache with stored profile data
      queryClient.setQueryData(['user-profile'], cached.data.profile);
    } else if (cached && cached.userId !== userId) {
      // Different user, clear stale cache
      clearCachedUserProfile();
    }
  }, [userId, queryClient]);

  const query = useQuery<UserProfileResponse, Error>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const data = await getUserProfile();
      // Note: Cache saving is handled by profile.tsx which fetches all data together
      return data;
    },
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on every focus, only when invalidated
  });

  return query;
}
