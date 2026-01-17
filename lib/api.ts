/**
 * API Client
 * Centralized API functions for fetching data from the backend
 */

import { API_BASE_URL } from '@/constants/api';
import { authClient } from '@/lib/auth-client';

/**
 * Creates fetch options with authentication headers
 */
function createAuthenticatedFetchOptions(
  options: RequestInit = {}
): RequestInit {
  const cookie = authClient.getCookie();

  return {
    ...options,
    headers: {
      ...options.headers,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    // 'include' can interfere with cookies set manually in headers
    credentials: 'omit' as RequestCredentials,
  };
}

/**
 * Authenticated fetch wrapper for protected endpoints
 */
function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const authOptions = createAuthenticatedFetchOptions(options);
  return fetch(url, authOptions);
}

/**
 * Masjid data from nearby/checkin API
 */
export interface MasjidResponse {
  masjidId: string;
  name: string;
  lat: number;
  lng: number;
  stateName: string;
  districtName: string;
  checkinRadiusM: number;
  distance: number;
  distanceM: number;
  canCheckin: boolean;
}

/**
 * Masjid facilities
 */
export interface MasjidFacilities {
  parking: boolean;
  wudhuArea: boolean;
  airConditioning: boolean;
  conferenceRoom: boolean;
  funeralServices: boolean;
  library: boolean;
  wheelchairAccess: boolean;
  womenSection: boolean;
}

/**
 * Full masjid details from /masjids/:id
 */
export interface MasjidDetails {
  masjidId: string;
  name: string;
  nameLower: string;
  lat: number;
  lng: number;
  address: string;
  stateCode: string;
  stateName: string;
  districtCode: string;
  districtName: string;
  jakimCode: string;
  checkinRadiusM: number;
  facilities: MasjidFacilities;
  verified: boolean;
  active: boolean;
  geohash: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch masjids available for check-in (within ~100m proximity)
 */
export async function getCheckinEligibleMasjids(
  lat: number,
  lng: number
): Promise<MasjidResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/masjids/checkin?lat=${lat}&lng=${lng}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch check-in eligible masjids: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch nearby masjids within specified radius (default 5km, max 5km)
 */
export async function getNearbyMasjids(
  lat: number,
  lng: number,
  radius: number = 5
): Promise<MasjidResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/masjids/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch nearby masjids: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch masjid details by ID
 */
export async function getMasjidById(masjidId: string): Promise<MasjidDetails> {
  const response = await fetch(`${API_BASE_URL}/masjids/${masjidId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch masjid details: ${response.status}`);
  }

  return response.json();
}

/**
 * Check-in response from API
 */
export interface CheckinResponse {
  success: boolean;
  message: string;
  masjid?: {
    masjidId: string;
    name: string;
    address: string;
    districtName: string;
    stateName: string;
    lat: number;
    lng: number;
  };
  distanceM?: number;
}

/**
 * Check in to a masjid
 * REQUIRES AUTHENTICATION - uses authenticated fetch
 */
export async function checkinToMasjid(
  masjidId: string,
  lat: number,
  lng: number
): Promise<CheckinResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/masjids/${masjidId}/checkin`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lng }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    // Handle 401 specifically for auth errors
    if (response.status === 401) {
      return {
        success: false,
        message: 'Please sign in to check in',
      };
    }
    return {
      success: false,
      message: data.message || `Check-in failed: ${response.status}`,
    };
  }

  return data;
}

/**
 * Check-out response from API
 */
export interface CheckoutResponse {
  success: boolean;
  message: string;
  pointsEarned?: number;
  checkIn?: ActiveCheckin;
}

/**
 * Check out from a masjid
 * REQUIRES AUTHENTICATION
 */
export async function checkoutFromMasjid(
  masjidId: string,
  lat: number,
  lng: number
): Promise<CheckoutResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/masjids/${masjidId}/checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lng }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      return {
        success: false,
        message: 'Please sign in to check out',
      };
    }
    return {
      success: false,
      message: data.message || `Check-out failed: ${response.status}`,
    };
  }

  return data;
}

/**
 * Active check-in from API
 */
export interface ActiveCheckin {
  id: string;
  userProfileId: string;
  masjidId: string;
  masjidName: string;
  checkInAt: string;
  checkInLat: number;
  checkInLng: number;
  checkOutAt: string | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
  status: 'checked_in' | 'completed' | 'incomplete';
  basePoints: number;
  bonusPoints: number;
  actualPointsEarned: number;
  checkoutInProximity: boolean | null;
  durationMinutes: number | null;
  isPrayerTime: boolean;
  prayerName: string | null;
  isFirstVisitToMasjid: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response from active check-in endpoint
 */
interface ActiveCheckinResponse {
  active: boolean;
  checkIn: ActiveCheckin | null;
}

/**
 * Get user's active check-in (if any)
 * REQUIRES AUTHENTICATION
 */
export async function getActiveCheckin(): Promise<ActiveCheckin | null> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/user/checkins/active`
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please sign in to view active check-in');
    }
    throw new Error(`Failed to fetch active check-in: ${response.status}`);
  }

  const data: ActiveCheckinResponse = await response.json();

  if (!data.active || !data.checkIn) {
    return null;
  }

  return data.checkIn;
}

