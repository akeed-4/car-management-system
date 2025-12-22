import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Account, JournalEntry, CreateAccountDto, UpdateAccountDto, CreateJournalEntryDto, UpdateJournalEntryDto } from './models';
import { environment } from '@/src/environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private journalEntriesSubject = new BehaviorSubject<JournalEntry[]>([]);
  private refreshSubject = new Subject<void>();
  private Url = environment.origin + 'api/Accounting';
  private Urljournal = environment.origin + 'api/JournalEntries';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  public accounts$ = this.accountsSubject.asObservable();
  public journalEntries$ = this.journalEntriesSubject.asObservable();
  public refresh$ = this.refreshSubject.asObservable();

  constructor(private http: HttpClient, private translate: TranslateService) {
    this.getAccounts()
    this.getJournalEntries()
    // Remove loadSampleData() call to use real API
  }

  // Account CRUD
  getAccounts(): Observable<Account[]> {
    console.log('Making GET request to:', `${this.Url}/accounts`);
    return this.http.get<Account[]>(`${this.Url}/accounts`, { headers: this.headers }).pipe(
      map(accounts => {
        console.log('Received accounts:', accounts);
        // Set parentId for partial accounts
        const processedAccounts = accounts.map(account => ({
          ...account,
          parentId: !account.isMainAccount && account.mainAccountId ? account.mainAccountId : account.parentId
        }));
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
    console.log('Making POST request to:', `${this.Url}/CreateAccount`);
    console.log('Sending DTO:', dto);
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
      catchError(error => {
        return throwError(() => new Error('Failed to create account'));
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
      catchError(error => {
        console.error(`Error updating account ${dto.id}:`, error);
        return throwError(() => new Error(`Failed to update account ${dto.id}`));
      })
    );
  }

  deleteAccount(id: number): Observable<void> {
    alert('Deleting account with id: ' + id);
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