/**
 * Limited Events Hook
 * Fetches active limited-time events
 */

import { useQuery } from "@tanstack/react-query";
import { getActiveLimitedEvents, getLimitedEventById } from "@/lib/api";
import type { LimitedEvent } from "@/types/limited-event";

interface UseLimitedEventsOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch all active limited events
 */
export function useLimitedEvents({ enabled = true }: UseLimitedEventsOptions = {}) {
  return useQuery<LimitedEvent[], Error>({
    queryKey: ["limited-events"],
    queryFn: getActiveLimitedEvents,
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

interface UseLimitedEventOptions {
  eventId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch a specific limited event by ID
 */
export function useLimitedEvent({ eventId, enabled = true }: UseLimitedEventOptions) {
  return useQuery<LimitedEvent, Error>({
    queryKey: ["limited-event", eventId],
    queryFn: () => getLimitedEventById(eventId),
    enabled: enabled && !!eventId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Get event status based on current time
 */
export function getEventStatus(event: LimitedEvent): "upcoming" | "active" | "ended" {
  const now = new Date();
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);

  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

/**
 * Calculate time remaining until event ends
 */
export function getTimeRemaining(endDateTime: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const total = Math.max(0, new Date(endDateTime).getTime() - Date.now());

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Format time remaining as a display string
 */
export function formatTimeRemaining(endDateTime: string): string {
  const { days, hours, minutes } = getTimeRemaining(endDateTime);

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}
