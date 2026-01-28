// Report model interfaces for account reports
export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  branchId?: number;
  accountId?: number;
  accountType?: string;
  includeZeroBalances?: boolean;
  dateRange?: string;
}

export interface AccountBalanceReport {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountNameAr?: string;
  balance: number;
  debitBalance: number;
  creditBalance: number;
  accountType: string;
  accountLevel: number;
  parentAccountId?: number;
  branchId?: number;
  branchName?: string;
  currencyCode?: string;
  lastTransactionDate?: Date;
}

export interface BalanceSheetReport {
  id: string;
  accountCode: string;
  accountName: string;
  accountNameAr?: string;
  balance: number;
  accountType: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  category: 'Current Assets' | 'Fixed Assets' | 'Current Liabilities' | 'Long Term Liabilities' | 'Equity' | 'Revenue' | 'Expense';
  isTotal?: boolean;
  level: number;
  parentId?: string;
}

export interface TrialBalanceReport {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountNameAr?: string;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
  accountType: string;
  accountLevel: number;
}

export interface GeneralJournalReport {
  id: number;
  entryNumber: string;
  entryDate: Date;
  description: string;
  descriptionAr?: string;
  accountCode: string;
  accountName: string;
  accountNameAr?: string;
  debit: number;
  credit: number;
  referenceNumber?: string;
  journalType: string;
  branchId?: number;
  branchName?: string;
  createdBy?: string;
  createdDate: Date;
}

export interface AccountStatementReport {
  id: number;
  transactionDate: Date;
  description: string;
  descriptionAr?: string;
  referenceNumber?: string;
  debit: number;
  credit: number;
  balance: number;
  transactionType: string;
  journalEntryId?: number;
  entryNumber?: string;
  branchId?: number;
  branchName?: string;
}

export interface BusinessActivityReport {
  id: number;
  date: Date;
  description: string;
  descriptionAr?: string;
  accountCode: string;
  accountName: string;
  accountNameAr?: string;
  amount: number;
  transactionType: 'Debit' | 'Credit';
  category: string;
  branchId?: number;
  branchName?: string;
  referenceNumber?: string;
}

// Additional report interfaces that might be needed
export interface FinancialReport {
  reportType: string;
  reportName: string;
  generatedDate: Date;
  startDate: Date;
  endDate: Date;
  data: any[];
  totals?: any;
  filters?: ReportFilter;
}

export interface ReportColumn {
  dataField: string;
  caption: string;
  dataType?: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
  alignment?: 'left' | 'center' | 'right';
  width?: number | string;
  visible?: boolean;
  calculateCellValue?: (rowData: any) => any;
  customizeText?: (cellInfo: any) => string;
}

export interface ReportSummary {
  column: string;
  summaryType: 'sum' | 'avg' | 'min' | 'max' | 'count';
  valueFormat?: string;
  displayFormat?: string;
  alignByColumn?: boolean;
}