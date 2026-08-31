/**
 * Account Statement Report Model
 *
 * Shape returned by the legacy `POST api/AccountReports/account-statement` full-array endpoint.
 * Kept for whatever still calls `AccountReportService.getAccountStatement()`; the live grid uses
 * `AccountStatementRowDto`/`AccountStatementRow` below instead.
 */
export interface AccountStatementReport {
  transactionDate: Date;
  transactionNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
}

/**
 * One row of `GET api/AccountReports/account-statement/query` (DevExtreme remote-operations
 * grid endpoint) -- mirrors `CarERP.Core.DTOs.Reports.AccountStatementRowDto` field-for-field.
 * The running `balance` is computed server-side over the full filtered [FromDate,ToDate] x
 * AccountId set before paging, so it stays correct across pages. OpeningBalance itself is not a
 * row field -- it rides along in the response's `X-Opening-Balance` header (see
 * ReportDataSourceService's `onHeaders` option).
 */
export interface AccountStatementRow {
  lineId: number;
  transactionDate: string;
  journalEntryNumber: string;
  description: string;
  referenceType: string;
  referenceNumber: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  costCenterId?: number | null;
  costCenterName?: string | null;
}
