import { Platform } from "react-native";

const ACTIVE_VISIT_KEY = "active-visit";
const LOCATION_CACHE_KEY = "cached-location";
const USER_PROFILE_CACHE_KEY = "user-profile-cache";
const THEME_PREFERENCE_KEY = "theme-preference";
const ONBOARDING_COMPLETED_KEY = "onboarding-completed";
const DEMO_MODE_KEY = "demo-mode";

let nativeStorage: any | null = null;

// Location cache configuration
const LOCATION_CACHE_MAX_AGE_MS = 2 * 60 * 1000; // 2 minutes
const LOCATION_CACHE_MAX_DISTANCE_M = 50; // 50 meters

export type CachedLocation = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

type StoredActiveVisit = {
  masjidId: string;
  masjidName: string;
  location: string;
  checkInTime: string;
  minimumDuration: number;
};

function getNativeStorage() {
  if (Platform.OS === "web") return null;
  if (nativeStorage) return nativeStorage;
  // Lazy require to avoid web bundling issues.
  const { MMKV } = require("react-native-mmkv");
  nativeStorage = new MMKV();
  return nativeStorage;
}

export function loadActiveVisit(): StoredActiveVisit | null {
  if (Platform.OS === "web") {
    const raw = globalThis?.localStorage?.getItem(ACTIVE_VISIT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredActiveVisit;
    } catch {
      return null;
    }
  }

  const storage = getNativeStorage();
  if (!storage) return null;
  const raw = storage.getString(ACTIVE_VISIT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredActiveVisit;
  } catch {
    return null;
  }
}

