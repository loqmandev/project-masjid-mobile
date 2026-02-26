/**
 * Event Details Hook
 * Fetches a single event by ID with React Query caching
 */

import { useQuery } from "@tanstack/react-query";
import { getEventById, MasjidEvent } from "@/lib/api";

interface UseEventDetailsOptions {
  enabled?: boolean;
}

export function useEventDetails(
  { eventId }: { eventId: string | null },
  options: UseEventDetailsOptions = {}
) {
  return useQuery<MasjidEvent, Error>({
    queryKey: ["event", eventId],
    queryFn: () => getEventById(eventId!),
    enabled: (options.enabled ?? true) && eventId !== null,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}
