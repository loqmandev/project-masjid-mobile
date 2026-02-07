/**
 * Masjid Report Types
 * Types for reporting incorrect masjid information or submitting missing masjids
 */

export type MasjidReportType = 'incorrect-info' | 'missing-masjid';

export type MasjidReportFieldName =
  | 'name'
  | 'address'
  | 'coordinates'
  | 'facilities'
  | 'other';

/**
 * Report data structure for masjid reports
 */
export interface MasjidReportData {
  type: MasjidReportType;
  // For incorrect-info reports
  masjidId?: string;
  fieldName?: MasjidReportFieldName;
  currentValue?: string;
  correctValue?: string;
  // For missing-masjid reports
  masjidName?: string;
  address?: string;
  coordinates?: string; // "lat,lng" format
  // Common fields
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
