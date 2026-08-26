import { Component, EventEmitter, Inject, Input, Optional, Output, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { AccountingService } from '../accounting.service';
import { CreateAccountDto, UpdateAccountDto, Account } from '../models';
import { ToastService } from '../../../services/toast.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CostCenterService } from '../../../services/cost-center.service';
import { CostCenter } from '../../../models/cost-center.model';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@/src/services/notification.service';
import { CustomerService } from '../../../services/customer.service';
import { SupplierService } from '../../../services/supplier.service';
import { CurrencyService } from '../../../services/currency.service';
import { Currency } from '../../../models/currency.model';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Data passed when opening AddAccountComponent as a quick-add dialog from a financial document
 *  (Requirement 9), e.g. the Purchase Invoice's Debit/Credit Account "+" button. Lets the dialog
 *  pre-select a sensible parent instead of defaulting to "new root account". */
export interface AddAccountQuickAddData {
  parentId?: number | null;
}

@Component({
  selector: 'app-add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule
  ]
})
export class AddAccountComponent implements OnChanges, OnInit {
  @Input() isEditing = false;
  @Input() editingAccount: Account | null = null;
  @Input() parentId: number | null = null;
  @Output() accountSaved = new EventEmitter<Account>();
  @Output() cancelled = new EventEmitter<void>();

  /** Present only when opened via MatDialog.open(AddAccountComponent, ...) (Requirement 9 -- the
   *  "+ Create Account" affordance on financial documents) -- absent for the existing routed
   *  /accounts/chart-of-accounts-new page, which keeps behaving exactly as before. */
  isQuickAddDialog = !!this.dialogRef;

  /** True while editing an account that already has posted journal-entry history -- disables
   *  Code/Type/Currency/Parent editing in the UI up front, matching the guard
   *  AccountService.UpdateAsync/DeleteAsync enforce server-side. Read from the account fetched by
   *  getAccountById (only that single-account endpoint populates hasPostedTransactions). */
  get hasPostedTransactions(): boolean {
    return this.isEditing && !!this.editingAccount?.hasPostedTransactions;
  }

  // Form properties
  infoMode = false;
  accountDialogMode = false;

  // Account properties
  accountNameAr = '';
  accountNameEn = '';
  companyId = 1;
  accountCategoryId = 1;
  accountTypeId = 1;
  accountLevel = 1;
  isMainAccount = false;
  accountId = 0;
  accountCode = '';
  /** Null = multi-currency account -- see Account.currencyId doc comment in models.ts. */
  currencyId: number | null = null;
  costCenterId = 0;

  // Client/Supplier/Bank properties
  createNewClient = false;
  createNewSupplier = false;
  createNewBank = false;
  customerId: number | null = null;
  customerName = '';
  supplierId: number | null = null;
  supplierName = '';
  bankId: number | null = null;
  bankName = '';

  accountForm: FormGroup;
  costCenters: CostCenter[] = [];
  currencies: Currency[] = [];
  isSaving = false;
  /** True once the user has hand-edited the auto-filled account code, so a later parent change
   *  stops overwriting their edit. */
  private codeManuallyEdited = false;

  /** Flat account list (code-sorted) powering the Parent Account picker dropdown. */
  parentOptions: Account[] = [];
  /** True while the backend resolves the next child account number for the selected parent. */
  nextCodeLoading = false;
  /** True when auto-numbering failed -- surfaces a hint; the user can unlock and type a code. */
  nextCodeFailed = false;
  /** Add mode: the generated Account Number is read-only by default (backend stays the final
   *  authority at save time). The lock button lets an advanced user override it manually. */
  isCodeLocked = true;

  customers = this.customerService.customers$;
  suppliers = this.supplierService.suppliers$;

  /** Read-only state of the Account Number input: locked by default on create (auto-generated
   *  from the parent hierarchy); in edit mode only locked when transactions were posted, which
   *  matches the existing server-side guard exactly. */
  get codeReadonly(): boolean {
    return this.isEditing ? this.hasPostedTransactions : this.isCodeLocked;
  }

