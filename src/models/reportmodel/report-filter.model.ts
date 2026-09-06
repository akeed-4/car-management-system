/**
 * Report Filter Model
 */
export interface ReportFilter {
  startDate?: Date | string;
  endDate?: Date | string;
  accountId?: number;
  storeId?: number;
  costCenterId?: number;
  [key: string]: any;
}
