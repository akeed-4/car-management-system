/**
 * Report Filter Model
 */
export interface ReportFilter {
  startDate?: Date | string;
  endDate?: Date | string;
  accountId?: number;
  branchId?: number;
  costCenterId?: number;
  [key: string]: any;
}
