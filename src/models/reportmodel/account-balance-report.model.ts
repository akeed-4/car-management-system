/**
 * Account Balance Report Model
 */
export interface AccountBalanceReport {
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: 'Debit' | 'Credit';
}
