import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { submitMasjidReport } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { clearCachedUserProfile } from '@/lib/storage';

import type {
  MasjidReportData,
  MasjidReportResponse,
} from '@/types/masjid-report';

export function useMasjidReport() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = async (data: MasjidReportData): Promise<MasjidReportResponse> => {
    if (!session?.user) {
      setError('Please sign in to submit a report');
      throw new Error('Please sign in to submit a report');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitMasjidReport(data);

      // Invalidate profile queries to refresh points
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      // Clear MMKV cache so profile screen fetches fresh data with updated points
      clearCachedUserProfile();

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit report';
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitReport,
    isSubmitting,
    error,
    clearError: () => setError(null),
  };
}
