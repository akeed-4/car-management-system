import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AccountNode, CreateAccountDto, UpdateAccountDto, DeleteAccountDto } from '../models/account-node.model';

@Injectable({
  providedIn: 'root'
})
export class ChartOfAccountsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/chart-of-accounts';

  // Signals for state management
  accountsSource = new BehaviorSubject<AccountNode[]>([]);
  accounts$ = this.accountsSource.asObservable();

  constructor() {
    // Load accounts from API on initialization
    this.loadAccounts();
  }

  /**
   * Load accounts from API
   */
  private loadAccounts(): void {
    this.http.get<AccountNode[]>(this.apiUrl).subscribe({
      next: (accounts) => {
        this.accountsSource.next(accounts);
      },
      error: (error) => {
        console.error('Failed to load accounts from API:', error);
        // Fallback to sample data if API fails
      }
    });
  }

  /**
   * Load sample hierarchical chart of accounts data
   */
  

  /**
   * Get all chart of accounts
   */
  getAccounts(): Observable<AccountNode[]> {
    return this.http.get<AccountNode[]>(this.apiUrl);
  }

  /**
   * Get account by ID
   */
  getAccountById(id: number): Observable<AccountNode> {
    return this.http.get<AccountNode>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new account
   */
  createAccount(account: CreateAccountDto): Observable<AccountNode> {
    return this.http.post<AccountNode>(`${this.apiUrl}`, account);
  }

  /**
   * Update existing account
   */
  updateAccount(account: UpdateAccountDto): Observable<AccountNode> {
    return this.http.put<AccountNode>(`${this.apiUrl}/${account.id}`, account);
  }

  /**
   * Delete account
   */
  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get hierarchical structure (flattened for TreeList)
   */

}

interface AccountNodeFlat extends AccountNode {
  expanded?: boolean;
}
