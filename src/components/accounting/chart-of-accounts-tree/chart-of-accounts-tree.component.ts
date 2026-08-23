import { Component, OnInit, OnDestroy, ViewChild, signal, computed } from '@angular/core';
import { DxTreeListModule, DxTemplateModule, DxTemplateHost, DxTreeListComponent } from 'devextreme-angular';
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
import { saveChartOfAccountsTreeState, readChartOfAccountsTreeState } from '../chart-of-accounts-tree-state';

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
  @ViewChild(DxTreeListComponent, { static: false }) treeList!: DxTreeListComponent;

  // Signals for reactive state management
  accounts = signal<Account[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  maxLevel = signal<number | null>(null);

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
    this.loadAccounts(/* restoreTreeState */ true);

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

  loadAccounts(restoreTreeState = false) {
    this.isLoading.set(true);
    this.error.set(null);

    this.accountingService.getAccounts().subscribe({
      next: (result: any) => {
        const accounts = result.data || result;
        this.accounts.set(accounts);
        this.isLoading.set(false);
        if (restoreTreeState) {
          // Wait a tick for the tree list to render the freshly-loaded rows before we ask it to
          // expand/select/scroll -- DevExtreme's instance methods are no-ops on rows not yet drawn.
          setTimeout(() => this.restoreTreeState(), 0);
        }
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.error.set('Failed to load accounts. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  /** Requirement 6: called right before navigating away to Add/Edit, so the tree can put itself
   *  back the way the user left it when they return to this page. `focusRowKey` is the account to
   *  highlight on return -- the parent being added under, or the account being edited. */
  private saveTreeState(focusRowKey: number | null) {
    const instance = this.treeList?.instance;
    if (!instance) return;

    saveChartOfAccountsTreeState({
      expandedRowKeys: instance.getVisibleRows()
        .filter((row: any) => row.node?.expanded)
        .map((row: any) => row.key),
      selectedRowKey: instance.getSelectedRowKeys()[0] ?? null,
      focusRowKey
    });
  }

  /** Restores expanded nodes and selection saved by saveTreeState, and selects focusRowKey
   *  (typically the account just created or edited) once the tree can display it. */
  private restoreTreeState() {
    const state = readChartOfAccountsTreeState();
    if (!state) return;

    const instance = this.treeList?.instance;
    if (!instance) return;

    for (const key of state.expandedRowKeys ?? []) {
      instance.expandRow(key);
    }

    // DevExtreme's own selection highlight is the visible "here's the row that matters" cue --
    // selecting focusRowKey (the parent just added under, or the account just edited) surfaces it
    // without a separate custom highlight/timer to keep in sync with the tree's real repaint cycle.
    const rowToSelectAndFocus = state.focusRowKey ?? state.selectedRowKey;
    if (rowToSelectAndFocus != null) {
      instance.selectRows([rowToSelectAndFocus], false);
      instance.navigateToRow(rowToSelectAndFocus);
    }
  }

  onAddSubAccount(e: any) {
    const accountId = e.row.data.id;
    // Preserve where the user is in the tree, and come back focused on the parent they were
    // adding under -- the new child will appear alongside it once created.
    this.saveTreeState(accountId);
    this.router.navigate(['/accounts/chart-of-accounts-new'], {
      queryParams: { parentId: accountId, mode: 'add' }
    });
  }

  onEditAccount(accountOrEvent: any) {
    // DevExtreme sometimes passes an event object; support both event and Account
    const account: Account = accountOrEvent && accountOrEvent.row && accountOrEvent.row.data
      ? accountOrEvent.row.data
      : accountOrEvent;

    if (!account || !account.id) {
      console.error('Edit navigation failed: account id is missing', accountOrEvent);
      return;
    }

    this.saveTreeState(account.id);
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
          // Surface the backend's specific reason (e.g. "has posted journal entries") when
          // available, instead of only a generic failure message.
          const backendMessage = typeof error?.error === 'string' ? error.error : null;
          this.toastService.showError(backendMessage || this.translate.instant('ACCOUNTING.ERROR_DELETING_ACCOUNT'));
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
