/**
 * Masjid Report Types
 * Types for reporting incorrect masjid information or submitting missing masjids
 */

export type MasjidReportType = 'incorrect-info' | 'missing-masjid';

/**
 * Report data structure for masjid reports
 */
export interface MasjidReportData {
  type: MasjidReportType;
  masjidId?: string;
  masjidName?: string;
  address?: string;
  coordinates?: string; // "lat,lng" format
  description: string;
}

/**
 * API response for successful report submission
 */
export interface MasjidReportResponse {
  success: boolean;
  reportId: string;
  pointsEarned: number;
}
