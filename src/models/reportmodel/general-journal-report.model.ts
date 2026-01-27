/**
 * General Journal Report Model
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
