/**
 * Business Activity Report Model
 */
export interface BusinessActivityReport {
  activityType: string;
  description: string;
  amount: number;
  percentage: number;
  category: 'Operating' | 'Investing' | 'Financing';
}
