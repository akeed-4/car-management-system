import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Account, JournalEntry, CreateAccountDto, UpdateAccountDto, CreateJournalEntryDto, UpdateJournalEntryDto, OpeningBalanceFinancial, OpeningBalanceInventory } from './models';
import { environment } from '@/src/environments/environment';
import { AccountNode } from '@/src/models/account-node.model';
import { PurchaseReturnJournalEntry } from '@/src/models/sales-return.model';

/** Mirrors backend CarERP.Core.DTOs.Accounting.DefaultAccountKind exactly -- numeric values must
 *  stay in sync since they're sent as a plain query param. */
export enum DefaultAccountKind {
  CustomerReceivable = 0,
  SupplierPayable = 1,
  PaymentAccount = 2,
  AdditionalCostDebit = 3,
  AdditionalCostCredit = 4,
  ConsignmentCommissionRevenue = 5,
  ConsignmentOwnerPayable = 6,
  StockAdjustmentInventory = 7,
  StockAdjustmentGainLoss = 8,
  OpeningBalanceInventory = 9,
  OpeningBalanceEquity = 10,
  /** Sales Invoice Debit leg (Cash/Bank on a cash sale via isCash=true, else the customer's AR
   *  via partyId=customerId). */
  SalesInvoiceDebit = 11,
  /** Sales Invoice Credit leg (Revenue) -- partyId here is the car category id, not a customer. */
  SalesInvoiceCredit = 12,
  /** Purchase Invoice Debit leg (Inventory/Expense). */
  PurchaseInvoiceDebit = 13,
  /** Purchase Invoice Credit leg (Cash/Bank on a cash purchase via isCash=true, else the
   *  supplier's AP via partyId=supplierId). */
  PurchaseInvoiceCredit = 14,
}

export interface ResolveDefaultAccountRequest {
  kind: DefaultAccountKind;
  storeId?: number | null;
  partyId?: number | null;
  requestedAccountId?: number | null;
  isCapitalized?: boolean | null;
  expenseCategory?: string | null;
  /** Settlement-type flag for SalesInvoiceDebit/PurchaseInvoiceCredit -- true routes to the
   *  Cash/Bank branch (requestedAccountId honored as a request), false to the party (AR/AP)
   *  branch (partyId required). Ignored by every other Kind. */
  isCash?: boolean | null;
}

export interface DefaultAccountResult {
  accountId?: number | null;
  accountCode?: string | null;
  accountNameEn?: string | null;
  accountNameAr?: string | null;
  error?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private journalEntriesSubject = new BehaviorSubject<JournalEntry[]>([]);
  private refreshSubject = new Subject<void>();
  private Url = environment.origin + 'api/Accounting';
  private Urljournal = environment.origin + 'api/JournalEntries';
  private Urlopeningbalances = environment.origin + 'api/InventoryOpeningBalances';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  public accounts$ = this.accountsSubject.asObservable();
  public journalEntries$ = this.journalEntriesSubject.asObservable();
  public refresh$ = this.refreshSubject.asObservable();

  constructor(private http: HttpClient, private translate: TranslateService) {
    this.getAccounts().subscribe();
    this.getJournalEntries().subscribe();
    // Remove loadSampleData() call to use real API
  }

  // Account CRUD
  getAccounts(): Observable<Account[]> {
    console.log('Making GET request to:', `${this.Url}/accounts`);
    return this.http.get<any>(`${this.Url}/accounts`, { headers: this.headers }).pipe(
      map(response => {
        console.log('Received accounts response:', response);
        // Extract the data array from the API response
        const accounts = Array.isArray(response) ? response : (response as any).data || [];
        console.log('Extracted accounts array:', accounts);
        // Set parentId for partial accounts
        const processedAccounts = accounts.map((account: any) => {
          let parentId =  account.parentId;
          // Fix self-referencing parentId
          if (parentId === account.id) {
            parentId = null;
          }
          return {
            ...account,
            parentId
          };
        });
        this.accountsSubject.next(processedAccounts);
        return processedAccounts;
      }),
      catchError(error => {
        console.error('Error fetching accounts:', error);
        return throwError(() => new Error('Failed to fetch accounts'));
      })
    );
  }

