/**
 * Active Check-in Hook
 * Fetches and manages the user's active check-in state from the backend
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveCheckin, ActiveCheckin } from '@/lib/api';
import { useSession } from '@/lib/auth-client';

export function useActiveCheckin() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const query = useQuery<ActiveCheckin | null, Error>({
    queryKey: ['active-checkin'],
    queryFn: getActiveCheckin,
    enabled: !!session?.user,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Function to invalidate and refetch active checkin
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['active-checkin'] });
  };

  return {
    ...query,
    invalidate,
  };
}
