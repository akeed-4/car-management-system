export interface Account {
  id: number;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  /** Accounting classification ("ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE") the
   * backend groups/filters by -- see CreateAccountDto.Type doc comment for how this differs from
   * accountTypeId. */
  Type: string;
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
  /** Null = multi-currency account (postable in any active currency). Non-null = locked to that
   * single currency, e.g. "Bank USD". */
  currencyId: number | null;
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
  /** Computed server-side from the account hierarchy -- true if any account references this one
   * as its parent. Single source of truth for "is this a grouping/control account"; do not derive
   * this client-side from isMainAccount, which the backend never keeps in sync with real children. */
  hasChildren?: boolean;
  /** Inverse of hasChildren -- true means this account may be selected for a Debit/Credit posting. */
  isPostable?: boolean;
  /** Read-only, only populated by the single-account fetch (getAccountById) -- true when this
   * account has at least one line on a Posted journal entry. The backend rejects changes to
   * accountCode/Type/accountTypeId/currencyId/parentId (and deletion) once this is true; the
   * edit form uses it to disable those controls up front instead of failing only at save time. */
  hasPostedTransactions?: boolean;
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
  /** Accounting classification the backend groups/filters by (debit vs. credit account pickers,
   * financial reports): "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE". Derived from the
   * same 1-5 selection as accountTypeId (see TYPE_BY_CLASSIFICATION in add-account.component.ts) --
   * a distinct field from accountTypeId, which is the account's Cash/Clients/Suppliers/Banks/...
   * sub-category (see backend AccountType.cs), not this classification. */
  Type: string;
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
  /** Null = multi-currency account (postable in any active currency). Non-null = locked to that
   * single currency, e.g. "Bank USD". */
  currencyId: number | null;
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
  /** See CreateAccountDto.Type doc comment. */
  Type: string;
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
  /** Null = multi-currency account (postable in any active currency). Non-null = locked to that
   * single currency, e.g. "Bank USD". */
  currencyId: number | null;
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