  /** The account currently selected as parent (resolved from the same mainAccountCode control
   *  the form has always used), for the read-only Parent Account context panel. */
  get selectedParent(): Account | undefined {
    const code = this.accountForm?.get('mainAccountCode')?.value as string | null;
    return code ? this.accountingService.getAccountByCode(code) : undefined;
  }

  /** i18n key for an account's type/classification (1..5). */
  accountTypeLabel(typeId: unknown): string {
    switch (+typeId) {
      case 1: return 'ACCOUNTING.TYPE_ASSET';
      case 2: return 'ACCOUNTING.TYPE_LIABILITY';
      case 3: return 'ACCOUNTING.TYPE_EQUITY';
      case 4: return 'ACCOUNTING.TYPE_REVENUE';
      case 5: return 'ACCOUNTING.TYPE_EXPENSE';
      default: return '';
    }
  }

  /** Maps the same 1..5 classification the Account Type dropdown offers to the backend's Type
   *  string (Account.Type -- "ASSET"/"LIABILITY"/"EQUITY"/"REVENUE"/"EXPENSE"), which the debit/
   *  credit account pickers and financial reports filter by (AccountRepository.GetByCategoryAsync).
   *  Distinct from accountTypeId, itself: that field is the account's Cash/Clients/Suppliers/
   *  Banks/... sub-category (backend AccountType.cs), a different classification the dropdown
   *  does not set. */
  private static readonly TYPE_BY_CLASSIFICATION: Record<number, string> = {
    1: 'ASSET',
    2: 'LIABILITY',
    3: 'EQUITY',
    4: 'REVENUE',
    5: 'EXPENSE',
  };

