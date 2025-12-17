import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { DxTreeListModule } from 'devextreme-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AccountingService } from '../accounting.service';
import { Account } from '../models';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chart-of-accounts-tree',
  templateUrl: './chart-of-accounts-tree.component.html',
  styleUrl: './chart-of-accounts-tree.component.css'
})
export class ChartOfAccountsTreeComponent implements OnInit, OnDestroy {
  // Signals for reactive state management
  accounts = signal<Account[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed signal for processed accounts data
  processedAccounts = computed(() => {
    const accounts = this.accounts();
    return accounts.map(account => ({
      ...account,
      level: this.getAccountLevel(account),
      translatedName: this.translateAccountName(account.accountNameEn),
      hasChildren: accounts.some(acc => acc.parentId === account.id)
    }));
  });

  private destroy$ = new Subject<void>();

  // DevExtreme TreeList columns configuration with dynamic translation
  columns: any[] = [];

  constructor(
    private accountingService: AccountingService,
    private translate: TranslateService,
    private router: Router
  ) {
    this.onAddSubAccount = this.onAddSubAccount.bind(this);
    this.onEditAccount = this.onEditAccount.bind(this);
    this.onDeleteAccount = this.onDeleteAccount.bind(this);
  }

  ngOnInit() {
    this.initializeColumns();

    // Load accounts data using effect
    this.loadAccounts();

    // Subscribe to language changes to update column translations and refresh data
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.initializeColumns();
      // Force refresh of accounts data to update translated names
      this.loadAccounts();
    });

    // Subscribe to refresh events from service
    this.accountingService.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadAccounts();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeColumns() {
    this.columns = [
      {
        dataField: 'level',
        caption: this.translate.instant('ACCOUNTING.LEVEL'),
        width: 100,
        alignment: 'center'
      },
      {
        dataField: 'code',
        caption: this.translate.instant('ACCOUNTING.ACCOUNT_CODE'),
        width: 150,
        cssClass: 'code-column'
      },
      {
        dataField: 'translatedName',
        caption: this.translate.instant('ACCOUNTING.ACCOUNT_NAME')
      },
      {
        dataField: 'accountTypeId',
        caption: this.translate.instant('ACCOUNTING.ACCOUNT_TYPE'),
        lookup: {
          dataSource: [
            { value: 1, display: this.translate.instant('ACCOUNTING.TYPE_ASSET') },
            { value: 2, display: this.translate.instant('ACCOUNTING.TYPE_LIABILITY') },
            { value: 3, display: this.translate.instant('ACCOUNTING.TYPE_EQUITY') },
            { value: 4, display: this.translate.instant('ACCOUNTING.TYPE_REVENUE') },
            { value: 5, display: this.translate.instant('ACCOUNTING.TYPE_EXPENSE') }
          ],
          valueExpr: 'value',
          displayExpr: 'display'
        }
      },
      {
        dataField: 'balance',
        caption: this.translate.instant('ACCOUNTING.BALANCE'),
        dataType: 'number',
        format: { type: 'currency', currency: 'SAR', precision: 2 },
      },
      {
        dataField: 'isActive',
        caption: this.translate.instant('ACCOUNTING.STATUS'),
        lookup: {
          dataSource: [
            { value: true, display: this.translate.instant('ACCOUNTING.ACTIVE') },
            { value: false, display: this.translate.instant('ACCOUNTING.INACTIVE') }
          ],
          valueExpr: 'value',
          displayExpr: 'display'
        }
      },
      {
        caption: this.translate.instant('ACCOUNTING.ACTIONS'),
        type: 'buttons',
        width: 150,
        buttons: [
          {
            hint: this.translate.instant('ACCOUNTING.ADD_ACCOUNT'),
            icon: 'add',
            onClick: (e: any) => this.onAddSubAccount(e.row.data)
          },
          {
            hint: this.translate.instant('ACCOUNTING.EDIT_ACCOUNT'),
            icon: 'edit',
            onClick: (e: any) => this.onEditAccount(e.row.data)
          },
          {
            hint: this.translate.instant('ACCOUNTING.DELETE_ACCOUNT'),
            icon: 'trash',
            onClick: (e: any) => this.onDeleteAccount(e.row.data)
          }
        ]
      }
    ];
  }

  loadAccounts() {
    this.isLoading.set(true);
    this.error.set(null);

    this.accountingService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.isLoading.set(false);
        console.log('Accounts loaded:', accounts);
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.error.set('Failed to load accounts. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  getAccountLevel(account: Account): number {
    let level = 1;
    let current = account;
    const accounts = this.accounts(); // Get current accounts from signal
    while (current.parentId) {
      level++;
      // Find parent account
      current = accounts.find(acc => acc.id === current.parentId)!;
      if (!current) break;
    }
    return level;
  }

  onAddSubAccount(account: Account) {
    // Navigate to add sub-account form with parentId as query parameter
    console.log('Add sub-account for:', account);
    this.router.navigate(['/accounts/chart-of-accounts-new'], {
      queryParams: { parentId: account.id, mode: 'add' }
    });
  }

  onEditAccount(account: Account) {
    console.log('Edit account clicked:', account);
    // Navigate to edit form with account ID as route parameter
    this.router.navigate(['/accounts/chart-of-accounts-new', account.id], {
      queryParams: { mode: 'edit' }
    });
  }

  onDeleteAccount(account: Account) {
    if (confirm(this.translate.instant('ACCOUNTING.CONFIRM_DELETE'))) {
      this.accountingService.deleteAccount(account.id).subscribe();
    }
  }

  translateAccountName(accountName: string): string {
    return this.accountingService.translateAccountName(accountName);
  }

  getLevelIcon(level: number): string {
    const icons: { [key: number]: string } = {
      1: 'folder',
      2: 'folder',
      3: 'folder',
      4: 'activefolder',
      5: 'activefolder'
    };
    return icons[level] || 'folder';
  }

  getLevelColor(level: number): string {
    const colors: { [key: number]: string } = {
      1: '#1976D2',
      2: '#2196F3',
      3: '#64B5F6',
      4: '#90CAF9',
      5: '#BBDEFB'
    };
    return colors[level] || '#1976D2';
  }

  hasChildren(account: Account): boolean {
    const accounts = this.accounts(); // Get current accounts from signal
    return accounts.some(acc => acc.parentId === account.id);
  }
}
