// Account Node Model for Hierarchical Chart of Accounts
export interface AccountNode {
  id: number;
  parentId: number | null;
  accountCode: string;
  accountNameAr: string;
  type: 'PARENT' | 'ACCOUNT';
  balance?: number;
  createdDate?: Date;
  updatedDate?: Date;
}

// Flattened for TreeList
export interface AccountNodeFlat extends AccountNode {
  expanded?: boolean;
}

// Account Categories
export enum AccountCategory {
  ASSETS = 'ASSETS',
  LIABILITIES = 'LIABILITIES',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSES = 'EXPENSES'
}

// Account Operations DTO
export interface CreateAccountDto {
  parentId?: number | null;
  code: string;
  name: string;
  type: 'PARENT' | 'ACCOUNT';
}

export interface UpdateAccountDto extends CreateAccountDto {
  id: number;
}

export interface DeleteAccountDto {
  id: number;
}
