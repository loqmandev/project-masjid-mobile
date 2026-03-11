/**
 * User Event Participations Hook
 * Fetches the authenticated user's event progress and participations
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserEventParticipations } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import type { UserEventParticipation, UserMissionProgress } from "@/types/limited-event";

/**
 * Hook to fetch user's event participations
 */
export function useUserEventParticipations() {
  const { data: session } = useSession();

  return useQuery<UserEventParticipation[], Error>({
    queryKey: ["user-event-participations"],
    queryFn: getUserEventParticipations,
    enabled: !!session?.user,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get user's participation for a specific event
 */
export function useUserEventParticipation(eventId: string) {
  const { data: participations, ...rest } = useUserEventParticipations();

  const participation = participations?.find((p) => p.eventId === eventId);

  return {
    participation,
    ...rest,
  };
}

/**
 * Calculate overall event progress percentage
 */
export function getEventProgressPercentage(participation: UserEventParticipation | null | undefined): number {
  if (!participation || participation.missionProgress.length === 0) return 0;

  const completed = participation.missionProgress.filter((m) => m.isCompleted).length;
  return Math.round((completed / participation.missionProgress.length) * 100);
}

/**
 * Get completed missions count
 */
export function getCompletedMissionsCount(participation: UserEventParticipation | null | undefined): {
  completed: number;
  total: number;
} {
  if (!participation) {
    return { completed: 0, total: 0 };
  }

  return {
    completed: participation.missionProgress.filter((m) => m.isCompleted).length,
    total: participation.missionProgress.length,
  };
}

/**
 * Hook to invalidate event participations cache
 * Useful after check-out when progress might have updated
 */
export function useInvalidateEventParticipations() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["user-event-participations"] });
  };
}

/**
 * Check if a mission is close to completion (within 1 of target)
 */
export function isMissionAlmostComplete(mission: UserMissionProgress): boolean {
  if (mission.isCompleted) return false;
  return mission.currentProgress >= mission.targetCount - 1;
}
