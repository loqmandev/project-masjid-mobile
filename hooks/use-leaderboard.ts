/**
 * Leaderboard Hook
 * Fetches monthly and global leaderboard data
 */

import {
  getGlobalLeaderboard,
  getMonthlyLeaderboard,
  GlobalLeaderboardResponse,
  LeaderboardEntry,
} from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const LEADERBOARD_LIMIT = 10;

export function useMonthlyLeaderboard() {
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ['leaderboard', 'monthly'],
    queryFn: () => getMonthlyLeaderboard(LEADERBOARD_LIMIT),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });
}

export function useGlobalLeaderboard() {
  return useQuery<GlobalLeaderboardResponse, Error>({
    queryKey: ['leaderboard', 'global'],
    queryFn: () => getGlobalLeaderboard(LEADERBOARD_LIMIT, 0),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });
}

/**
 * Combined hook for leaderboard with tab support
 */
export function useLeaderboard(activeTab: 'monthly' | 'alltime') {
  const monthlyQuery = useMonthlyLeaderboard();
  const globalQuery = useGlobalLeaderboard();

  const isMonthly = activeTab === 'monthly';
  const activeQuery = isMonthly ? monthlyQuery : globalQuery;

  // Normalize data structure (global has entries array, monthly is direct array)
  const leaderboardData = isMonthly
    ? monthlyQuery.data
    : globalQuery.data?.entries;

  // Find current user from the leaderboard
  const currentUser = leaderboardData?.find((entry) => entry.isCurrentUser);

  return {
    data: leaderboardData,
    currentUser,
    isLoading: activeQuery.isLoading,
    isError: activeQuery.isError,
    error: activeQuery.error,
    refetch: activeQuery.refetch,
    isRefetching: activeQuery.isRefetching,
  };
}
