import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Account, JournalEntry, CreateAccountDto, UpdateAccountDto, CreateJournalEntryDto, UpdateJournalEntryDto } from './models';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private journalEntriesSubject = new BehaviorSubject<JournalEntry[]>([]);

  public accounts$ = this.accountsSubject.asObservable();
  public journalEntries$ = this.journalEntriesSubject.asObservable();

  constructor(private http: HttpClient) {
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
    // Sample accounts
    const sampleAccounts: Account[] = [
      { id: 1, code: '1000', name: 'Cash', type: 'ASSET', balance: 50000, isActive: true, createdDate: new Date(), updatedDate: new Date() },
      { id: 2, code: '1100', name: 'Accounts Receivable', type: 'ASSET', balance: 25000, isActive: true, createdDate: new Date(), updatedDate: new Date() },
      { id: 3, code: '2000', name: 'Accounts Payable', type: 'LIABILITY', balance: 15000, isActive: true, createdDate: new Date(), updatedDate: new Date() },
      { id: 4, code: '3000', name: 'Owner Equity', type: 'EQUITY', balance: 60000, isActive: true, createdDate: new Date(), updatedDate: new Date() },
      { id: 5, code: '4000', name: 'Sales Revenue', type: 'REVENUE', balance: 0, isActive: true, createdDate: new Date(), updatedDate: new Date() },
      { id: 6, code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', balance: 0, isActive: true, createdDate: new Date(), updatedDate: new Date() }
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
}