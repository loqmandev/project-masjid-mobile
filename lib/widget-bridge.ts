/**
 * Widget Bridge — centralized update functions for iOS widgets and Live Activity.
 * All functions are no-ops on Android/web.
 */

import { Platform } from "react-native";
import type { Widget, LiveActivity, LiveActivityFactory } from "expo-widgets";

// ── Types ──────────────────────────────────────────────────────────

export interface NearbyMasjidWidgetProps {
  masjidName: string;
  distanceM: number;
  district: string;
  canCheckin: boolean;
  isEmpty: boolean;
  emptyReason: string;
}

export interface ProfileSummaryWidgetProps {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalPoints: number;
  uniqueMasjidsVisited: number;
  currentStreak: number;
  achievementCount: number;
}

export interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  lastVisitDate: string;
}

export interface CheckInLiveActivityProps {
  masjidName: string;
  remainingSeconds: number;
  isPrayerTime: boolean;
  prayerName: string;
  estimatedPoints: number;
  isReadyToCheckout: boolean;
}

// ── Lazy-loaded widget/activity references ─────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _nearbyWidget: Widget<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _profileWidget: Widget<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _streakWidget: Widget<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _checkinActivity: LiveActivityFactory<any> | null = null;

function getNearbyWidget() {
  if (!_nearbyWidget) {
    _nearbyWidget = require("../widgets/nearby-masjid").default;
  }
  return _nearbyWidget!;
}

function getProfileWidget() {
  if (!_profileWidget) {
    _profileWidget = require("../widgets/profile-summary").default;
  }
  return _profileWidget!;
}

function getStreakWidget() {
  if (!_streakWidget) {
    _streakWidget = require("../widgets/streak").default;
  }
  return _streakWidget!;
}

function getCheckinActivity() {
  if (!_checkinActivity) {
    _checkinActivity = require("../widgets/checkin-live-activity").default;
  }
  return _checkinActivity!;
}

// ── Guard ──────────────────────────────────────────────────────────

const isIOS = Platform.OS === "ios";

// ── Widget Updates ─────────────────────────────────────────────────

export function updateNearbyMasjidWidget(props: NearbyMasjidWidgetProps): void {
  if (!isIOS) return;
  try {
    getNearbyWidget().updateSnapshot(props);
  } catch {
    // Widget extension may not be available
  }
}

export function updateProfileSummaryWidget(
  props: ProfileSummaryWidgetProps,
): void {
  if (!isIOS) return;
  try {
    getProfileWidget().updateSnapshot(props);
  } catch {
    // Widget extension may not be available
  }
}

export function updateStreakWidget(props: StreakWidgetProps): void {
  if (!isIOS) return;
  try {
    getStreakWidget().updateSnapshot(props);
  } catch {
    // Widget extension may not be available
  }
}

// ── Live Activity ──────────────────────────────────────────────────

let _activeLiveActivity: LiveActivity<CheckInLiveActivityProps> | null = null;

export function startCheckinLiveActivity(
  props: CheckInLiveActivityProps,
): void {
  if (!isIOS) return;
  try {
    // End any existing activity first
    endCheckinLiveActivity("immediate");
    _activeLiveActivity = getCheckinActivity().start(props);
  } catch {
    // Live Activities may not be available
  }
}

export function updateCheckinLiveActivity(
  props: CheckInLiveActivityProps,
): void {
  if (!isIOS) return;
  try {
    if (_activeLiveActivity) {
      _activeLiveActivity.update(props);
    }
  } catch {
    // Live Activity may have been dismissed
    _activeLiveActivity = null;
  }
}

export function endCheckinLiveActivity(
  policy: "default" | "immediate" = "default",
): void {
  if (!isIOS) return;
  try {
    if (_activeLiveActivity) {
      _activeLiveActivity.end(policy);
      _activeLiveActivity = null;
    }
  } catch {
    _activeLiveActivity = null;
  }
}

/**
 * Restore a Live Activity reference if one is already running
 * (e.g., after app restart during an active check-in).
 */
export function restoreCheckinLiveActivity(
  props: CheckInLiveActivityProps,
): void {
  if (!isIOS) return;
  try {
    const instances = getCheckinActivity().getInstances();
    if (instances.length > 0) {
      _activeLiveActivity = instances[0];
      _activeLiveActivity.update(props);
    } else {
      // No existing activity, start a new one
      _activeLiveActivity = getCheckinActivity().start(props);
    }
  } catch {
    // Live Activities may not be available
  }
}

export function hasActiveLiveActivity(): boolean {
  return _activeLiveActivity !== null;
}
