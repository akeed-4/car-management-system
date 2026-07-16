import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { DxTreeListModule, DxTemplateModule, DxTemplateHost } from 'devextreme-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AccountingService } from '../accounting.service';
import { Account } from '../models';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '@/src/services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

@Component({
  selector: 'app-chart-of-accounts-tree',
  standalone: true,
  imports: [
    CommonModule,
    DxTreeListModule,
    DxTemplateModule,
    TranslateModule
  ],
  providers: [DxTemplateHost],
  templateUrl: './chart-of-accounts-tree.component.html',
  styleUrl: './chart-of-accounts-tree.component.css'
})
export class ChartOfAccountsTreeComponent implements OnInit, OnDestroy {
  // Signals for reactive state management
  accounts = signal<Account[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  maxLevel = signal<number | null>(null);

  // Form properties
  isEditing = false;
  editingAccount: Account | null = null;
  parentId: number | null = null;

  // Computed signal for processed accounts data
  processedAccounts = computed(() => {
    const accounts = this.accounts();
    const maxLevel = this.maxLevel();
    if (accounts.length === 0) return [];

    // Use accountLevel from data instead of computing from hierarchy
    const hasChildrenMap = new Map<number, boolean>();

    // Determine hasChildren based on whether there are accounts with higher accountLevel that could be children
    accounts.forEach(account => {
      const potentialChildren = accounts.filter(acc => acc.accountLevel === account.accountLevel + 1 && acc.parentId === account.id);
      if (potentialChildren.length > 0) {
        hasChildrenMap.set(account.id, true);
      }
    });

    let filteredAccounts = accounts
      // Auto-generated Customer/Supplier accounts are accounting-only linkage records,
      // not meant to be browsed or manually selected in the tree.
      .filter(account => !account.isSystemGenerated)
      .map(account => ({
        ...account,
        level: account.accountLevel,
        translatedName: this.translateAccountName(account.accountNameEn),
        hasChildren: hasChildrenMap.get(account.id) || false
      }));

    // Filter by max level if set
    if (maxLevel !== null) {
      filteredAccounts = filteredAccounts.filter(account => account.level <= maxLevel);
    }

    return filteredAccounts;
  });

  private destroy$ = new Subject<void>();

  constructor(
    public translate: TranslateService,
    private accountingService: AccountingService,
    private router: Router,
    private toastService: NotificationService
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
      next: (result: any) => {
        const accounts = result.data || result;
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
      this.accountingService.deleteAccount(account.id).subscribe({
        next: () => {
          this.toastService.showSuccess(this.translate.instant('ACCOUNTING.ACCOUNT_DELETED'));
          this.loadAccounts();
        },
        error: (error) => {
         this.toastService.showError(this.translate.instant('ACCOUNTING.ERROR_DELETING_ACCOUNT'));
        }
      });
    }
  }
isaccountDeletable(account: Account): boolean {
    // An account is deletable if it has no children
    const accounts = this.accounts();
    const hasChildren = accounts.some(acc => acc.parentId === account.id);
    return !hasChildren;
  }

  // DevExtreme buttons can use a function for `visible` which receives the row context.
  isDeleteVisible = (e: any): boolean => {
    const account: Account = e && e.row && e.row.data ? e.row.data : e;
    if (!account || !account.id) return false;
    return this.isaccountDeletable(account);
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

  onMaxLevelChange(level: number | null) {
    this.maxLevel.set(level);
  }
}
