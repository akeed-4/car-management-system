export interface Account {
  id: number;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  accountId: number;
  companyId: number;
  accountCategoryId: number;
  accountTypeId: number;
  accountLevel: number;
  isMainAccount: boolean;
  mainAccountId: number;
  mainAccountCode: string;
  mainAccountName: string;
  parentId?: number;
  currencyId: number;
  hasCostCenter: boolean;
  costCenterId: number;
  isRetired: boolean;
  isActive: boolean;
  inActiveReasons: string;
  isPrivate: boolean;
  hasRemarks: boolean;
  remarksAr: string;
  remarksEn: string;
  notesAr: string;
  notesEn: string;
  createNewClient: boolean;
  createNewSupplier: boolean;
  createNewBank: boolean;
  clientId: number | null;
  clientName: string;
  supplierId: number | null;
  supplierName: string;
  bankId: number | null;
  bankName: string;
  balance: number;
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
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  accountId: number;
  companyId: number;
  accountCategoryId: number;
  accountTypeId: number;
  accountLevel: number;
  isMainAccount: boolean;
  mainAccountId: number;
  mainAccountCode: string;
  mainAccountName: string;
  parentId?: number;
  currencyId: number;
  hasCostCenter: boolean;
  costCenterId: number;
  isRetired: boolean;
  isActive: boolean;
  inActiveReasons: string;
  isPrivate: boolean;
  hasRemarks: boolean;
  remarksAr: string;
  remarksEn: string;
  notesAr: string;
  notesEn: string;
  createNewClient: boolean;
  createNewSupplier: boolean;
  createNewBank: boolean;
  clientId: number | null;
  clientName: string;
  supplierId: number | null;
  supplierName: string;
  bankId: number | null;
  bankName: string;
}

export interface UpdateAccountDto {
  id: number;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  accountId: number;
  companyId: number;
  accountCategoryId: number;
  accountTypeId: number;
  accountLevel: number;
  isMainAccount: boolean;
  mainAccountId: number;
  mainAccountCode: string;
  mainAccountName: string;
  parentId?: number;
  currencyId: number;
  hasCostCenter: boolean;
  costCenterId: number;
  isRetired: boolean;
  isActive: boolean;
  inActiveReasons: string;
  isPrivate: boolean;
  hasRemarks: boolean;
  remarksAr: string;
  remarksEn: string;
  notesAr: string;
  notesEn: string;
  createNewClient: boolean;
  createNewSupplier: boolean;
  createNewBank: boolean;
  clientId: number | null;
  clientName: string;
  supplierId: number | null;
  supplierName: string;
  bankId: number | null;
  bankName: string;
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