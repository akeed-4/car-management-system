export interface Account {
  id: number;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentId?: number;
  balance: number;
  isActive: boolean;
  createdDate: Date;
  updatedDate: Date;
}

export interface JournalEntry {
  id: number;
  date: Date;
  description: string;
  reference?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdDate: Date;
  updatedDate: Date;
}

export interface JournalEntryLine {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface CreateAccountDto {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentId?: number;
}

export interface UpdateAccountDto {
  id: number;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentId?: number;
  isActive: boolean;
}

export interface CreateJournalEntryDto {
  date: Date;
  description: string;
  reference?: string;
  lines: Omit<JournalEntryLine, 'id' | 'accountCode' | 'accountName'>[];
}

export interface UpdateJournalEntryDto {
  id: number;
  date: Date;
  description: string;
  reference?: string;
  lines: Omit<JournalEntryLine, 'id' | 'accountCode' | 'accountName'>[];
}