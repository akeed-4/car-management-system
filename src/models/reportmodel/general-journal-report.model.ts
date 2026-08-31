/**
 * General Journal Report Model
 *
 * Shape returned by the legacy `POST api/AccountReports/general-journal` full-array endpoint
 * (nested per-entry, flattened client-side). Kept for whatever still calls
 * `AccountReportService.getGeneralJournal()`; the live grid uses
 * `GeneralJournalRowDto`/`GeneralJournalRow` below instead.
 */
export interface GeneralJournalReport {
  entryId: number;
  entryDate: Date;
  entryNumber: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  reference: string;
}

/**
 * One row of `GET api/AccountReports/general-journal/query` (DevExtreme remote-operations
 * grid endpoint) -- mirrors `CarERP.Core.DTOs.Reports.GeneralJournalRowDto` field-for-field
 * (camelCase per the default ASP.NET JSON serializer). One row per journal line, not per entry.
 */
export interface GeneralJournalRow {
  lineId: number;
  journalEntryId: number;
  journalEntryNumber: string;
  journalDate: string;
  description: string;
  lineDescription?: string | null;
  referenceType: string;
  referenceId?: number | null;
  referenceNumber: string;
  status: string;
  accountId: number;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  debitAmount: number;
  creditAmount: number;
  costCenterId?: number | null;
  costCenterName?: string | null;
}
