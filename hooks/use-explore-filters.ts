import { useCallback, useEffect, useState } from 'react';

// Module-level state shared across all hook instances
let filterState: Set<string> = new Set();
const listeners = new Set<(state: Set<string>) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener(new Set(filterState)));
}

export function useExploreFilters() {
  const [state, setState] = useState<Set<string>>(filterState);

  // Subscribe to state changes
  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const setFilters = useCallback((newFilters: Set<string>) => {
    filterState = new Set(newFilters);
    notifyListeners();
  }, []);

  const clearFilters = useCallback(() => {
    filterState = new Set();
    notifyListeners();
  }, []);

  const toggleFacility = useCallback((facilityCode: string) => {
    const newFilters = new Set(filterState);
    if (newFilters.has(facilityCode)) {
      newFilters.delete(facilityCode);
    } else {
      newFilters.add(facilityCode);
    }
    filterState = newFilters;
    notifyListeners();
  }, []);

  const hasFacility = useCallback((facilityCode: string) => {
    return filterState.has(facilityCode);
  }, []);

  return {
    appliedFacilities: state,
    setFilters,
    clearFilters,
    toggleFacility,
    hasFacility,
  };
}
