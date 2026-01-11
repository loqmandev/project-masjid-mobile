import { Platform } from 'react-native';

const ACTIVE_VISIT_KEY = 'active-visit';
let nativeStorage: any | null = null;

type StoredActiveVisit = {
  masjidId: string;
  masjidName: string;
  location: string;
  checkInTime: string;
  minimumDuration: number;
};

function getNativeStorage() {
  if (Platform.OS === 'web') return null;
  if (nativeStorage) return nativeStorage;
  // Lazy require to avoid web bundling issues.
  const { MMKV } = require('react-native-mmkv');
  nativeStorage = new MMKV();
  return nativeStorage;
}

export function loadActiveVisit(): StoredActiveVisit | null {
  if (Platform.OS === 'web') {
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
  if (Platform.OS === 'web') {
    globalThis?.localStorage?.setItem(ACTIVE_VISIT_KEY, JSON.stringify(visit));
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.set(ACTIVE_VISIT_KEY, JSON.stringify(visit));
}

export function clearActiveVisit() {
  if (Platform.OS === 'web') {
    globalThis?.localStorage?.removeItem(ACTIVE_VISIT_KEY);
    return;
  }

  const storage = getNativeStorage();
  if (!storage) return;
  storage.delete(ACTIVE_VISIT_KEY);
}