export function saveActiveVisit(visit: StoredActiveVisit) {
  if (Platform.OS === "web") {
    globalThis?.localStorage?.setItem(ACTIVE_VISIT_KEY, JSON.stringify(visit));
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.set(ACTIVE_VISIT_KEY, JSON.stringify(visit));
}

export function clearActiveVisit() {
  if (Platform.OS === "web") {
    globalThis?.localStorage?.removeItem(ACTIVE_VISIT_KEY);
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.delete(ACTIVE_VISIT_KEY);
}

// ============ Location Caching ============

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Load cached location from storage
 */
export function loadCachedLocation(): CachedLocation | null {
  if (Platform.OS === "web") {
    const raw = globalThis?.localStorage?.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CachedLocation;
    } catch {
      return null;
    }
  }

  const storage = getNativeStorage();
  if (!storage) return null;
  const raw = storage.getString(LOCATION_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedLocation;
  } catch {
    return null;
  }
}

/**
 * Save location to cache with current timestamp
 */
export function saveCachedLocation(latitude: number, longitude: number): void {
  const cached: CachedLocation = {
    latitude,
    longitude,
    timestamp: Date.now(),
  };

  if (Platform.OS === "web") {
    globalThis?.localStorage?.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify(cached),
    );
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.set(LOCATION_CACHE_KEY, JSON.stringify(cached));
}

/**
 * Check if cached location is still valid
 * Valid if: within max age AND within max distance from new location (if provided)
 */
export function isCachedLocationValid(
  cached: CachedLocation,
  newLocation?: { latitude: number; longitude: number },
): boolean {
  const age = Date.now() - cached.timestamp;

  // Check if cache is too old
  if (age > LOCATION_CACHE_MAX_AGE_MS) {
    return false;
  }

  // If new location provided, check distance
  if (newLocation) {
    const distance = getDistanceInMeters(
      cached.latitude,
      cached.longitude,
      newLocation.latitude,
      newLocation.longitude,
    );
    return distance <= LOCATION_CACHE_MAX_DISTANCE_M;
  }

  return true;
}

/**
 * Round coordinates to a grid for cache key stability
 * Uses ~50m precision (roughly 0.0005 degrees at equator)
 */
export function roundCoordinatesForCacheKey(
  latitude: number,
  longitude: number,
): { lat: number; lng: number } {
  const precision = 0.0005; // ~50m at equator
  return {
    lat: Math.round(latitude / precision) * precision,
    lng: Math.round(longitude / precision) * precision,
  };
}

// ============ User Profile Caching ============

export type CachedUserProfile<T> = {
  data: T;
  userId: string;
  timestamp: number;
};

/**
 * Load cached user profile from storage
 */
export function loadCachedUserProfile<T>(): CachedUserProfile<T> | null {
  if (Platform.OS === "web") {
    const raw = globalThis?.localStorage?.getItem(USER_PROFILE_CACHE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CachedUserProfile<T>;
    } catch {
      return null;
    }
  }

  const storage = getNativeStorage();
  if (!storage) return null;
  const raw = storage.getString(USER_PROFILE_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedUserProfile<T>;
  } catch {
    return null;
  }
}

/**
 * Save user profile to cache
 */
export function saveCachedUserProfile<T>(data: T, userId: string): void {
  const cached: CachedUserProfile<T> = {
    data,
    userId,
    timestamp: Date.now(),
  };

  if (Platform.OS === "web") {
    globalThis?.localStorage?.setItem(
      USER_PROFILE_CACHE_KEY,
      JSON.stringify(cached),
    );
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.set(USER_PROFILE_CACHE_KEY, JSON.stringify(cached));
}

/**
 * Clear cached user profile (call on logout or user change)
 */
export function clearCachedUserProfile(): void {
  if (Platform.OS === "web") {
    globalThis?.localStorage?.removeItem(USER_PROFILE_CACHE_KEY);
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.delete(USER_PROFILE_CACHE_KEY);
}

/**
 * Clear cached location
 */
export function clearCachedLocation(): void {
  if (Platform.OS === "web") {
    globalThis?.localStorage?.removeItem(LOCATION_CACHE_KEY);
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.delete(LOCATION_CACHE_KEY);
}

/**
 * Clear all app cache (preserves active visit data and theme preference)
 * Clears: location cache, user profile cache
 */
export function clearAppCache(): void {
  clearCachedLocation();
  clearCachedUserProfile();
}

// ============ Theme Preference ============

export type ThemePreference = "light" | "dark" | "system";

/**
 * Load theme preference from storage
 */
export function loadThemePreference(): ThemePreference {
  if (Platform.OS === "web") {
    const raw = globalThis?.localStorage?.getItem(THEME_PREFERENCE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") {
      return raw;
    }
    return "system";
  }

  const storage = getNativeStorage();
  if (!storage) return "system";
  const raw = storage.getString(THEME_PREFERENCE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }
  return "system";
}

/**
 * Save theme preference to storage
 */
export function saveThemePreference(preference: ThemePreference): void {
  if (Platform.OS === "web") {
    globalThis?.localStorage?.setItem(THEME_PREFERENCE_KEY, preference);
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.set(THEME_PREFERENCE_KEY, preference);
}

// ============ Onboarding ============

export function loadOnboardingCompleted(): boolean {
  if (Platform.OS === "web") {
    return (
      globalThis?.localStorage?.getItem(ONBOARDING_COMPLETED_KEY) === "true"
    );
  }

  const storage = getNativeStorage();
  if (!storage) return false;
  return storage.getString(ONBOARDING_COMPLETED_KEY) === "true";
}

export function saveOnboardingCompleted(): void {
  if (Platform.OS === "web") {
    globalThis?.localStorage?.setItem(ONBOARDING_COMPLETED_KEY, "true");
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.set(ONBOARDING_COMPLETED_KEY, "true");
}

export function clearOnboardingCompleted(): void {
  const storage = getNativeStorage();
  if (!storage) return;
  storage.delete(ONBOARDING_COMPLETED_KEY);
}

// ============ Demo Mode ============

/**
 * Check if the current session is in demo mode
 * Demo mode is set when the backend returns X-Demo-Mode: true header
 */
export function loadDemoMode(): boolean {
  if (Platform.OS === "web") {
    return globalThis?.localStorage?.getItem(DEMO_MODE_KEY) === "true";
  }

  const storage = getNativeStorage();
  if (!storage) return false;
  return storage.getString(DEMO_MODE_KEY) === "true";
}

/**
 * Save demo mode state to storage
 */
export function saveDemoMode(isDemo: boolean): void {
  if (Platform.OS === "web") {
    if (isDemo) {
      globalThis?.localStorage?.setItem(DEMO_MODE_KEY, "true");
    } else {
      globalThis?.localStorage?.removeItem(DEMO_MODE_KEY);
    }
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  if (isDemo) {
    storage.set(DEMO_MODE_KEY, "true");
  } else {
    storage.delete(DEMO_MODE_KEY);
  }
}

/**
 * Clear demo mode state (call on logout)
 */
export function clearDemoMode(): void {
  if (Platform.OS === "web") {
    globalThis?.localStorage?.removeItem(DEMO_MODE_KEY);
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.delete(DEMO_MODE_KEY);
}

/**
 * Clear ALL app data (call on account deletion or full logout)
 * Clears: active visit, location cache, user profile cache, onboarding, theme preference, demo mode
 */
export function clearAllAppData(): void {
  const storage = getNativeStorage();
  if (!storage) return;
  storage.delete(ACTIVE_VISIT_KEY);
  storage.delete(LOCATION_CACHE_KEY);
  storage.delete(USER_PROFILE_CACHE_KEY);
  storage.delete(THEME_PREFERENCE_KEY);
  storage.delete(ONBOARDING_COMPLETED_KEY);
  storage.delete(DEMO_MODE_KEY);
}
