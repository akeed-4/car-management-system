/**
 * Business Activity Report Model
 *
 * One flattened row of `GET api/AccountReports/business-activity`'s nested
 * BusinessActivityReportDto (Sales/Purchase/Inventory/FinancialSummary sections) -- see
 * AccountReportService.flattenBusinessActivity(). `category` is the section name shown as the
 * grid's groupable "Type" column, not an accounting classification.
 */
export interface BusinessActivityReport {
  activityType: string;
  description: string;
  amount: number;
  percentage: number;
  category: string;
}
