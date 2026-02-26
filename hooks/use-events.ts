/**
 * Events Hook
 * Fetches upcoming events with optional location for distance calculation
 */

import { useQuery } from "@tanstack/react-query";
import { getUpcomingEvents, MasjidEvent } from "@/lib/api";
import { useLocation } from "./use-location";

interface UseEventsOptions {
  enabled?: boolean;
}

export function useEvents({ enabled = true }: UseEventsOptions = {}) {
  const { location } = useLocation();

  return useQuery<MasjidEvent[], Error>({
    queryKey: ["upcoming-events", location?.latitude, location?.longitude],
    queryFn: () => getUpcomingEvents(location?.latitude, location?.longitude),
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}
