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
