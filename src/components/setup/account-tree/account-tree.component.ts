import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DxTreeListModule, DxButtonModule, DxPopupModule, DxFormModule, DxTextBoxModule, DxSelectBoxModule } from 'devextreme-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CurrencyPipe } from '@angular/common';
import { ChartOfAccountsService } from '../../../services/chart-of-accounts.service';
import { AccountNode, CreateAccountDto, UpdateAccountDto } from '../../../models/account-node.model';

@Component({
  selector: 'app-account-tree',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    DxTreeListModule,
    DxButtonModule,
    DxPopupModule,
    DxFormModule,
    DxTextBoxModule,
    DxSelectBoxModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './account-tree.component.html',
  styleUrl: './account-tree.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountTreeComponent implements OnInit {
  private chartOfAccountsService = inject(ChartOfAccountsService);
  private fb = inject(FormBuilder);

  // Data
  accountsData = signal<AccountNode[]>([]);
  selectedAccount = signal<AccountNode | null>(null);

  // UI State
  isAddDialogOpen = signal(false);
  isEditDialogOpen = signal(false);
  isDeleteDialogOpen = signal(false);
  isLoading = signal(false);

  // Forms
  addAccountForm!: FormGroup;
  editAccountForm!: FormGroup;

  // TreeList configuration
  treeListColumns = [
    {
      dataField: 'code',
      caption: 'CHART_OF_ACCOUNTS.CODE',
      dataType: 'string',
      width: 120,
      alignment: 'center'
    },
    {
      dataField: 'type',
      caption: 'CHART_OF_ACCOUNTS.TYPE',
      dataType: 'string',
      width: 140,
      calculateCellValue: (rowData: AccountNode) => {
        return rowData.type === 'PARENT' ? 'CHART_OF_ACCOUNTS.PARENT_ACCOUNT' : 'CHART_OF_ACCOUNTS.LEAF_ACCOUNT';
      }
    },
    {
      dataField: 'balance',
      caption: 'CHART_OF_ACCOUNTS.BALANCE',
      dataType: 'number',
      width: 160,
      format: 'currency',
      alignment: 'right'
    }
  ];

  accountTypeOptions = [
    { id: 'PARENT', name: 'Parent Account' },
    { id: 'ACCOUNT', name: 'Leaf Account' }
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.loadAccounts();
  }

  /**
   * Initialize form groups
   */
  private initializeForms(): void {
    this.addAccountForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['ACCOUNT', Validators.required],
      parentId: [null]
    });

    this.editAccountForm = this.fb.group({
      id: [null, Validators.required],
      code: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['ACCOUNT', Validators.required],
      parentId: [null]
    });
  }

  /**
   * Load accounts from service
   */
  loadAccounts(): void {
    this.isLoading.set(true);
    this.chartOfAccountsService.getAccounts().subscribe({
      next: (data) => {
        this.accountsData.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Open add account dialog
   */
  openAddDialog(): void {
    this.addAccountForm.reset();
    this.isAddDialogOpen.set(true);
  }

  /**
   * Close add dialog
   */
  closeAddDialog(): void {
    this.isAddDialogOpen.set(false);
    this.addAccountForm.reset();
  }

  /**
   * Save new account
   */
  saveNewAccount(): void {
    if (!this.addAccountForm.valid) {
      return;
    }

    const newAccount: CreateAccountDto = {
      code: this.addAccountForm.get('code')?.value,
      name: this.addAccountForm.get('name')?.value,
      type: this.addAccountForm.get('type')?.value,
      parentId: this.addAccountForm.get('parentId')?.value || null
    };

    this.isLoading.set(true);
    this.chartOfAccountsService.createAccount(newAccount).subscribe({
      next: (account) => {
        console.log('Account created:', account);
        this.loadAccounts();
        this.closeAddDialog();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error creating account:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Open edit dialog
   */


  /**
   * Close edit dialog
   */
  closeEditDialog(): void {
    this.isEditDialogOpen.set(false);
    this.selectedAccount.set(null);
    this.editAccountForm.reset();
  }

  /**
   * Update account
   */
  updateAccount(): void {
    if (!this.editAccountForm.valid) {
      return;
    }

    const updatedAccount: UpdateAccountDto = {
      id: this.editAccountForm.get('id')?.value,
      code: this.editAccountForm.get('code')?.value,
      name: this.editAccountForm.get('name')?.value,
      type: this.editAccountForm.get('type')?.value,
      parentId: this.editAccountForm.get('parentId')?.value || null
    };

    this.isLoading.set(true);
    this.chartOfAccountsService.updateAccount(updatedAccount).subscribe({
      next: (account) => {
        console.log('Account updated:', account);
        this.loadAccounts();
        this.closeEditDialog();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error updating account:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Open delete dialog
   */
  openDeleteDialog(account: AccountNode): void {
    this.selectedAccount.set(account);
    this.isDeleteDialogOpen.set(true);
  }

  /**
   * Close delete dialog
   */
  closeDeleteDialog(): void {
    this.isDeleteDialogOpen.set(false);
    this.selectedAccount.set(null);
  }

  /**
   * Delete account
   */
  deleteAccount(): void {
    const account = this.selectedAccount();
    if (!account) return;

    this.isLoading.set(true);
    this.chartOfAccountsService.deleteAccount(account.id).subscribe({
      next: () => {
        console.log('Account deleted:', account.id);
        this.loadAccounts();
        this.closeDeleteDialog();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error deleting account:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Format currency for display
   */
  formatCurrency(value: number | undefined): string {
    if (!value) return '0 ر.س';
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(value);
  }

  /**
   * Get parent account name

  /**
   * Get available parent accounts (for dropdown)
   */
  getParentAccounts(): AccountNode[] {
    return this.accountsData().filter(a => a.type === 'PARENT');
  }

  /**
   * Get icon for account based on type and category
   */


  /**
   * Get account category color for styling
   */
  

  /**
   * Get action buttons visibility
   */
  canDelete(account: AccountNode): boolean {
    // Check if account has children
    return !this.accountsData().some(a => a.parentId === account.id);
  }
}
