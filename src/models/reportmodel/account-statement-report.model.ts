/**
 * Account Statement Report Model
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
