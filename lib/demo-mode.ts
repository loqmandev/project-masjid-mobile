/**
 * Demo Mode Utilities
 *
 * Provides demo account functionality for App Store reviewers to test the app
 * without requiring location access or email verification.
 *
 * DEMO CREDENTIALS:
 * - Email: demo@jejakmasjid.my
 * - OTP: 123456 (fixed code)
 */

import type { MasjidResponse } from "./api";

// Demo account credentials
export const DEMO_EMAIL = "demo@jejakmasjid.my";
export const DEMO_OTP = "123456";

/**
 * Check if an email is the demo account email
 */
export function isDemoEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === DEMO_EMAIL.toLowerCase();
}

/**
 * Check if an OTP matches the demo OTP
 */
export function isDemoOtp(otp: string): boolean {
  return otp === DEMO_OTP;
}

/**
 * Demo masjids for App Store reviewers
 * These are real Malaysian masjids with approximate coordinates
 */
export const DEMO_MASJIDS: MasjidResponse[] = [
  {
    masjidId: "1400001",
    name: "Masjid Negara (National Mosque)",
    lat: 3.1416608,
    lng: 101.6911157,
    stateName: "Kuala Lumpur",
    districtName: "Kuala Lumpur",
    checkinRadiusM: 100,
    distance: 50, // Within check-in range for demo
    distanceM: 50,
    canCheckin: true, // Demo mode allows check-in
  },
  {
    masjidId: "1601012",
    name: "Masjid Putra",
    lat: 2.9356402,
    lng: 101.7092,
    stateName: "Putrajaya",
    districtName: "Putrajaya",
    checkinRadiusM: 100,
    distance: 200, // Within check-in range for demo
    distanceM: 200,
    canCheckin: true, // Demo mode allows check-in
  },
];

/**
 * Get demo masjids for the demo mode
 * All demo masjids are within check-in range
 */
export function getDemoMasjids(): MasjidResponse[] {
  return DEMO_MASJIDS;
}

/**
 * Demo user location (Kuala Lumpur city center)
 * Used when demo mode is active to simulate being near masjids
 */
export const DEMO_LOCATION = {
  latitude: 3.1416,
  longitude: 101.6911,
};

/**
 * Check if the current session is in demo mode
 * This checks the user's email from the session
 */
export async function isDemoMode(): Promise<boolean> {
  try {
    // Import dynamically to avoid circular dependencies
    const { authClient } = await import("./auth-client");
    const session = await authClient.getSession();
    return isDemoEmail(session?.data?.user?.email);
  } catch {
    return false;
  }
}

/**
 * Demo mode context for use in components
 */
export interface DemoModeContext {
  isDemo: boolean;
  demoLocation?: { latitude: number; longitude: number };
}
