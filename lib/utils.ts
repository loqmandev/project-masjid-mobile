/**
 * Utility functions for the Jejak Masjid app
 */

import { UserCheckin } from "@/lib/api";

const MAX_NAME_LENGTH = 20;

/**
 * Represents a recent masjid visit for display purposes
 */
export interface RecentMasjid {
  name: string;
  checkInAt?: string;
}

/**
 * Filters and deduplicates check-ins to get unique masjids visited in the last 30 days.
 *
 * @param checkins - Array of user check-ins
 * @param maxResults - Maximum number of unique masjids to return (default: 10)
 * @returns Object containing capped list of unique masjids and total count
 */
export function filterLast30DaysMasjids(
  checkins: UserCheckin[],
  maxResults: number = 10,
): { masjids: RecentMasjid[]; totalCount: number } {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Filter to last 30 days
  const recentCheckins = checkins.filter((checkin) => {
    const checkInDate = new Date(checkin.checkInAt);
    return checkInDate >= thirtyDaysAgo;
  });

  // Deduplicate by masjid name, keeping the most recent visit
  const uniqueMasjids = new Map<string, RecentMasjid>();
  for (const checkin of recentCheckins) {
    const existing = uniqueMasjids.get(checkin.masjidName);
    if (!existing) {
      uniqueMasjids.set(checkin.masjidName, {
        name: checkin.masjidName,
        checkInAt: checkin.checkInAt,
      });
    } else if (
      checkin.checkInAt &&
      existing.checkInAt &&
      new Date(checkin.checkInAt) > new Date(existing.checkInAt)
    ) {
      uniqueMasjids.set(checkin.masjidName, {
        name: checkin.masjidName,
        checkInAt: checkin.checkInAt,
      });
    }
  }

  // Sort by most recent visit and cap results
  const sortedMasjids = Array.from(uniqueMasjids.values())
    .sort((a, b) => {
      if (!a.checkInAt || !b.checkInAt) return 0;
      return new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime();
    })
    .slice(0, maxResults);

  return {
    masjids: sortedMasjids,
    totalCount: uniqueMasjids.size,
  };
}

/**
 * Gets the display name for a user, with fallback logic for empty names.
 *
 * Priority order:
 * 1. The provided user.name (from OAuth)
 * 2. A generated name from email prefix (e.g., "ahmad123" from "ahmad@gmail.com")
 * 3. A random guest name (e.g., "Guest1234")
 *
 * @param userName - The user's name from OAuth (can be null/undefined/empty)
 * @param email - The user's email address (for generating a fallback name)
 * @returns A display name between 2-20 characters
 */
export function getDisplayName(
  userName: string | null | undefined,
  email?: string | null
): string {
  if (userName?.trim()) {
    const trimmed = userName.trim();
    return trimmed.length > MAX_NAME_LENGTH
      ? trimmed.substring(0, MAX_NAME_LENGTH)
      : trimmed;
  }

  // Generate placeholder from email
  if (email) {
    const prefix = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
    if (prefix.length >= 2) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const combined = prefix + randomSuffix;
      return combined.length > MAX_NAME_LENGTH
        ? combined.substring(0, MAX_NAME_LENGTH)
        : combined;
    }
  }

  // Final fallback - generate a random guest name
  return 'Guest' + Math.floor(1000 + Math.random() * 9000);
}
