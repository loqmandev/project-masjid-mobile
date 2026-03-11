/**
 * Limited Event and Badge Types
 * Types for time-limited events with missions that award exclusive badges
 */

/**
 * Mission types for limited events
 */
export type MissionType =
  | 'unique_masjids'      // Visit N unique masjids during event
  | 'checkin_count'       // Complete N total check-ins
  | 'prayer_streak'       // Maintain N day streak
  | 'specific_masjids'    // Visit specific masjid IDs
  | 'district_coverage'   // Visit N different districts
  | 'prayer_times';       // Check in during N different prayer times

/**
 * Event status
 */
export type EventStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

/**
 * Badge rarity levels
 */
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Prayer names for prayer_times mission type
 */
export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

/**
 * Event mission definition
 */
export interface EventMission {
  id: string;
  type: MissionType;
  targetCount: number;
  description: string;
  masjidIds?: string[];      // For specific_masjids type
  prayerNames?: PrayerName[]; // For prayer_times type
}

/**
 * Limited badge awarded for completing an event
 */
export interface LimitedBadge {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  iconUrl: string | null;
  rarity: BadgeRarity;
  earnedCount: number;       // How many users have earned this badge
}

/**
 * Limited time event
 */
export interface LimitedEvent {
  id: string;
  code: string;              // Unique event code (e.g., "ramadan-2025")
  name: string;
  description: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  status: EventStatus;
  startDateTime: string;     // ISO datetime
  endDateTime: string;       // ISO datetime
  missions: EventMission[];
  badge: LimitedBadge;
  bonusPoints: number;       // Bonus points for completing all missions
  createdAt: string;
  updatedAt: string;
}

/**
 * User's progress on a specific mission
 */
export interface UserMissionProgress {
  missionId: string;
  currentProgress: number;
  targetCount: number;
  isCompleted: boolean;
  masjidIdsVisited?: string[]; // For unique_masjids and specific_masjids types
  districtsVisited?: string[]; // For district_coverage type
  prayerNamesCompleted?: PrayerName[]; // For prayer_times type
}

/**
 * User's participation in an event
 */
export interface UserEventParticipation {
  id: string;
  eventId: string;
  event: LimitedEvent;
  missionProgress: UserMissionProgress[];
  isCompleted: boolean;
  badgeEarned: boolean;
  badgeEarnedAt: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * User's earned limited badge
 */
export interface UserLimitedBadge {
  id: string;
  badgeId: string;
  badge: LimitedBadge;
  eventId: string;
  event: LimitedEvent;
  earnedAt: string;
  isFeatured: boolean;
  featuredOrder: number | null;
}

/**
 * Event progress update returned in check-out response
 */
export interface EventProgressUpdate {
  eventId: string;
  eventName: string;
  missionId: string;
  missionDescription: string;
  previousProgress: number;
  newProgress: number;
  targetCount: number;
  missionCompleted: boolean;
  eventCompleted: boolean;
  badgeEarned: boolean;
}

/**
 * Featured badges update request
 */
export interface UpdateFeaturedBadgesRequest {
  badgeIds: string[];  // Max 5 badges
}

/**
 * Featured badges update response
 */
export interface UpdateFeaturedBadgesResponse {
  success: boolean;
  featuredBadges: UserLimitedBadge[];
}
