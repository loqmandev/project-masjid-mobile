/**
 * User Achievements Hook
 * Fetches the authenticated user's achievement progress
 */

import { useQuery } from '@tanstack/react-query';
import { getUserAchievements, UserAchievementProgress } from '@/lib/api';
import { useSession } from '@/lib/auth-client';

export function useUserAchievements() {
  const { data: session } = useSession();

  return useQuery<UserAchievementProgress[], Error>({
    queryKey: ['user-achievements'],
    queryFn: getUserAchievements,
    enabled: !!session?.user,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Get the next achievement to unlock (closest to completion)
 */
export function getNextAchievement(achievements: UserAchievementProgress[] | undefined) {
  if (!achievements || achievements.length === 0) return null;

  // Filter out already unlocked achievements and those without required count
  const lockedAchievements = achievements.filter(
    (a) => !a.progress?.isUnlocked && a.achievement.requiredCount !== null
  );

  if (lockedAchievements.length === 0) return null;

  // Sort by progress percentage (closest to completion first)
  const sorted = lockedAchievements.sort((a, b) => {
    const requiredA = a.achievement.requiredCount ?? 1;
    const requiredB = b.achievement.requiredCount ?? 1;
    const progressA = (a.progress?.currentProgress ?? 0) / requiredA;
    const progressB = (b.progress?.currentProgress ?? 0) / requiredB;
    return progressB - progressA;
  });

  return sorted[0];
}