/**
 * User profile data from backend
 */
export interface UserProfileData {
  id: string;
  userId: string;
  totalPoints: number;
  monthlyPoints: number;
  uniqueMasjidsVisited: number;
  totalCheckIns: number;
  globalRank: number | null;
  monthlyRank: number | null;
  achievementCount: number;
  showFullNameInLeaderboard: boolean;
  leaderboardAlias: string | null;
  currentStreak: number;
  longestStreak: number;
  lastVisitDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * User info from backend
 */
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

/**
 * User gamification profile response (nested structure from backend)
 */
export interface UserProfileResponse {
  profile: UserProfileData;
  user: UserInfo;
}

/**
 * Achievement definition from backend
 */
export interface AchievementDefinition {
  id: string;
  name: string;
  code: string;
  nameEn: string | null;
  description: string;
  descriptionEn: string | null;
  type: 'explorer' | 'prayer_warrior' | 'streak' | 'geographic' | 'special';
  badgeTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requiredCount: number | null;
  bonusPoints: number;
  sortOrder: number;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User's achievement progress from backend
 */
export interface UserAchievement {
  id: string;
  createdAt: string;
  updatedAt: string;
  userProfileId: string;
  achievementDefinitionId: string;
  currentProgress: number;
  requiredProgress: number;
  progressPercentage: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progressMetadata: string | null;
}

/**
 * Combined achievement with progress (API response structure)
 */
export interface UserAchievementProgress {
  achievement: AchievementDefinition;
  progress: UserAchievement | null;
}

/**
 * Fetch current user's gamification profile
 * REQUIRES AUTHENTICATION
 */
export async function getUserProfile(): Promise<UserProfileResponse> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/user/profile`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please sign in to view your profile');
    }
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch user's achievement progress
 * REQUIRES AUTHENTICATION
 */
export async function getUserAchievements(): Promise<UserAchievementProgress[]> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/user/achievements`);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please sign in to view achievements');
    }
    throw new Error(`Failed to fetch achievements: ${response.status}`);
  }

  return response.json();
}

/**
 * User check-in history item
 */
export interface UserCheckin {
  id: string;
  masjidName: string;
  checkInAt: string;
  checkOutAt: string | null;
  actualPointsEarned: number;
  isFirstVisitToMasjid: boolean;
  status: 'checked_in' | 'completed' | 'incomplete';
}

/**
 * Fetch user's check-in history
 * REQUIRES AUTHENTICATION
 */
export async function getUserCheckins(limit: number = 10): Promise<UserCheckin[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/user/checkins?limit=${limit}`
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please sign in to view check-in history');
    }
    throw new Error(`Failed to fetch check-in history: ${response.status}`);
  }

  return response.json();
}

/**
 * Leaderboard entry from API
 */
export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  points: number;
  masjidsVisited: number;
  isCurrentUser?: boolean;
}

/**
 * Global leaderboard response with pagination
 */
export interface GlobalLeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
}

/**
 * Fetch monthly leaderboard
 * Public endpoint - optionally includes current user context if authenticated
 */
export async function getMonthlyLeaderboard(
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  // Use authenticated fetch to get current user context if logged in
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/leaderboard/monthly?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch monthly leaderboard: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch global (all-time) leaderboard with pagination
 * Public endpoint - optionally includes current user context if authenticated
 */
export async function getGlobalLeaderboard(
  limit: number = 20,
  offset: number = 0
): Promise<GlobalLeaderboardResponse> {
  // Use authenticated fetch to get current user context if logged in
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/leaderboard/global?limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch global leaderboard: ${response.status}`);
  }

  return response.json();
}
