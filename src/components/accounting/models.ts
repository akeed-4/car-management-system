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
  customerId: number | null;
  customerName: string;
  supplierId: number | null;
  supplierName: string;
  bankId: number | null;
  bankName: string;
  isSystemGenerated: boolean;
  /** Read-only, derived server-side from customerId/supplierId/bankId. */
  entityType?: 'none' | 'customer' | 'supplier' | 'bank';
  /** Required only when createNewClient is true and no existing customer is being linked. */
  newCustomerPhone?: string;
  /** Required only when createNewSupplier is true and no existing supplier is being linked. */
  newSupplierPhone?: string;
  /** Update only: when true and the account is already linked, propagate the new name to the linked entity. */
  syncEntityName?: boolean;
  balance: number;
  createdDate: Date;
  updatedDate: Date;
}

export interface JournalEntry {
  id: number;
  journalEntryNumber: string;
  journalDate: Date;
  referenceNumber?: string;
  description: string;
  status: string;
  costCenterId?: number;
  costCenterName?: string;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
  isGeneratedDynamically?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  // Legacy fields
  transactionId?: string;
  accountCode?: string;
  debit?: number;
  credit?: number;
  referenceType?: string;
  referenceId?: number;
  entryDate?: Date;
  reference?: string;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: number;
  journalEntryId: number;
  lineNumber: number;
  accountId: number;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  accountType: string;
  accountBalance: number;
  debitAmount: number;
  creditAmount: number;
  costCenterId?: number;
  costCenterName?: string;
  lineDescription?: string;
  // Legacy fields
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
  customerId: number | null;
  customerName: string;
  supplierId: number | null;
  supplierName: string;
  bankId: number | null;
  bankName: string;
  newCustomerPhone?: string;
  newSupplierPhone?: string;
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
  customerId: number | null;
  customerName: string;
  supplierId: number | null;
  supplierName: string;
  bankId: number | null;
  bankName: string;
  newCustomerPhone?: string;
  newSupplierPhone?: string;
  syncEntityName?: boolean;
}

export interface CreateJournalEntryLineDto {
  AccountId: number;
  DebitAmount: number;
  CreditAmount: number;
  CostCenterId?: number;
  LineDescription?: string;
}

export interface CreateJournalEntryDto {
  JournalDate: Date;
  ReferenceNumber?: string;
  Description: string;
  CostCenterId?: number;
  Lines: CreateJournalEntryLineDto[];
}

export interface UpdateJournalEntryDto {
  id: number;
  JournalDate: Date;
  ReferenceNumber?: string;
  Description: string;
  CostCenterId?: number;
  Lines: CreateJournalEntryLineDto[];
}

export interface OpeningBalanceFinancial {
  id?: number;
  accountId: number;
  accountName: string;
  openingBalance: number;
  currency: string;
  accountType: string;
  notes: string;
  entryDate: Date;
}

export interface OpeningBalanceInventory {
  id?: number;
  itemId: number;
  itemName: string;
  category: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  location: string;
  notes: string;
  entryDate: Date;
  storeId: number;
}