  /** Unlock lets an advanced user type their own number (stops auto-fill from clobbering it);
   *  re-locking restores auto-generation immediately from the current parent/root context. */
  toggleCodeLock(): void {
    if (this.isEditing || this.hasPostedTransactions) return;
    this.isCodeLocked = !this.isCodeLocked;
    if (!this.isCodeLocked) {
      this.codeManuallyEdited = true;
    } else {
      this.codeManuallyEdited = false;
      const selection = this.accountForm.get('accountTypeSelection')?.value;
      this.fetchAndFillNextCode(selection === 'main' ? null : this.accountForm.get('parentId')?.value ?? null);
    }
  }

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    private costCenterService: CostCenterService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private toastService: NotificationService,
    private router: Router,
    private customerService: CustomerService,
    private supplierService: SupplierService,
    private currencyService: CurrencyService,
    @Optional() private dialogRef: MatDialogRef<AddAccountComponent, Account | undefined> | null,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: AddAccountQuickAddData | null
  ) {
    this.accountForm = this.fb.group({
      accountTypeSelection: ['main'], // Default to main account
      accountCode: ['', Validators.required],
      accountNameAr: [''], // Will be set as required for partial accounts only
      accountNameEn: ['', Validators.required],
      accountId: [0],
      companyId: [this.companyId],
      accountCategoryId: [this.accountCategoryId],
      accountTypeId: [this.accountTypeId],
      accountLevel: [this.accountLevel],
      isMainAccount: [this.isMainAccount],
      mainAccountId: [this.accountId],
      mainAccountCode: [''],
      mainAccountName: [''],
      parentId: [null],
      currencyId: [this.currencyId],
      hasCostCenter: [false],
      costCenterId: [0],
      isRetired: [false],
      isActive: [true],
      inActiveReasons: [''],
      isPrivate: [false],
      hasRemarks: [false],
      remarksAr: [''],
      remarksEn: [''],
      notesAr: [''],
      notesEn: [''],
      // UI-only selector driving createNewClient/createNewSupplier/createNewBank below --
      // never sent to the API (stripped in onSave, mirrors accountTypeSelection).
      entityType: ['none'],
      createNewClient: [this.createNewClient],
      createNewSupplier: [this.createNewSupplier],
      createNewBank: [this.createNewBank],
      customerId: [null],
      customerName: [''],
      supplierId: [null],
      supplierName: [''],
      bankId: [null],
      bankName: [''],
      newCustomerPhone: [''],
      newSupplierPhone: [''],
      syncEntityName: [false],
    });

    // Parent Account picker options: keep a code-sorted snapshot of the chart of accounts.
    this.accountingService.accounts$.subscribe(accounts => {
      this.parentOptions = [...(accounts ?? [])].sort((a, b) =>
        String(a.accountCode).localeCompare(String(b.accountCode)));
    });

    // Watch for account type selection changes to update validation
    this.accountForm.get('accountTypeSelection')?.valueChanges.subscribe(value => {
      this.syncAccountTypeSelection(value);
      this.updateValidationBasedOnAccountType(value);
    });

    // Entity Type drives the three create-flags and clears whichever fields no longer apply,
    // and toggles the required-phone validator for the "create new" path.
    this.accountForm.get('entityType')?.valueChanges.subscribe(value => {
      this.syncEntityType(value);
    });

    // Watch for isMainAccount changes to update mainAccountCode validation
    this.accountForm.get('isMainAccount')?.valueChanges.subscribe(isMain => {
      const mainAccountCodeControl = this.accountForm.get('mainAccountCode');
      if (!isMain) {
        mainAccountCodeControl?.setValidators([Validators.required]);
      } else {
        mainAccountCodeControl?.clearValidators();
      }
      mainAccountCodeControl?.updateValueAndValidity();
    });

    // Watch for mainAccountCode changes to auto-fill mainAccountName. Typing a code here selects
    // the account's real parent (not just a denormalized "top of tree" pointer) -- also sets
    // parentId so the created account's hierarchy (and CreateAsync's numbering, which is keyed on
    // parentId) is correct, matching the parent already resolved by tree-navigation.
    this.accountForm.get('mainAccountCode')?.valueChanges.subscribe(code => {
      if (code) {
        const mainAccount = this.accountingService.getAccountByCode(code);
        if (mainAccount) {
          this.accountForm.patchValue({
            mainAccountName: mainAccount.accountNameEn,
            mainAccountId: mainAccount.isMainAccount ? mainAccount.id : mainAccount.mainAccountId,
            parentId: mainAccount.id,
            accountTypeId: mainAccount.accountTypeId,
            accountCategoryId: mainAccount.accountCategoryId,
            currencyId: mainAccount.currencyId,
            companyId: mainAccount.companyId,
            // For partial accounts: set level to parent's level + 1
            accountLevel: (mainAccount.accountLevel || 0) + 1
          }, { emitEvent: false });
        }
      } else {
        // Clear dependent fields when code is empty
        this.accountForm.patchValue({ mainAccountName: '', mainAccountId: 0, parentId: null }, { emitEvent: false });
      }
    });

    // Watch for mainAccountId changes to populate related fields (useful if set programmatically)
    this.accountForm.get('mainAccountId')?.valueChanges.subscribe(id => {
      if (id && id !== 0) {
        const accounts = this.accountingService.getCurrentAccounts();
        const mainAccount = accounts.find(a => a.id === +id);
        if (mainAccount) {
          this.accountForm.patchValue({
            mainAccountCode: mainAccount.accountCode,
            mainAccountName: mainAccount.accountNameEn,
            accountTypeId: mainAccount.accountTypeId,
            accountCategoryId: mainAccount.accountCategoryId,
            currencyId: mainAccount.currencyId,
            companyId: mainAccount.companyId,
            accountLevel: (mainAccount.accountLevel || 0) + 1
          }, { emitEvent: false });
        }
      }
    });

    // Requirement 1: parentId is the single field CreateAsync actually keys numbering on (and the
    // real hierarchy edge sent to the backend) -- fetch the next code whenever it changes, for
    // both the "type a parent code" and "navigate from tree" flows.
    this.accountForm.get('parentId')?.valueChanges.subscribe(parentId => {
      this.fetchAndFillNextCode(parentId ?? null);
    });

    // Track manual edits to the code field so a later parent-change doesn't clobber them.
    this.accountForm.get('accountCode')?.valueChanges.subscribe(() => {
      if (!this.suppressCodeEditTracking) {
        this.codeManuallyEdited = true;
      }
    });

    // Set initial selection state and validation
    this.syncAccountTypeSelection('main');
    this.updateValidationBasedOnAccountType('main');
  }

  /** Set while the component itself patches accountCode, so that patch isn't mistaken for a
   *  manual user edit by the tracking subscriber above. */
  private suppressCodeEditTracking = false;

  /** Requirement 1/5: the user should not have to work out the next account code by hand. Fetches
   *  the backend-computed next code for the given parent (or root, when null) and fills it in --
   *  unless the user already typed their own code for this account. Shows a loading spinner while
   *  resolving and a non-blocking hint if generation fails (the backend remains the final
   *  authority for numbering/validation at save time). */
  private fetchAndFillNextCode(parentId: number | null) {
    if (this.isEditing || this.codeManuallyEdited) return;

    this.nextCodeLoading = true;
    this.nextCodeFailed = false;
    this.accountingService.getNextAccountCode(parentId).subscribe({
      next: (code) => {
        this.nextCodeLoading = false;
        if (this.isEditing || this.codeManuallyEdited) return;
        this.suppressCodeEditTracking = true;
        this.accountForm.patchValue({ accountCode: code });
        this.suppressCodeEditTracking = false;
      },
      error: () => {
        // Auto-numbering is a convenience -- surface the failure and let the user unlock + type.
        this.nextCodeLoading = false;
        this.nextCodeFailed = true;
      }
    });
  }

  ngOnInit() {
    // Load cost centers
    this.loadCostCenters();
    this.loadCurrencies();

    // Quick-add dialog mode (Requirement 9): initialize straight from dialogData instead of the
    // host page's own route -- ActivatedRoute here would otherwise resolve to whatever screen
    // opened the dialog (e.g. the Purchase Invoice page), not this form's own route.
    if (this.isQuickAddDialog) {
      if (this.dialogData?.parentId) {
        this.setupForAddSubAccount(this.dialogData.parentId);
      }
      return;
    }

    // Handle route parameters for editing
    this.route.params.subscribe(params => {
      const accountId = params['id'];
      if (accountId) {
        this.loadAccountForEdit(+accountId);
      }
    });

    // Read query params for parentId and mode
    this.route.queryParams.subscribe(params => {
      const parentId = params['parentId'];
      const mode = params['mode'];
      if (parentId && mode === 'add') {
        // Set as partial account with parentId
        this.accountForm.patchValue({
          accountTypeSelection: 'partial',
          isMainAccount: false,
          parentId: +parentId // Convert to number
        });
        // Wait for accounts to be loaded, then set main account
        this.accountingService.accounts$.subscribe(accounts => {
          if (accounts && accounts.length > 0) {
            const parentAccount = accounts.find(acc => acc.id === +parentId);
            if (parentAccount) {
              // For partial accounts, the main account is the top-level main account
              let mainAccount = parentAccount;
              if (!parentAccount.isMainAccount && parentAccount.mainAccountId) {
                mainAccount = accounts.find(acc => acc.id === parentAccount.mainAccountId) || parentAccount;
              }
              // Inherit properties from parent account
              this.accountForm.patchValue({
                mainAccountId: mainAccount.id,
                mainAccountCode: mainAccount.accountCode,
                mainAccountName: mainAccount.accountNameEn,
                accountLevel: parentAccount.accountLevel + 1,
                accountCategoryId: parentAccount.accountCategoryId,
                accountTypeId: parentAccount.accountTypeId,
                currencyId: parentAccount.currencyId,
                companyId: parentAccount.companyId
              });
            }
          }
        });
      }
    });
  }

  private loadCostCenters() {
    this.costCenterService.getCostCenters().subscribe({
      next: (costCenters) => {
        this.costCenters = costCenters.filter(cc => cc.isActive);
      },
      error: (error) => {
        console.error('Error loading cost centers:', error);
        this.toastService.showError(this.translate.instant('Failed to load cost centers'));
      }
    });
  }

  private loadCurrencies() {
    this.currencyService.getActive().subscribe({
      next: (currencies) => {
        this.currencies = currencies;
      },
      error: (error) => {
        console.error('Error loading currencies:', error);
      }
    });
  }

  private loadAccountForEdit(accountId: number) {
    this.accountingService.getAccountById(accountId).subscribe(account => {
      if (account) {
        this.onEditAccount(account);
      }
    });
  }

  private onEditAccount(account: Account) {
    this.isEditing = true;
    this.editingAccount = account;
    this.updateFormForEditing();
  }

  private updateValidationBasedOnAccountType(accountType: string) {
    const accountNameArControl = this.accountForm.get('accountNameAr');
    const mainAccountCodeControl = this.accountForm.get('mainAccountCode');

    if (accountType === 'main') {
      // For main accounts, Arabic name is optional
      accountNameArControl?.clearValidators();
      // Main accounts don't need mainAccountCode
      mainAccountCodeControl?.clearValidators();
    } else {
      // For partial accounts, Arabic name is required
      accountNameArControl?.setValidators([Validators.required, Validators.minLength(3)]);
      // Partial accounts need mainAccountCode if not a main account
      if (!this.accountForm.get('isMainAccount')?.value) {
        mainAccountCodeControl?.setValidators([Validators.required]);
      }
    }

    // Update validation
    accountNameArControl?.updateValueAndValidity();
    mainAccountCodeControl?.updateValueAndValidity();
  }

  /** Keeps createNewClient/createNewSupplier/createNewBank and the phone-required validators in
   *  sync with the single Entity Type dropdown, and clears fields for whichever entity types are
   *  no longer selected so a stale customerId/supplierId/bankId can't be submitted by accident. */
  private syncEntityType(entityType: 'none' | 'customer' | 'supplier' | 'bank') {
    const newCustomerPhoneControl = this.accountForm.get('newCustomerPhone');
    const newSupplierPhoneControl = this.accountForm.get('newSupplierPhone');

    this.accountForm.patchValue({
      createNewClient: false,
      createNewSupplier: false,
      createNewBank: false,
    }, { emitEvent: false });

    if (entityType !== 'customer') {
      this.accountForm.patchValue({ customerId: null, customerName: '', newCustomerPhone: '' }, { emitEvent: false });
    }
    if (entityType !== 'supplier') {
      this.accountForm.patchValue({ supplierId: null, supplierName: '', newSupplierPhone: '' }, { emitEvent: false });
    }
    if (entityType !== 'bank') {
      this.accountForm.patchValue({ bankId: null, bankName: '' }, { emitEvent: false });
    }

    newCustomerPhoneControl?.clearValidators();
    newSupplierPhoneControl?.clearValidators();
    newCustomerPhoneControl?.updateValueAndValidity({ emitEvent: false });
    newSupplierPhoneControl?.updateValueAndValidity({ emitEvent: false });
  }

  /** Re-applies the phone-required validator whenever "Create Automatically" is toggled for the
   *  currently-selected entity type -- called from the template on each checkbox's (change). */
  onCreateAutomaticallyChange(checked: boolean) {
    const entityType = this.accountForm.get('entityType')?.value;
    const control = entityType === 'customer'
      ? this.accountForm.get('newCustomerPhone')
      : entityType === 'supplier'
        ? this.accountForm.get('newSupplierPhone')
        : null;

    if (!control) return;
    if (checked) {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity();
  }

  private syncAccountTypeSelection(accountType: string) {
    const isMainAccount = accountType === 'main';

    this.accountForm.patchValue({
      isMainAccount
    }, { emitEvent: false });

    if (isMainAccount) {
      this.accountForm.patchValue({
        mainAccountId: 0,
        mainAccountCode: '',
        mainAccountName: '',
        parentId: null
      }, { emitEvent: false });
      this.fetchAndFillNextCode(null);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isEditing'] || changes['editingAccount']) {
      this.updateFormForEditing();
    }
    if (changes['parentId'] && this.parentId && !this.isEditing) {
      this.setupForAddSubAccount();
    }
  }

  onSave() {
    if (this.accountForm.valid) {
      this.isSaving = true;
      // getRawValue(), not .value -- when hasPostedTransactions locks a control (accountCode,
      // accountTypeId, currencyId, accountTypeSelection, mainAccountCode), Angular omits disabled
      // controls from .value entirely. Using .value here would send those fields as undefined,
      // which the backend would treat as "clear it" rather than "leave it unchanged".
      const formValue = this.accountForm.getRawValue();

      // Remove UI-only fields that aren't part of the DTO
      const { accountTypeSelection, entityType, ...dtoData } = formValue;

      const processedData = { ...dtoData };

      // Set isMainAccount based on accountTypeSelection
      processedData.isMainAccount = accountTypeSelection === 'main';

      // Backend Type ("ASSET"/"LIABILITY"/...) is required and drives debit/credit account-picker
      // filtering (AccountRepository.GetByCategoryAsync) -- derive it from the same classification
      // the Account Type dropdown already collects, since the form has no separate Type control.
      processedData.Type = AddAccountComponent.TYPE_BY_CLASSIFICATION[+processedData.accountTypeId] ?? '';

      // For partial accounts, resolve mainAccountId from mainAccountCode
      if (!processedData.isMainAccount && processedData.mainAccountCode) {
        const mainAccount = this.accountingService.getAccountByCode(processedData.mainAccountCode);
        if (mainAccount) {
          processedData.mainAccountId = mainAccount.id;
          processedData.mainAccountName = mainAccount.accountNameEn; // Update name if needed
        } else {
          console.error('Main account not found for code:', processedData.mainAccountCode);
          // Optionally show error to user
        }
      }

      if (this.isEditing && this.editingAccount) {
        const updateDto: UpdateAccountDto = {
          id: this.editingAccount.id,
          ...processedData
        };
        this.accountingService.updateAccount(updateDto).subscribe({
          next: (account) => {
            this.toastService.showSuccess(this.translate.instant('ACCOUNTING.ACCOUNT_UPDATED'));
            this.accountSaved.emit(account);
            this.dialogRef?.close(account);
            this.isSaving = false;
          },
          error: (error) => {
            // Form data, and the dialog/screen itself, are deliberately left untouched here so the
            // user can fix the offending field and retry without re-entering everything.
            this.toastService.showError(this.extractErrorMessage(error, 'ACCOUNTING.ERROR_UPDATING_ACCOUNT'));
            this.isSaving = false;
          }
        });
      } else {
        const createDto: CreateAccountDto = processedData;
        this.accountingService.createAccount(createDto).subscribe({
          next: (account) => {
            this.toastService.showSuccess(this.translate.instant('ACCOUNTING.ACCOUNT_CREATED'));
            this.accountSaved.emit(account);
            this.dialogRef?.close(account);
            this.isSaving = false;
          },
          error: (error) => {
            this.toastService.showError(this.extractErrorMessage(error, 'ACCOUNTING.ERROR_CREATING_ACCOUNT'));
            this.isSaving = false;
          }
        });
      }
    } else {
      console.log('Form is invalid:', this.accountForm.errors);
      console.log('Form controls:', this.accountForm.controls);
    }
  }

  /** Surfaces the real business-validation reason from the backend (e.g. "Account with code '113'
   *  already exists", "Parent account with ID 42 not found") instead of a generic message --
   *  CreateAccount/UpdateAccount return BadRequest(response.Message) with that exact text as the
   *  plain-text/JSON response body, which arrives here as HttpErrorResponse.error. Falls back to a
   *  translated generic message for anything that isn't a real business error (network failure,
   *  500, framework-level model-binding rejection) so a raw stack trace is never shown to the user. */
  private extractErrorMessage(error: unknown, fallbackKey: string): string {
    if (error instanceof HttpErrorResponse && error.status === 400 && error.error) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }
      const message = (error.error as { message?: string; title?: string })?.message
        ?? (error.error as { title?: string })?.title;
      if (message) return message;
    }
    return this.translate.instant(fallbackKey);
  }

  onCancel() {
    this.cancelled.emit();
    if (this.dialogRef) {
      this.dialogRef.close();
      return;
    }
    this.router.navigate(['/accounts/chart-of-accounts']);
  }

  /** Disables the controls the backend rejects once an account has posted journal-entry history
   *  (accountCode, accountTypeId, currencyId, and everything that drives ParentId: the main/partial
   *  toggle and mainAccountCode) -- see AccountService.UpdateAsync's changesProtectedField guard.
   *  Re-enables them for a fresh (non-editing, or history-free) account, so this can be called
   *  unconditionally from updateFormForEditing without special-casing the "no history" path. */
  private applyPostedTransactionsLock(): void {
    const lockedControlNames = ['accountCode', 'accountTypeId', 'currencyId', 'accountTypeSelection', 'mainAccountCode'];
    const locked = this.hasPostedTransactions;

    for (const name of lockedControlNames) {
      const control = this.accountForm.get(name);
      if (!control) continue;
      if (locked) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    }
  }

  private updateFormForEditing() {
    if (this.isEditing && this.editingAccount) {
      // Determine account type selection based on isMainAccount
      const accountTypeSelection = this.editingAccount.isMainAccount ? 'main' : 'partial';
      
      this.accountForm.patchValue({
        accountTypeSelection: accountTypeSelection,
        accountCode: this.editingAccount.accountCode,
        accountNameAr: this.editingAccount.accountNameAr,
        accountNameEn: this.editingAccount.accountNameEn,
        accountId: this.editingAccount.accountId,
        companyId: this.editingAccount.companyId,
        accountCategoryId: this.editingAccount.accountCategoryId,
        accountTypeId: this.editingAccount.accountTypeId,
        accountLevel: this.editingAccount.accountLevel,
        isMainAccount: this.editingAccount.isMainAccount,
        mainAccountId: this.editingAccount.mainAccountId,
        mainAccountCode: this.editingAccount.mainAccountCode,
        mainAccountName: this.editingAccount.mainAccountName,
        parentId: this.editingAccount.parentId,
        currencyId: this.editingAccount.currencyId,
        hasCostCenter: this.editingAccount.hasCostCenter,
        costCenterId: this.editingAccount.costCenterId,
        isRetired: this.editingAccount.isRetired,
        isActive: this.editingAccount.isActive,
        inActiveReasons: this.editingAccount.inActiveReasons,
        isPrivate: this.editingAccount.isPrivate,
        hasRemarks: this.editingAccount.hasRemarks,
        remarksAr: this.editingAccount.remarksAr,
        remarksEn: this.editingAccount.remarksEn,
        notesAr: this.editingAccount.notesAr,
        notesEn: this.editingAccount.notesEn,
        createNewClient: this.editingAccount.createNewClient,
        createNewSupplier: this.editingAccount.createNewSupplier,
        createNewBank: this.editingAccount.createNewBank,
        customerId: this.editingAccount.customerId,
        customerName: this.editingAccount.customerName,
        supplierId: this.editingAccount.supplierId,
        supplierName: this.editingAccount.supplierName,
        bankId: this.editingAccount.bankId,
        bankName: this.editingAccount.bankName
      });
      // Set separately with emitEvent:false -- entityType's valueChanges handler clears
      // customerId/supplierId/bankId for non-matching types, which would wipe the values just
      // patched above if it fired here.
      this.accountForm.patchValue({
        entityType: this.editingAccount.entityType ?? 'none',
        syncEntityName: false
      }, { emitEvent: false });
      this.syncAccountTypeSelection(accountTypeSelection);
      this.updateValidationBasedOnAccountType(accountTypeSelection);
      this.applyPostedTransactionsLock();
      // If this is a partial account, ensure the main account fields are populated
      if (!this.editingAccount.isMainAccount) {
        // Try to resolve from local cache first
        const accounts = this.accountingService.getCurrentAccounts();
        let mainAccount = accounts.find(a => a.id === this.editingAccount!.mainAccountId);

        // If not found, try to infer from parentId
        if (!mainAccount && this.editingAccount.parentId) {
          const parent = accounts.find(a => a.id === this.editingAccount!.parentId);
          if (parent) {
            if (!parent.isMainAccount && parent.mainAccountId) {
              mainAccount = accounts.find(a => a.id === parent.mainAccountId) || parent;
            } else if (parent.isMainAccount) {
              mainAccount = parent;
            }
          }
        }

        if (mainAccount) {
          this.accountForm.patchValue({
            mainAccountId: mainAccount.id,
            mainAccountCode: mainAccount.accountCode,
            mainAccountName: mainAccount.accountNameEn
          });
        } else if (this.editingAccount.mainAccountId) {
          // Fallback: fetch from API if we have an id but no local data
          this.accountingService.getAccountById(this.editingAccount.mainAccountId).subscribe({
            next: acc => {
              if (acc) {
                this.accountForm.patchValue({
                  mainAccountId: acc.id,
                  mainAccountCode: acc.accountCode,
                  mainAccountName: acc.accountNameEn
                });
              }
            },
            error: err => console.error('Failed to resolve main account for edit:', err)
          });
        }
      }
    } else {
      this.accountForm.reset({
        accountTypeSelection: 'main',
        accountCode: '',
        accountNameAr: '',
        accountNameEn: '',
        accountId: 0,
        companyId: this.companyId,
        accountCategoryId: this.accountCategoryId,
        accountTypeId: this.accountTypeId,
        accountLevel: this.accountLevel,
        isMainAccount: false,
        mainAccountId: 0,
        mainAccountCode: '',
        mainAccountName: '',
        parentId: null,
        currencyId: this.currencyId,
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
        createNewClient: false,
        createNewSupplier: false,
        createNewBank: false,
        customerId: null,
        customerName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: '',
        entityType: 'none',
        newCustomerPhone: '',
        newSupplierPhone: '',
        syncEntityName: false
      });
      this.updateValidationBasedOnAccountType('main');
    }
  }

  /** @param parentIdOverride Used by the quick-add dialog (Requirement 9), which has no @Input
   *  parentId of its own -- falls back to the @Input for the existing embedded-form usage. */
  private setupForAddSubAccount(parentIdOverride?: number | null) {
    const parentId = parentIdOverride ?? this.parentId;
    if (parentId) {
      // Set as partial account with parentId
      this.accountForm.patchValue({
        accountTypeSelection: 'partial',
        isMainAccount: false,
        parentId: parentId
      });
      // Wait for accounts to be loaded, then set main account
      this.accountingService.accounts$.subscribe(accounts => {
        if (accounts && accounts.length > 0) {
          const parentAccount = accounts.find(acc => acc.id === parentId);
          if (parentAccount) {
            // For partial accounts, the main account is the top-level main account
            let mainAccount = parentAccount;
            if (!parentAccount.isMainAccount && parentAccount.mainAccountId) {
              mainAccount = accounts.find(acc => acc.id === parentAccount.mainAccountId) || parentAccount;
            }
            // Inherit properties from parent account
            this.accountForm.patchValue({
              mainAccountId: mainAccount.id,
              mainAccountCode: mainAccount.accountCode,
              mainAccountName: mainAccount.accountNameEn,
              accountLevel: parentAccount.accountLevel + 1,
              accountCategoryId: parentAccount.accountCategoryId,
              accountTypeId: parentAccount.accountTypeId,
              currencyId: parentAccount.currencyId,
              companyId: parentAccount.companyId
            });
          }
        }
      });
    }
  }
}