/**
 * Location Hook
 * Manages user's current location with permission handling and MMKV caching
 * Optimized for battery life with configurable accuracy and timeouts
 */

import {
  isCachedLocationValid,
  loadCachedLocation,
  saveCachedLocation,
} from "@/lib/storage";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface UseLocationOptions {
  /** Accuracy level for location requests (default: 'balanced') */
  accuracy?: "high";
  /** Whether to use cached location first (default: true) */
  useCache?: boolean;
}

export interface LocationState {
  location: LocationCoords | null;
  error: string | null;
  isLoading: boolean;
  isFromCache: boolean;
  refresh: (forceRefresh?: boolean) => Promise<void>;
}

// Error messages with clear user guidance
export const LocationErrors = {
  PERMISSION_DENIED:
    "Location permission denied. Please enable it in your device settings.",
  TIMEOUT: "Could not get your location. Please try again.",
  UNKNOWN: "An error occurred while getting your location.",
} as const;

// Accuracy mapping to expo constants
const ACCURACY_MAP = {
  high: Location.Accuracy.High,
} as const;

const DEFAULT_OPTIONS: Required<Omit<UseLocationOptions, "useCache">> = {
  accuracy: "high",
};

export function useLocation(options: UseLocationOptions = {}): LocationState {
  // Use refs to store options to avoid recreating getLocation on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const getLocation = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    // Get current options from ref
    const currentOpts = {
      ...DEFAULT_OPTIONS,
      useCache: true,
      ...optionsRef.current,
    };
    const accuracyLevel = ACCURACY_MAP[currentOpts.accuracy];

    // Check cached location first (unless force refresh or disabled)
    if (currentOpts.useCache && !forceRefresh) {
      const cached = loadCachedLocation();
      if (cached && isCachedLocationValid(cached)) {
        setLocation({
          latitude: cached.latitude,
          longitude: cached.longitude,
        });
        setIsFromCache(true);
        if (isMountedRef.current) setIsLoading(false);
        return;
      }
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        if (isMountedRef.current) setError(LocationErrors.PERMISSION_DENIED);
        if (isMountedRef.current) setIsLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: accuracyLevel,
      });

      // Note: expo-location doesn't support timeout option directly.
      // The promise will eventually reject on timeout, but timing depends on the OS.

      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      // Save to cache
      saveCachedLocation(newLocation.latitude, newLocation.longitude);

      if (isMountedRef.current) {
        setLocation(newLocation);
        setIsFromCache(false);
        setError(null);
      }
    } catch (err: any) {
      // Determine error type from expo location error codes
      const errorMessage =
        err?.code === "E_NO_PERMISSION"
          ? LocationErrors.PERMISSION_DENIED
          : err?.code === "E_TIMEOUT" || err?.code === "E_POSITION_UNAVAILABLE"
            ? LocationErrors.TIMEOUT
            : LocationErrors.UNKNOWN;

      // On error, try to use cached location as fallback (unless force refresh)
      if (!forceRefresh && currentOpts.useCache) {
        const cached = loadCachedLocation();
        if (cached) {
          setLocation({
            latitude: cached.latitude,
            longitude: cached.longitude,
          });
          setIsFromCache(true);
          setError(null); // Clear error since we have cached data
          if (isMountedRef.current) setIsLoading(false);
          return;
        }
      }

      if (isMountedRef.current) setError(errorMessage);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []); // No dependencies - uses ref for options

  useEffect(() => {
    isMountedRef.current = true;
    getLocation();

    return () => {
      isMountedRef.current = false;
    };
  }, [getLocation]);

  return {
    location,
    error,
    isLoading,
    isFromCache,
    refresh: getLocation,
  };
}
