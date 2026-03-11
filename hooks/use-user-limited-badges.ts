/**
 * User Limited Badges Hook
 * Fetches and manages user's earned limited badges
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserLimitedBadges, updateFeaturedBadges } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import type { UserLimitedBadge, UpdateFeaturedBadgesRequest } from "@/types/limited-event";

/**
 * Hook to fetch user's earned limited badges
 */
export function useUserLimitedBadges() {
  const { data: session } = useSession();

  return useQuery<UserLimitedBadge[], Error>({
    queryKey: ["user-limited-badges"],
    queryFn: getUserLimitedBadges,
    enabled: !!session?.user,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get only featured badges (sorted by featuredOrder)
 */
export function useFeaturedBadges() {
  const { data: badges, ...rest } = useUserLimitedBadges();

  const featuredBadges = badges
    ?.filter((b) => b.isFeatured)
    .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999)) ?? [];

  return {
    featuredBadges,
    ...rest,
  };
}

/**
 * Hook to update featured badges
 */
export function useUpdateFeaturedBadges() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: (badgeIds: string[]) => {
      const data: UpdateFeaturedBadgesRequest = { badgeIds };
      return updateFeaturedBadges(data);
    },
    onSuccess: () => {
      // Invalidate and refetch badges
      queryClient.invalidateQueries({ queryKey: ["user-limited-badges"] });
    },
  });
}

/**
 * Hook to manage badge selection for featured display
 */
export function useBadgeSelector(maxBadges: number = 5) {
  const { data: badges } = useUserLimitedBadges();
  const updateMutation = useUpdateFeaturedBadges();
  const queryClient = useQueryClient();

  const featuredIds = badges
    ?.filter((b) => b.isFeatured)
    .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))
    .map((b) => b.badgeId) ?? [];

  const toggleBadge = async (badgeId: string) => {
    let newFeaturedIds: string[];

    if (featuredIds.includes(badgeId)) {
      // Remove from featured
      newFeaturedIds = featuredIds.filter((id) => id !== badgeId);
    } else {
      // Add to featured (if under max)
      if (featuredIds.length >= maxBadges) {
        throw new Error(`Maximum ${maxBadges} badges can be featured`);
      }
      newFeaturedIds = [...featuredIds, badgeId];
    }

    await updateMutation.mutateAsync(newFeaturedIds);
  };

  const setFeaturedBadges = async (badgeIds: string[]) => {
    if (badgeIds.length > maxBadges) {
      throw new Error(`Maximum ${maxBadges} badges can be featured`);
    }
    await updateMutation.mutateAsync(badgeIds);
  };

  const isFeatured = (badgeId: string) => featuredIds.includes(badgeId);
  const canAddMore = featuredIds.length < maxBadges;

  return {
    featuredIds,
    toggleBadge,
    setFeaturedBadges,
    isFeatured,
    canAddMore,
    maxBadges,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * Group badges by rarity
 */
export function groupBadgesByRarity(badges: UserLimitedBadge[]): Record<string, UserLimitedBadge[]> {
  return badges.reduce(
    (acc, badge) => {
      const rarity = badge.badge.rarity;
      if (!acc[rarity]) {
        acc[rarity] = [];
      }
      acc[rarity].push(badge);
      return acc;
    },
    {} as Record<string, UserLimitedBadge[]>,
  );
}

/**
 * Get rarity display order (legendary first)
 */
export function getRarityOrder(rarity: string): number {
  const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
  return order[rarity as keyof typeof order] ?? 99;
}

/**
 * Sort badges by rarity (rarest first), then by earned date (newest first)
 */
export function sortBadgesByRarity(badges: UserLimitedBadge[]): UserLimitedBadge[] {
  return [...badges].sort((a, b) => {
    const rarityDiff = getRarityOrder(a.badge.rarity) - getRarityOrder(b.badge.rarity);
    if (rarityDiff !== 0) return rarityDiff;
    return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
  });
}
