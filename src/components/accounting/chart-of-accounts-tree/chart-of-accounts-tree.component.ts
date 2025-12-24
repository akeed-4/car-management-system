import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { DxTreeListModule, DxTemplateModule } from 'devextreme-angular';
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
  standalone: true,
  imports: [
    CommonModule,
    DxTreeListModule,
    DxTemplateModule,
    TranslateModule
  ],
  templateUrl: './chart-of-accounts-tree.component.html',
  styleUrl: './chart-of-accounts-tree.component.css'
})
export class ChartOfAccountsTreeComponent implements OnInit, OnDestroy {
  // Signals for reactive state management
  accounts = signal<Account[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Form properties
  isEditing = false;
  editingAccount: Account | null = null;
  parentId: number | null = null;

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

  constructor(
    public translate: TranslateService,
    private accountingService: AccountingService,
    private router: Router
  ) {
    this.onAddSubAccount = this.onAddSubAccount.bind(this);
    this.onEditAccount = this.onEditAccount.bind(this);
    this.onDeleteAccount = this.onDeleteAccount.bind(this);
  }

  ngOnInit() {
    this.loadAccounts();

    // Subscribe to language changes to refresh data with updated translations
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
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

  loadAccounts() {
    this.isLoading.set(true);
    this.error.set(null);

    this.accountingService.getAccounts().subscribe({
      next: (accounts:any) => {
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

  onAddSubAccount(e: any) {
    const accountId = e.row.data.id;
    // Navigate to add sub-account form with parentId as query parameter
    console.log('Add sub-account for id:', accountId);
    this.router.navigate(['/accounts/chart-of-accounts-new'], {
      queryParams: { parentId: accountId, mode: 'add' }
    });
  }

  onEditAccount(accountOrEvent: any) {
    // DevExtreme sometimes passes an event object; support both event and Account
    const account: Account = accountOrEvent && accountOrEvent.row && accountOrEvent.row.data
      ? accountOrEvent.row.data
      : accountOrEvent;

    console.log('Edit account clicked:', account);
    if (!account || !account.id) {
      console.error('Edit navigation failed: account id is missing', accountOrEvent);
      return;
    }

    // Navigate to edit form with account ID as route parameter
    this.router.navigate(['/accounts/chart-of-accounts-new', account.id], {
      queryParams: { mode: 'edit' }
    });
  }

  onDeleteAccount(accountOrEvent: any) {
        const account: Account = accountOrEvent && accountOrEvent.row && accountOrEvent.row.data
      ? accountOrEvent.row.data
      : accountOrEvent;
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
