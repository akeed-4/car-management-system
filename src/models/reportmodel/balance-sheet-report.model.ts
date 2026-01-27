/**
 * Balance Sheet Report Model
 */
export interface BalanceSheetReport {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  amount: number;
  level: number;
  parentId?: number;
  hasChildren: boolean;
}
