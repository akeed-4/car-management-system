import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Account, JournalEntry, CreateAccountDto, UpdateAccountDto, CreateJournalEntryDto, UpdateJournalEntryDto } from './models';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private journalEntriesSubject = new BehaviorSubject<JournalEntry[]>([]);

  public accounts$ = this.accountsSubject.asObservable();
  public journalEntries$ = this.journalEntriesSubject.asObservable();

  constructor(private http: HttpClient, private translate: TranslateService) {
    this.loadSampleData();
  }

  // Account CRUD
  getAccounts(): Observable<Account[]> {
    return this.accounts$;
  }

  getAccountById(id: number): Observable<Account | undefined> {
    return this.accounts$.pipe(
      map(accounts => accounts.find(acc => acc.id === id))
    );
  }

  createAccount(dto: CreateAccountDto): Observable<Account> {
    const newAccount: Account = {
      id: Date.now(),
      ...dto,
      balance: 0,
      isActive: true,
      createdDate: new Date(),
      updatedDate: new Date()
    };
    const currentAccounts = this.accountsSubject.value;
    this.accountsSubject.next([...currentAccounts, newAccount]);
    return of(newAccount);
  }

  updateAccount(dto: UpdateAccountDto): Observable<Account> {
    const currentAccounts = this.accountsSubject.value;
    const index = currentAccounts.findIndex(acc => acc.id === dto.id);
    if (index !== -1) {
      const updatedAccount = { ...currentAccounts[index], ...dto, updatedDate: new Date() };
      currentAccounts[index] = updatedAccount;
      this.accountsSubject.next([...currentAccounts]);
      return of(updatedAccount);
    }
    throw new Error('Account not found');
  }

  deleteAccount(id: number): Observable<void> {
    const currentAccounts = this.accountsSubject.value;
    const filteredAccounts = currentAccounts.filter(acc => acc.id !== id);
    this.accountsSubject.next(filteredAccounts);
    return of(void 0);
  }

  // Journal Entry CRUD
  getJournalEntries(): Observable<JournalEntry[]> {
    return this.journalEntries$;
  }

  getJournalEntryById(id: number): Observable<JournalEntry | undefined> {
    return this.journalEntries$.pipe(
      map(entries => entries.find(entry => entry.id === id))
    );
  }

  createJournalEntry(dto: CreateJournalEntryDto): Observable<JournalEntry> {
    const totalDebit = dto.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = dto.lines.reduce((sum, line) => sum + line.credit, 0);
    const isBalanced = totalDebit === totalCredit;

    const newEntry: JournalEntry = {
      id: Date.now(),
      ...dto,
      lines: dto.lines.map((line, index) => ({
        ...line,
        id: Date.now() + index,
        accountCode: '', // Would be populated from account lookup
        accountName: ''  // Would be populated from account lookup
      })),
      totalDebit,
      totalCredit,
      isBalanced,
      createdDate: new Date(),
      updatedDate: new Date()
    };

    const currentEntries = this.journalEntriesSubject.value;
    this.journalEntriesSubject.next([...currentEntries, newEntry]);
    return of(newEntry);
  }

  updateJournalEntry(dto: UpdateJournalEntryDto): Observable<JournalEntry> {
    const currentEntries = this.journalEntriesSubject.value;
    const index = currentEntries.findIndex(entry => entry.id === dto.id);
    if (index !== -1) {
      const totalDebit = dto.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = dto.lines.reduce((sum, line) => sum + line.credit, 0);
      const isBalanced = totalDebit === totalCredit;

      const updatedEntry = {
        ...currentEntries[index],
        ...dto,
        lines: dto.lines.map((line, index) => ({
          ...line,
          id: currentEntries[index].lines[index]?.id || Date.now() + index,
          accountCode: '', // Would be populated from account lookup
          accountName: ''  // Would be populated from account lookup
        })),
        totalDebit,
        totalCredit,
        isBalanced,
        updatedDate: new Date()
      };

      currentEntries[index] = updatedEntry;
      this.journalEntriesSubject.next([...currentEntries]);
      return of(updatedEntry);
    }
    throw new Error('Journal entry not found');
  }

  deleteJournalEntry(id: number): Observable<void> {
    const currentEntries = this.journalEntriesSubject.value;
    const filteredEntries = currentEntries.filter(entry => entry.id !== id);
    this.journalEntriesSubject.next(filteredEntries);
    return of(void 0);
  }

  private loadSampleData() {
    // Sample accounts with hierarchical structure
    const sampleAccounts: Account[] = [
      // Level 1 - Main Accounts
      {
        id: 1,
        accountCode: '1',
        accountNameAr: 'الأصول',
        accountNameEn: 'Assets',
        accountId: 1,
        companyId: 1,
        accountCategoryId: 1,
        accountTypeId: 1,
        accountLevel: 1,
        isMainAccount: true,
        mainAccountId: 1,
        mainAccountCode: '1',
        mainAccountName: 'Assets',
        parentId: undefined,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 75000,
        createdDate: new Date(),
        updatedDate: new Date()
      },
      {
        id: 2,
        accountCode: '2',
        accountNameAr: 'الخصوم',
        accountNameEn: 'Liabilities',
        accountId: 2,
        companyId: 1,
        accountCategoryId: 2,
        accountTypeId: 2,
        accountLevel: 1,
        isMainAccount: true,
        mainAccountId: 2,
        mainAccountCode: '2',
        mainAccountName: 'Liabilities',
        parentId: undefined,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 15000,
        createdDate: new Date(),
        updatedDate: new Date()
      },
      {
        id: 3,
        accountCode: '3',
        accountNameAr: 'رأس المال',
        accountNameEn: 'Equity',
        accountId: 3,
        companyId: 1,
        accountCategoryId: 3,
        accountTypeId: 3,
        accountLevel: 1,
        isMainAccount: true,
        mainAccountId: 3,
        mainAccountCode: '3',
        mainAccountName: 'Equity',
        parentId: undefined,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 60000,
        createdDate: new Date(),
        updatedDate: new Date()
      },
      {
        id: 4,
        accountCode: '4',
        accountNameAr: 'الإيرادات',
        accountNameEn: 'Revenue',
        accountId: 4,
        companyId: 1,
        accountCategoryId: 4,
        accountTypeId: 4,
        accountLevel: 1,
        isMainAccount: true,
        mainAccountId: 4,
        mainAccountCode: '4',
        mainAccountName: 'Revenue',
        parentId: undefined,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 0,
        createdDate: new Date(),
        updatedDate: new Date()
      },
      {
        id: 5,
        accountCode: '5',
        accountNameAr: 'المصروفات',
        accountNameEn: 'Expenses',
        accountId: 5,
        companyId: 1,
        accountCategoryId: 5,
        accountTypeId: 5,
        accountLevel: 1,
        isMainAccount: true,
        mainAccountId: 5,
        mainAccountCode: '5',
        mainAccountName: 'Expenses',
        parentId: undefined,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 0,
        createdDate: new Date(),
        updatedDate: new Date()
      },

      // Level 2 - Sub-Accounts under Assets
      {
        id: 6,
        accountCode: '1.1',
        accountNameAr: 'الأصول المتداولة',
        accountNameEn: 'Current Assets',
        accountId: 6,
        companyId: 1,
        accountCategoryId: 1,
        accountTypeId: 1,
        accountLevel: 2,
        isMainAccount: false,
        mainAccountId: 1,
        mainAccountCode: '1',
        mainAccountName: 'Assets',
        parentId: 1,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 75000,
        createdDate: new Date(),
        updatedDate: new Date()
      },
      {
        id: 7,
        accountCode: '1.2',
        accountNameAr: 'الأصول الثابتة',
        accountNameEn: 'Fixed Assets',
        accountId: 7,
        companyId: 1,
        accountCategoryId: 1,
        accountTypeId: 1,
        accountLevel: 2,
        isMainAccount: false,
        mainAccountId: 1,
        mainAccountCode: '1',
        mainAccountName: 'Assets',
        parentId: 1,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 0,
        createdDate: new Date(),
        updatedDate: new Date()
      },

      // Level 3 - Sub-Accounts under Current Assets
      {
        id: 8,
        accountCode: '1.1.1',
        accountNameAr: 'النقد وما يعادله',
        accountNameEn: 'Cash and Cash Equivalents',
        accountId: 8,
        companyId: 1,
        accountCategoryId: 1,
        accountTypeId: 1,
        accountLevel: 3,
        isMainAccount: false,
        mainAccountId: 1,
        mainAccountCode: '1',
        mainAccountName: 'Assets',
        parentId: 6,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 50000,
        createdDate: new Date(),
        updatedDate: new Date()
      },
      {
        id: 9,
        accountCode: '1.1.2',
        accountNameAr: 'المدينون',
        accountNameEn: 'Accounts Receivable',
        accountId: 9,
        companyId: 1,
        accountCategoryId: 1,
        accountTypeId: 1,
        accountLevel: 3,
        isMainAccount: false,
        mainAccountId: 1,
        mainAccountCode: '1',
        mainAccountName: 'Assets',
        parentId: 6,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 25000,
        createdDate: new Date(),
        updatedDate: new Date()
      },

      // Level 4 - Sub-Accounts under Cash
      {
        id: 10,
        accountCode: '1.1.1.1',
        accountNameAr: 'الصندوق الصغير',
        accountNameEn: 'Petty Cash',
        accountId: 10,
        companyId: 1,
        accountCategoryId: 1,
        accountTypeId: 1,
        accountLevel: 4,
        isMainAccount: false,
        mainAccountId: 1,
        mainAccountCode: '1',
        mainAccountName: 'Assets',
        parentId: 8,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 1000,
        createdDate: new Date(),
        updatedDate: new Date()
      },
      {
        id: 11,
        accountCode: '1.1.1.2',
        accountNameAr: 'الحساب البنكي',
        accountNameEn: 'Bank Account',
        accountId: 11,
        companyId: 1,
        accountCategoryId: 1,
        accountTypeId: 1,
        accountLevel: 4,
        isMainAccount: false,
        mainAccountId: 1,
        mainAccountCode: '1',
        mainAccountName: 'Assets',
        parentId: 8,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 49000,
        createdDate: new Date(),
        updatedDate: new Date()
      },

      // Level 2 - Sub-Accounts under Liabilities
      {
        id: 12,
        accountCode: '2.1',
        accountNameAr: 'الخصوم المتداولة',
        accountNameEn: 'Current Liabilities',
        accountId: 12,
        companyId: 1,
        accountCategoryId: 2,
        accountTypeId: 2,
        accountLevel: 2,
        isMainAccount: false,
        mainAccountId: 2,
        mainAccountCode: '2',
        mainAccountName: 'Liabilities',
        parentId: 2,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 15000,
        createdDate: new Date(),
        updatedDate: new Date()
      },

      // Level 3 - Sub-Accounts under Current Liabilities
      {
        id: 13,
        accountCode: '2.1.1',
        accountNameAr: 'الدائنون',
        accountNameEn: 'Accounts Payable',
        accountId: 13,
        companyId: 1,
        accountCategoryId: 2,
        accountTypeId: 2,
        accountLevel: 3,
        isMainAccount: false,
        mainAccountId: 2,
        mainAccountCode: '2',
        mainAccountName: 'Liabilities',
        parentId: 12,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 15000,
        createdDate: new Date(),
        updatedDate: new Date()
      },

      // Level 2 - Sub-Accounts under Expenses
      {
        id: 14,
        accountCode: '5.1',
        accountNameAr: 'مصروفات التشغيل',
        accountNameEn: 'Operating Expenses',
        accountId: 14,
        companyId: 1,
        accountCategoryId: 5,
        accountTypeId: 5,
        accountLevel: 2,
        isMainAccount: false,
        mainAccountId: 5,
        mainAccountCode: '5',
        mainAccountName: 'Expenses',
        parentId: 5,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 0,
        createdDate: new Date(),
        updatedDate: new Date()
      },
      {
        id: 15,
        accountCode: '5.2',
        accountNameAr: 'مصروفات إدارية',
        accountNameEn: 'Administrative Expenses',
        accountId: 15,
        companyId: 1,
        accountCategoryId: 5,
        accountTypeId: 5,
        accountLevel: 2,
        isMainAccount: false,
        mainAccountId: 5,
        mainAccountCode: '5',
        mainAccountName: 'Expenses',
        parentId: 5,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 0,
        createdDate: new Date(),
        updatedDate: new Date()
      },

      // Level 3 - Sub-Accounts under Operating Expenses
      {
        id: 16,
        accountCode: '5.1.1',
        accountNameAr: 'تكلفة البضاعة المباعة',
        accountNameEn: 'Cost of Goods Sold',
        accountId: 16,
        companyId: 1,
        accountCategoryId: 5,
        accountTypeId: 5,
        accountLevel: 3,
        isMainAccount: false,
        mainAccountId: 5,
        mainAccountCode: '5',
        mainAccountName: 'Expenses',
        parentId: 14,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 0,
        createdDate: new Date(),
        updatedDate: new Date()
      },
      {
        id: 17,
        accountCode: '5.1.2',
        accountNameAr: 'مصروفات التسويق',
        accountNameEn: 'Marketing Expenses',
        accountId: 17,
        companyId: 1,
        accountCategoryId: 5,
        accountTypeId: 5,
        accountLevel: 3,
        isMainAccount: false,
        mainAccountId: 5,
        mainAccountCode: '5',
        mainAccountName: 'Expenses',
        parentId: 14,
        currencyId: 1,
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        balance: 0,
        createdDate: new Date(),
        updatedDate: new Date()
      }
    ];

    // Sample journal entries
    const sampleEntries: JournalEntry[] = [
      {
        id: 1,
        date: new Date('2025-12-01'),
        description: 'Initial cash investment',
        reference: 'INV-001',
        lines: [
          { id: 101, accountId: 1, accountCode: '1000', accountName: 'Cash', debit: 50000, credit: 0 },
          { id: 102, accountId: 4, accountCode: '3000', accountName: 'Owner Equity', debit: 0, credit: 50000 }
        ],
        totalDebit: 50000,
        totalCredit: 50000,
        isBalanced: true,
        createdDate: new Date(),
        updatedDate: new Date()
      }
    ];

    this.accountsSubject.next(sampleAccounts);
    this.journalEntriesSubject.next(sampleEntries);
  }

  /**
   * Translate account name based on current language
   */
  translateAccountName(accountName: string): string {
    const accountTranslations: { [key: string]: string } = {
      // English to translation keys mapping
      'Cash - Bank': 'ACCOUNTING.ACCOUNT_CASH_BANK',
      'Customer Deposits': 'ACCOUNTING.ACCOUNT_CUSTOMER_DEPOSITS',
      'Sales Returns & Allowances': 'ACCOUNTING.ACCOUNT_SALES_RETURNS',
      'VAT Receivable': 'ACCOUNTING.ACCOUNT_VAT_RECEIVABLE',
      'Supplier Payables': 'ACCOUNTING.ACCOUNT_SUPPLIER_PAYABLES',
      'Inventory': 'ACCOUNTING.ACCOUNT_INVENTORY',
      'Sales Revenue': 'ACCOUNTING.ACCOUNT_SALES_REVENUE',
      'VAT Payable': 'ACCOUNTING.ACCOUNT_VAT_PAYABLE',
      'Cost of Goods Sold': 'ACCOUNTING.ACCOUNT_COST_OF_GOODS_SOLD',
      'Purchase Returns': 'ACCOUNTING.ACCOUNT_PURCHASE_RETURNS',
      'Accounts Receivable': 'ACCOUNTING.ACCOUNT_ACCOUNTS_RECEIVABLE',
      'Accounts Payable': 'ACCOUNTING.ACCOUNT_ACCOUNTS_PAYABLE',
      'Retained Earnings': 'ACCOUNTING.ACCOUNT_RETAINED_EARNINGS',
      'Capital': 'ACCOUNTING.ACCOUNT_CAPITAL',
      'Current Assets': 'ACCOUNTING.ACCOUNT_CURRENT_ASSETS',
      'Fixed Assets': 'ACCOUNTING.ACCOUNT_FIXED_ASSETS',
      'Current Liabilities': 'ACCOUNTING.ACCOUNT_CURRENT_LIABILITIES',
      'Long-term Liabilities': 'ACCOUNTING.ACCOUNT_LONG_TERM_LIABILITIES',
      'Equity': 'ACCOUNTING.ACCOUNT_EQUITY',
      'Revenue': 'ACCOUNTING.ACCOUNT_REVENUE',
      'Expenses': 'ACCOUNTING.ACCOUNT_EXPENSES'
    };

    const translationKey = accountTranslations[accountName];
    if (translationKey) {
      return this.translate.instant(translationKey);
    }

    // If no translation found, return the original name
    return accountName;
  }
}