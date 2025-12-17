import { Component, OnInit } from '@angular/core';
import { DxTreeListModule } from 'devextreme-angular';
import { DxAutocompleteModule } from 'devextreme-angular';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AccountingService } from '../accounting.service';
import { Account, CreateAccountDto, UpdateAccountDto } from '../models';
import { AddAccountComponent } from '../add-account/add-account.component';
import { CustomerService } from '../../../services/customer.service';
import { SupplierService } from '../../../services/supplier.service';
import { InfoBankService } from '../../../services/info-bank.service';
import { Customer } from '../../../types/customer.model';
import { Supplier } from '../../../types/supplier.model';
import { InfoBank } from '../../../types/info-bank.model';

@Component({
  selector: 'app-chart-of-accounts',
  templateUrl: './chart-of-accounts.component.html',
  styleUrls: ['./chart-of-accounts.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxTreeListModule,
    DxAutocompleteModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    TranslateModule,
    ReactiveFormsModule,
    AddAccountComponent
  ]
})
export class ChartOfAccountsComponent implements OnInit {
  accounts$: Observable<Account[]>;
  accounts: Account[] = [];
  isEditing = false;
  editingAccount: Account | null = null;

  // Operation types
  operationTypes = [
    { value: 'create', label: 'ACCOUNTING.CREATE_NEW_ENTITY_ACCOUNT' },
    { value: 'link', label: 'ACCOUNTING.LINK_EXISTING_ENTITY' }
  ];

  // Entity types
  entityTypes = [
    { value: 'customer', label: 'ACCOUNTING.CUSTOMER' },
    { value: 'supplier', label: 'ACCOUNTING.SUPPLIER' },
    { value: 'bank', label: 'ACCOUNTING.BANK' }
  ];

  // Form for linking existing entities
  linkForm: FormGroup;

  // Data sources for autocomplete
  customers: Customer[] = [];
  suppliers: Supplier[] = [];
  banks: InfoBank[] = [];

  selectedEntity: Customer | Supplier | InfoBank | null = null;

  // DevExtreme TreeList columns configuration with translation
  columns = [
    {
      dataField: 'code',
      caption: 'ACCOUNTING.ACCOUNT_CODE',
      width: 120
    },
    {
      dataField: 'name',
      caption: 'ACCOUNTING.ACCOUNT_NAME'
    },
    {
      dataField: 'type',
      caption: 'ACCOUNTING.ACCOUNT_TYPE',
      width: 150,
      lookup: {
        dataSource: [
          { value: 'ASSET', display: 'ACCOUNTING.TYPE_ASSET' },
          { value: 'LIABILITY', display: 'ACCOUNTING.TYPE_LIABILITY' },
          { value: 'EQUITY', display: 'ACCOUNTING.TYPE_EQUITY' },
          { value: 'REVENUE', display: 'ACCOUNTING.TYPE_REVENUE' },
          { value: 'EXPENSE', display: 'ACCOUNTING.TYPE_EXPENSE' }
        ],
        valueExpr: 'value',
        displayExpr: 'display'
      }
    },
    {
      dataField: 'balance',
      caption: 'ACCOUNTING.BALANCE',
      dataType: 'number',
      format: { type: 'currency', currency: 'SAR', precision: 2 },
      width: 120
    },
    {
      caption: 'ACCOUNTING.ACTIONS',
      type: 'buttons',
      width: 120,
      buttons: [
        {
          hint: 'ACCOUNTING.EDIT_ACCOUNT',
          icon: 'edit',
          onClick: (e: any) => this.onEditAccount(e.row.data)
        },
        {
          hint: 'ACCOUNTING.DELETE_ACCOUNT',
          icon: 'trash',
          onClick: (e: any) => this.onDeleteAccount(e.row.data)
        }
      ]
    }
  ];

