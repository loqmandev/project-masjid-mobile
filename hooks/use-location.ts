/**
 * Location Hook
 * Manages user's current location with permission handling and MMKV caching
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  loadCachedLocation,
  saveCachedLocation,
  isCachedLocationValid,
} from '@/lib/storage';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationState {
  location: LocationCoords | null;
  error: string | null;
  isLoading: boolean;
  isFromCache: boolean;
  refresh: (forceRefresh?: boolean) => Promise<void>;
}

export function useLocation(): LocationState {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  const getLocation = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    // Check cached location first (unless force refresh)
    if (!forceRefresh) {
      const cached = loadCachedLocation();
      if (cached && isCachedLocationValid(cached)) {
        setLocation({
          latitude: cached.latitude,
          longitude: cached.longitude,
        });
        setIsFromCache(true);
        setIsLoading(false);
        return;
      }
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Location permission denied');
        setIsLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      // Save to cache
      saveCachedLocation(newLocation.latitude, newLocation.longitude);

      setLocation(newLocation);
      setIsFromCache(false);
    } catch (err) {
      // On error, try to use cached location as fallback
      const cached = loadCachedLocation();
      if (cached) {
        setLocation({
          latitude: cached.latitude,
          longitude: cached.longitude,
        });
        setIsFromCache(true);
        // Don't set error if we have cached data
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {
    location,
    error,
    isLoading,
    isFromCache,
    refresh: getLocation,
  };
}
