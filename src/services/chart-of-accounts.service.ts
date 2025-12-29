import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { AccountNode, CreateAccountDto, UpdateAccountDto, DeleteAccountDto } from '../types/account-node.model';

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
        this.loadSampleData();
      }
    });
  }

  /**
   * Load sample hierarchical chart of accounts data
   */
  private loadSampleData(): void {
    const sampleData: AccountNode[] = [
      // ASSETS (ID: 1)
      {
        id: 1,
        parentId: null,
        code: '1000',
        name: 'الموجودات',
        type: 'PARENT',
        balance: 500000
      },
      {
        id: 2,
        parentId: 1,
        code: '1100',
        name: 'النقد والبنوك',
        type: 'PARENT',
        balance: 250000
      },
      {
        id: 3,
        parentId: 2,
        code: '1110',
        name: 'النقد بالصندوق',
        type: 'ACCOUNT',
        balance: 50000
      },
      {
        id: 4,
        parentId: 2,
        code: '1120',
        name: 'الحساب البنكي - البنك الأول',
        type: 'ACCOUNT',
        balance: 200000
      },
      {
        id: 5,
        parentId: 1,
        code: '1200',
        name: 'الذمم المدينة',
        type: 'PARENT',
        balance: 150000
      },
      {
        id: 6,
        parentId: 5,
        code: '1210',
        name: 'العملاء',
        type: 'ACCOUNT',
        balance: 100000
      },
      {
        id: 7,
        parentId: 5,
        code: '1220',
        name: 'أوراق قبض',
        type: 'ACCOUNT',
        balance: 50000
      },
      {
        id: 8,
        parentId: 1,
        code: '1300',
        name: 'المخزون',
        type: 'PARENT',
        balance: 100000
      },
      {
        id: 9,
        parentId: 8,
        code: '1310',
        name: 'السيارات الجديدة',
        type: 'ACCOUNT',
        balance: 60000
      },
      {
        id: 10,
        parentId: 8,
        code: '1320',
        name: 'السيارات المستعملة',
        type: 'ACCOUNT',
        balance: 40000
      },

      // LIABILITIES (ID: 20)
      {
        id: 20,
        parentId: null,
        code: '2000',
        name: 'الالتزامات',
        type: 'PARENT',
        balance: 150000
      },
      {
        id: 21,
        parentId: 20,
        code: '2100',
        name: 'الذمم الدائنة',
        type: 'PARENT',
        balance: 80000
      },
      {
        id: 22,
        parentId: 21,
        code: '2110',
        name: 'الموردون',
        type: 'ACCOUNT',
        balance: 80000
      },
      {
        id: 23,
        parentId: 20,
        code: '2200',
        name: 'القروض والسلفيات',
        type: 'PARENT',
        balance: 70000
      },
      {
        id: 24,
        parentId: 23,
        code: '2210',
        name: 'قرض بنكي طويل الأجل',
        type: 'ACCOUNT',
        balance: 70000
      },

      // EQUITY (ID: 30)
      {
        id: 30,
        parentId: null,
        code: '3000',
        name: 'حقوق الملكية',
        type: 'PARENT',
        balance: 350000
      },
      {
        id: 31,
        parentId: 30,
        code: '3100',
        name: 'رأس المال',
        type: 'ACCOUNT',
        balance: 300000
      },
      {
        id: 32,
        parentId: 30,
        code: '3200',
        name: 'الأرباح المحتجزة',
        type: 'ACCOUNT',
        balance: 50000
      },

      // REVENUE (ID: 40)
      {
        id: 40,
        parentId: null,
        code: '4000',
        name: 'الإيرادات',
        type: 'PARENT',
        balance: 1500000
      },
      {
        id: 41,
        parentId: 40,
        code: '4100',
        name: 'مبيعات السيارات',
        type: 'PARENT',
        balance: 1200000
      },
      {
        id: 42,
        parentId: 41,
        code: '4110',
        name: 'مبيعات سيارات جديدة',
        type: 'ACCOUNT',
        balance: 800000
      },
      {
        id: 43,
        parentId: 41,
        code: '4120',
        name: 'مبيعات سيارات مستعملة',
        type: 'ACCOUNT',
        balance: 400000
      },
      {
        id: 44,
        parentId: 40,
        code: '4200',
        name: 'إيرادات أخرى',
        type: 'PARENT',
        balance: 300000
      },
      {
        id: 45,
        parentId: 44,
        code: '4210',
        name: 'إيرادات الصيانة والإصلاح',
        type: 'ACCOUNT',
        balance: 200000
      },
      {
        id: 46,
        parentId: 44,
        code: '4220',
        name: 'إيرادات الفوائد',
        type: 'ACCOUNT',
        balance: 100000
      },

      // EXPENSES (ID: 50)
      {
        id: 50,
        parentId: null,
        code: '5000',
        name: 'المصروفات',
        type: 'PARENT',
        balance: 800000
      },
      {
        id: 51,
        parentId: 50,
        code: '5100',
        name: 'تكلفة البضاعة المباعة',
        type: 'PARENT',
        balance: 500000
      },
      {
        id: 52,
        parentId: 51,
        code: '5110',
        name: 'تكاليف السيارات',
        type: 'ACCOUNT',
        balance: 400000
      },
      {
        id: 53,
        parentId: 51,
        code: '5120',
        name: 'تكاليف النقل والتخزين',
        type: 'ACCOUNT',
        balance: 100000
      },
      {
        id: 54,
        parentId: 50,
        code: '5200',
        name: 'المصروفات الإدارية',
        type: 'PARENT',
        balance: 200000
      },
      {
        id: 55,
        parentId: 54,
        code: '5210',
        name: 'رواتب الموظفين',
        type: 'ACCOUNT',
        balance: 120000
      },
      {
        id: 56,
        parentId: 54,
        code: '5220',
        name: 'إيجار المكتب',
        type: 'ACCOUNT',
        balance: 40000
      },
      {
        id: 57,
        parentId: 54,
        code: '5230',
        name: 'مصروفات الكهرباء والماء',
        type: 'ACCOUNT',
        balance: 25000
      },
      {
        id: 58,
        parentId: 50,
        code: '5300',
        name: 'المصروفات البيعية',
        type: 'PARENT',
        balance: 100000
      },
      {
        id: 59,
        parentId: 58,
        code: '5310',
        name: 'الإعلانات والتسويق',
        type: 'ACCOUNT',
        balance: 60000
      },
      {
        id: 60,
        parentId: 58,
        code: '5320',
        name: 'عمولات البيع',
        type: 'ACCOUNT',
        balance: 40000
      }
    ];

    this.accountsSource.next(sampleData);
  }

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