  constructor(
    private accountingService: AccountingService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private customerService: CustomerService,
    private supplierService: SupplierService,
    private infoBankService: InfoBankService
  ) {
    this.accounts$ = this.accountingService.accounts$;

    // Initialize link form
    this.linkForm = this.fb.group({
      operationType: ['create', Validators.required],
      entityType: ['customer', Validators.required],
      selectedEntity: [null, Validators.required],
      accountCode: ['', [Validators.required, Validators.minLength(3)]],
      accountName: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit() {
    this.loadAccounts();
    this.loadEntityData();

    // Handle route parameters for editing
    this.route.params.subscribe(params => {
      const accountId = params['id'];
      if (accountId) {
        this.loadAccountForEdit(+accountId);
      }
    });

    // Handle query parameters for adding sub-account
    this.route.queryParams.subscribe(queryParams => {
      const parentId = queryParams['parentId'];
      const mode = queryParams['mode'];

      if (mode === 'add' && parentId) {
        this.prepareAddSubAccount(+parentId);
      } else if (mode === 'edit') {
        // Edit mode is already handled by route params
      } else {
        // Default add mode
        this.onAddAccount();
      }
    });
  }

  loadAccounts() {
    this.accounts$.subscribe(accounts => {
      this.accounts = accounts;
    });
  }
  loadEntityData() {
    // Load customers
    this.customers = this.customerService.customers$();

    // Load suppliers
    this.suppliers = this.supplierService.suppliers$();

    // Load banks
    this.infoBankService.loadInfoBanks();
    this.banks = this.infoBankService.infoBanks();
  }

  getEntityDataSource(): any[] {
    const entityType = this.linkForm.get('entityType')?.value;
    switch (entityType) {
      case 'customer':
        return this.customers;
      case 'supplier':
        return this.suppliers;
      case 'bank':
        return this.banks;
      default:
        return [];
    }
  }

  getEntityDisplayExpr(): string {
    const entityType = this.linkForm.get('entityType')?.value;
    switch (entityType) {
      case 'customer':
        return 'name';
      case 'supplier':
        return 'name';
      case 'bank':
        return 'name';
      default:
        return 'name';
    }
  }

  onEntitySelected(event: any) {
    this.selectedEntity = event.selectedItem;
    if (this.selectedEntity) {
      // Auto-fill account name based on selected entity
      const entityType = this.linkForm.get('entityType')?.value;
      let accountName = '';

      switch (entityType) {
        case 'customer':
          accountName = `Customer: ${(this.selectedEntity as Customer).name}`;
          break;
        case 'supplier':
          accountName = `Supplier: ${(this.selectedEntity as Supplier).name}`;
          break;
        case 'bank':
          accountName = `Bank: ${(this.selectedEntity as InfoBank).name}`;
          break;
      }

      this.linkForm.patchValue({
        accountName: accountName
      });
    }
  }

  onLinkAccount() {
    if (this.linkForm.valid && this.selectedEntity) {
      const formValue = this.linkForm.value;
      const entityType = formValue.entityType;

      // Create account DTO
      const accountDto: CreateAccountDto = {
        accountCode: formValue.accountCode,
        accountNameAr: formValue.accountName,
        accountNameEn: formValue.accountName,
        accountId: 0, // New account
        companyId: 1, // Default company
        accountCategoryId: 1, // Default category
        accountTypeId: this.getAccountTypeForEntity(entityType),
        accountLevel: 1, // Default level
        isMainAccount: true,
        mainAccountId: 0,
        mainAccountCode: '',
        mainAccountName: '',
        currencyId: 1, // Default currency
        hasCostCenter: false,
        costCenterId: 0,
        isRetired: false,
        isActive: true,
        inActiveReasons: '',
        isPrivate: false,
        hasRemarks: false,
        remarksAr: '',
        remarksEn: '',
        notesAr: '',
        notesEn: '',
        createNewClient: entityType === 'customer',
        createNewSupplier: entityType === 'supplier',
        createNewBank: entityType === 'bank',
        clientId: entityType === 'customer' ? (this.selectedEntity as Customer).id : null,
        clientName: entityType === 'customer' ? (this.selectedEntity as Customer).name : '',
        supplierId: entityType === 'supplier' ? (this.selectedEntity as Supplier).id : null,
        supplierName: entityType === 'supplier' ? (this.selectedEntity as Supplier).name : '',
        bankId: entityType === 'bank' ? (this.selectedEntity as InfoBank).id : null,
        bankName: entityType === 'bank' ? (this.selectedEntity as InfoBank).name : ''
      };

      this.accountingService.createAccount(accountDto).subscribe({
        next: (account) => {
          this.translate.get('ACCOUNTING.ACCOUNT_LINKED_SUCCESSFULLY').subscribe(message => {
            alert(message);
          });
          this.linkForm.reset({
            operationType: 'create',
            entityType: 'customer',
            selectedEntity: null,
            accountCode: '',
            accountName: ''
          });
          this.selectedEntity = null;
          this.loadAccounts();
        },
        error: (error) => {
          console.error('Error linking account:', error);
          this.translate.get('ACCOUNTING.ERROR_LINKING_ACCOUNT').subscribe(message => {
            alert(message);
          });
        }
      });
    }
  }

  private getAccountTypeForEntity(entityType: string): number {
    // Map entity types to appropriate account types
    switch (entityType) {
      case 'customer':
        return 2; // Liability (Accounts Receivable)
      case 'supplier':
        return 1; // Asset (Accounts Payable)
      case 'bank':
        return 1; // Asset (Bank accounts)
      default:
        return 1;
    }
  }

  onAddAccount() {
    this.isEditing = false;
    this.editingAccount = null;
  }

  onEditAccount(account: Account) {
    this.isEditing = true;
    this.editingAccount = account;
  }

  onAccountSaved(account: Account) {
    this.isEditing = false;
    this.editingAccount = null;
  }

  onDeleteAccount(node: any) {
    if (confirm(this.translate.instant('ACCOUNTING.CONFIRM_DELETE'))) {
      this.accountingService.deleteAccount(node.id).subscribe();
    }
  }

  onCancel() {
    this.isEditing = false;
    this.editingAccount = null;
  }

  private loadAccountForEdit(accountId: number) {
    this.accountingService.getAccountById(accountId).subscribe(account => {
      if (account) {
        this.onEditAccount(account);
      }
    });
  }

  private prepareAddSubAccount(parentId: number) {
    this.isEditing = false;
    this.editingAccount = null;
  }
}