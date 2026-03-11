/**
 * Active Check-in Hook
 * Fetches and manages the user's active check-in state from the backend
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getActiveCheckin, ActiveCheckin, PointsPreview } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import {
  hasActiveLiveActivity,
  restoreCheckinLiveActivity,
} from '@/lib/widget-bridge';

export interface ActiveCheckinData {
  checkIn: ActiveCheckin;
  pointsPreview: PointsPreview;
}

export function useActiveCheckin() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const hasRestoredLiveActivity = useRef(false);

  const query = useQuery<ActiveCheckinData | null, Error>({
    queryKey: ['active-checkin'],
    queryFn: getActiveCheckin,
    enabled: !!session?.user,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Restore Live Activity on app restart if check-in is active
  useEffect(() => {
    if (
      hasRestoredLiveActivity.current ||
      query.isLoading ||
      !query.data?.checkIn
    ) {
      return;
    }

    // Only restore if there's no existing Live Activity running
    if (!hasActiveLiveActivity()) {
      const checkIn = query.data.checkIn;
      const checkInTime = new Date(checkIn.checkInAt.replace(' ', 'T') + 'Z');
      const targetTime = new Date(checkInTime.getTime() + 10 * 60 * 1000);
      const remaining = Math.max(
        0,
        Math.floor((targetTime.getTime() - Date.now()) / 1000),
      );

      restoreCheckinLiveActivity({
        masjidName: checkIn.masjidName,
        remainingSeconds: remaining,
        isPrayerTime: checkIn.isPrayerTime,
        prayerName: checkIn.prayerName ?? '',
        estimatedPoints: query.data.pointsPreview?.estimatedTotal ?? 10,
        isReadyToCheckout: remaining === 0,
      });
    }

    hasRestoredLiveActivity.current = true;
  }, [query.isLoading, query.data]);

  // Function to invalidate and refetch active checkin
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['active-checkin'] });
  };

  return {
    ...query,
    invalidate,
  };
}