  getAccountById(id: number): Observable<Account | undefined> {
    return this.http.get<Account>(`${this.Url}/accounts/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching account ${id}:`, error);
        return throwError(() => new Error(`Failed to fetch account ${id}`));
      })
    );
  }

  getAccountByCode(code: string): Account | undefined {
    return this.accountsSubject.value.find(acc => acc.accountCode === code);
  }

  getCurrentAccounts(): Account[] {
    return this.accountsSubject.value;
  }

  createAccount(dto: CreateAccountDto): Observable<Account> {
    return this.http.post<Account>(`${this.Url}/CreateAccount`, dto, { headers: this.headers }).pipe(
      map(account => {
        // Set parentId for partial accounts
        if (!account.isMainAccount && account.mainAccountId) {
          account.parentId = account.mainAccountId;
        }
        // Update local state
        const currentAccounts = this.accountsSubject.value;
        this.accountsSubject.next([...currentAccounts, account]);
        this.refreshSubject.next();
        return account;
      }),
      // Re-throw the real HttpErrorResponse as-is (not a generic Error) -- CreateAccount returns
      // BadRequest(response.Message) with the actual business-validation reason (duplicate code,
      // parent not found, entity-link conflict, ...); swallowing it here would leave the UI unable
      // to show anything but a generic "failed" message. See AddAccountComponent.extractErrorMessage.
      catchError(error => {
        console.error('Error creating account:', error);
        return throwError(() => error);
      })
    );
  }

  updateAccount(dto: UpdateAccountDto): Observable<Account> {
    return this.http.put<Account>(`${this.Url}/UpdateAccount/${dto.id}`, dto).pipe(
      map(account => {
        // Set parentId for partial accounts
        if (!account.isMainAccount && account.mainAccountId) {
          account.parentId = account.mainAccountId;
        }
        // Update local state
        const currentAccounts = this.accountsSubject.value;
        const index = currentAccounts.findIndex(acc => acc.id === dto.id);
        if (index !== -1) {
          currentAccounts[index] = account;
          this.accountsSubject.next([...currentAccounts]);
        }
        this.refreshSubject.next();
        return account;
      }),
      // See createAccount's comment -- preserve the real error (e.g. AccountHasPostedEntries)
      // instead of replacing it with a generic message.
      catchError(error => {
        console.error(`Error updating account ${dto.id}:`, error);
        return throwError(() => error);
      })
    );
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.Url}/DeleteAccount/${id}`).pipe(
      map(() => {
        // Update local state
        const currentAccounts = this.accountsSubject.value;
        const filteredAccounts = currentAccounts.filter(acc => acc.id !== id);
        this.accountsSubject.next(filteredAccounts);
        this.refreshSubject.next();
      }),
      catchError(error => {
        console.error(`Error deleting account ${id}:`, error);
        return throwError(() => new Error(`Failed to delete account ${id}`));
      })
    );
  }

  // Journal Entry CRUD
  getJournalEntries(): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(`${this.Urljournal}/GetAll`).pipe(
      map(entries => {
        this.journalEntriesSubject.next(entries);
        return entries;
      }),
      catchError(error => {
        console.error('Error fetching journal entries:', error);
        return throwError(() => new Error('Failed to fetch journal entries'));
      })
    );
  }

  getJournalEntryById(id: number): Observable<JournalEntry | undefined> {
    return this.http.get<JournalEntry>(`${this.Urljournal}/GetById/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching journal entry ${id}:`, error);
        return throwError(() => new Error(`Failed to fetch journal entry ${id}`));
      })
    );
  }

  createJournalEntry(dto: CreateJournalEntryDto): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.Urljournal}/Create`, dto).pipe(
      map(entry => {
        // Update local stat
        const currentEntries = this.journalEntriesSubject.value;
        this.journalEntriesSubject.next([...currentEntries, entry]);
        return entry;
      }),
      catchError(error => {
        console.error('Error creating journal entry:', error);
        return throwError(() => new Error('Failed to create journal entry'));
      })
    );
  }

  updateJournalEntry(dto: UpdateJournalEntryDto): Observable<JournalEntry> {
    return this.http.put<JournalEntry>(`${this.Urljournal}/Update/${dto.id}`, dto).pipe(
      map(entry => {
        // Update local state
        const currentEntries = this.journalEntriesSubject.value;
        const index = currentEntries.findIndex(e => e.id === dto.id);
        if (index !== -1) {
          currentEntries[index] = entry;
          this.journalEntriesSubject.next([...currentEntries]);
        }
        return entry;
      }),
      catchError(error => {
        console.error(`Error updating journal entry ${dto.id}:`, error);
        return throwError(() => new Error(`Failed to update journal entry ${dto.id}`));
      })
    );
  }

  deleteJournalEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.Urljournal}/Delete/${id}`).pipe(
      map(() => {
        // Update local state
        const currentEntries = this.journalEntriesSubject.value;
        const filteredEntries = currentEntries.filter(entry => entry.id !== id);
        this.journalEntriesSubject.next(filteredEntries);
      }),
      catchError(error => {
        console.error(`Error deleting journal entry ${id}:`, error);
        return throwError(() => new Error(`Failed to delete journal entry ${id}`));
      })
    );
  }

  // Opening Balance Financial CRUD
  getOpeningBalancesFinancial(): Observable<OpeningBalanceFinancial[]> {
    return this.http.get<OpeningBalanceFinancial[]>(`${this.Url}/opening-balances-financial`).pipe(
      catchError(error => {
        console.error('Error fetching opening balances financial:', error);
        return throwError(() => new Error('Failed to fetch opening balances financial'));
      })
    );
  }

  createOpeningBalanceFinancial(dto: Omit<OpeningBalanceFinancial, 'id'>): Observable<OpeningBalanceFinancial> {
    return this.http.post<OpeningBalanceFinancial>(`${this.Url}/opening-balances-financial`, dto, { headers: this.headers }).pipe(
      catchError(error => {
        console.error('Error creating opening balance financial:', error);
        return throwError(() => new Error('Failed to create opening balance financial'));
      })
    );
  }

  updateOpeningBalanceFinancial(id: number, dto: OpeningBalanceFinancial): Observable<OpeningBalanceFinancial> {
    return this.http.put<OpeningBalanceFinancial>(`${this.Url}/opening-balances-financial/${id}`, dto, { headers: this.headers }).pipe(
      catchError(error => {
        console.error(`Error updating opening balance financial ${id}:`, error);
        return throwError(() => new Error(`Failed to update opening balance financial ${id}`));
      })
    );
  }

  deleteOpeningBalanceFinancial(id: number): Observable<void> {
    return this.http.delete<void>(`${this.Url}/opening-balances-financial/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting opening balance financial ${id}:`, error);
        return throwError(() => new Error(`Failed to delete opening balance financial ${id}`));
      })
    );
  }

  // Opening Balance Inventory CRUD
  getOpeningBalancesInventory(): Observable<OpeningBalanceInventory[]> {
    return this.http.get<OpeningBalanceInventory[]>(`${this.Urlopeningbalances}/GetAll`).pipe(
      catchError(error => {
        console.error('Error fetching opening balances inventory:', error);
        return throwError(() => new Error('Failed to fetch opening balances inventory'));
      })
    );
  }

  createOpeningBalanceInventory(dto: Omit<OpeningBalanceInventory, 'id'>): Observable<OpeningBalanceInventory> {
    console.log('Creating Opening Balance Inventory with DTO:', dto);
    return this.http.post<OpeningBalanceInventory>(`${this.Urlopeningbalances}/Create`, dto, { headers: this.headers }).pipe(
      catchError(error => {
        console.error('Error creating opening balance inventory:', error);
        return throwError(() => new Error('Failed to create opening balance inventory'));
      })
    );
  }

  updateOpeningBalanceInventory(id: number, dto: OpeningBalanceInventory): Observable<OpeningBalanceInventory> {
    return this.http.put<OpeningBalanceInventory>(`${this.Urlopeningbalances}/Update/${id}`, dto, { headers: this.headers }).pipe(
      catchError(error => {
        console.error(`Error updating opening balance inventory ${id}:`, error);
        return throwError(() => new Error(`Failed to update opening balance inventory ${id}`));
      })
    );
  }

  deleteOpeningBalanceInventory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.Urlopeningbalances}/Delete/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting opening balance inventory ${id}:`, error);
        return throwError(() => new Error(`Failed to delete opening balance inventory ${id}`));
      })
    );
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
    getHierarchicalAccounts(): Observable<AccountNode[]> {
    return this.http.get<AccountNode[]>(`${this.Url}/hierarchical`);
  }

  /**
   * Get accounts by category
   */
  getAccountsByCategory(category: string): Observable<AccountNode[]> {
    return this.http.get<AccountNode[]>(`${this.Url}/category/${category}`);
  }

  /**
   * Centralized "posting/leaf accounts only" lookup -- every Debit/Credit account selector must
   * call this instead of getAccounts()/getAccountsByCategory(), both of which include parent/
   * grouping accounts. Optional category narrows by the same "debit"/"credit"/"cash-bank"/
   * "supplier" values as getAccountsByCategory(). Backend is still the final authority (rejects
   * a parent account on Create/Update even if this lookup is bypassed) -- this only drives the UI.
   */
  getPostableAccounts(category?: string): Observable<Account[]> {
    const url = category ? `${this.Url}/accounts/postable?category=${category}` : `${this.Url}/accounts/postable`;
    return this.http.get<Account[]>(url, { headers: this.headers });
  }

  /**
   * Preview of the next auto-generated account code under the given parent (omit for a new root
   * account). Purely informational -- CreateAccount re-derives and validates the real code at
   * save time, so this never reserves a code.
   */
  getNextAccountCode(parentId: number | null): Observable<string> {
    const url = parentId != null ? `${this.Url}/accounts/next-code?parentId=${parentId}` : `${this.Url}/accounts/next-code`;
    return this.http.get<string>(url, { headers: this.headers });
  }

  /**
   * Read-only preview of the default account a Debit/Credit field should be pre-populated with
   * ("default account + manual override" UX standard). Wraps GET api/Accounting/resolve-default,
   * the single backend dispatch point over AccountResolutionService -- every screen that needs a
   * default calls THIS, not a locally re-implemented resolution rule. A resolution failure comes
   * back as a normal ApiResponse (Data.error set, Data.accountId null/undefined), not an HTTP
   * error -- callers should leave the field blank and let the user pick manually in that case.
   */
  resolveDefaultAccount(request: ResolveDefaultAccountRequest): Observable<DefaultAccountResult> {
    const params: Record<string, string> = { kind: String(request.kind) };
    if (request.storeId != null) params['storeId'] = String(request.storeId);
    if (request.partyId != null) params['partyId'] = String(request.partyId);
    if (request.requestedAccountId != null) params['requestedAccountId'] = String(request.requestedAccountId);
    if (request.isCapitalized != null) params['isCapitalized'] = String(request.isCapitalized);
    if (request.expenseCategory != null) params['expenseCategory'] = request.expenseCategory;
    if (request.isCash != null) params['isCash'] = String(request.isCash);

    const query = new URLSearchParams(params).toString();
    return this.http.get<{ success: boolean; data: DefaultAccountResult }>(`${this.Url}/resolve-default?${query}`).pipe(
      map(response => response.data),
      catchError(() => of({ accountId: null, error: 'Failed to resolve the default account.' }))
    );
  }

  /**
   * Create journal entries for sales return
   */
  createSalesReturnEntry(salesReturn: any): import('@/src/models/sales-return.model').JournalEntry[] {
    // This is a placeholder implementation
    // In a real application, you'd determine the appropriate accounts based on business logic
    const entry1: import('@/src/models/sales-return.model').JournalEntry = {
      id: 0,
      salesReturnId: salesReturn.id,
      accountCode: '', // Sales Returns account
      accountName: '',
      debit: salesReturn.refundableAmount,
      credit: 0,
      entryDate: new Date(),
      reference: salesReturn.returnNo,
      description: 'Sales Return'
    };

    const entry2: import('@/src/models/sales-return.model').JournalEntry = {
      id: 0,
      salesReturnId: salesReturn.id,
      accountCode: '', // Accounts Receivable or Cash
      accountName: '',
      debit: 0,
      credit: salesReturn.refundableAmount,
      entryDate: new Date(),
      reference: salesReturn.returnNo,
      description: 'Refund'
    };

    return [entry1, entry2];
  }

  /**
   * Create journal entries for purchase return
   */
  createPurchaseReturnEntry(purchaseReturn: any): PurchaseReturnJournalEntry[] {
    // This is a placeholder implementation
    // In a real application, you'd determine the appropriate accounts based on business logic
    const entry1: PurchaseReturnJournalEntry = {
      id: 0,
      purchaseReturnId: purchaseReturn.id,
      accountCode: '', // Accounts Payable
      accountName: '',
      debit: purchaseReturn.refundableAmount,
      credit: 0,
      entryDate: new Date(),
      reference: purchaseReturn.returnNo,
      description: 'Purchase Return'
    };

    const entry2: PurchaseReturnJournalEntry = {
      id: 0,
      purchaseReturnId: purchaseReturn.id,
      accountCode: '', // Inventory or Purchase Returns
      accountName: '',
      debit: 0,
      credit: purchaseReturn.refundableAmount,
      entryDate: new Date(),
      reference: purchaseReturn.returnNo,
      description: 'Return to Inventory'
    };

    return [entry1, entry2];
  }
}