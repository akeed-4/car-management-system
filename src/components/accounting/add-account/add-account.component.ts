import { Component, EventEmitter, Input, Output, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AccountingService } from '../accounting.service';
import { CreateAccountDto, UpdateAccountDto, Account } from '../models';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';

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
    TranslateModule
  ]
})
export class AddAccountComponent implements OnChanges, OnInit {
  @Input() isEditing = false;
  @Input() editingAccount: Account | null = null;
  @Input() parentId: number | null = null;
  @Output() accountSaved = new EventEmitter<Account>();
  @Output() cancelled = new EventEmitter<void>();

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
  currencyId = 1;
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

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    private translate: TranslateService,
    private route: ActivatedRoute
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
      createNewClient: [this.createNewClient],
      createNewSupplier: [this.createNewSupplier],
      createNewBank: [this.createNewBank],
      customerId: [null],
      customerName: [''],
      supplierId: [null],
      supplierName: [''],
      bankId: [null],
      bankName: [''],
    });

    // Watch for account type selection changes to update validation
    this.accountForm.get('accountTypeSelection')?.valueChanges.subscribe(value => {
      this.updateValidationBasedOnAccountType(value);
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

    // Watch for mainAccountCode changes to auto-fill mainAccountName
    this.accountForm.get('mainAccountCode')?.valueChanges.subscribe(code => {
      if (code) {
        const mainAccount = this.accountingService.getAccountByCode(code);
        if (mainAccount) {
          this.accountForm.get('mainAccountName')?.setValue(mainAccount.accountNameEn);
        }
      }
    });

    // Set initial validation
    this.updateValidationBasedOnAccountType('main');
  }

  ngOnInit() {
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

  private loadAccountForEdit(accountId: number) {
    this.accountingService.getAccountById(accountId).subscribe(account => {
      if (account) {
        this.onEditAccount(account);
        // Manually trigger ngOnChanges since @Input is not used for routed component
      }
    });
  }

  private onEditAccount(account: Account) {
    this.isEditing = true;
    this.editingAccount = account;
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
      const formValue = this.accountForm.value;

      // Remove the accountTypeSelection field as it's not part of the DTO
      const { accountTypeSelection, ...dtoData } = formValue;

      const processedData = { ...dtoData };

      // Set isMainAccount based on accountTypeSelection
      processedData.isMainAccount = accountTypeSelection === 'main';

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
          ...processedData,
          isActive: true
        };
        console.log('Sending update DTO:', updateDto);
        this.accountingService.updateAccount(updateDto).subscribe({
          next: (account) => {
            console.log('Account updated successfully:', account);
            this.accountSaved.emit(account);
          },
          error: (error) => {
            console.error('Error updating account:', error);
          }
        });
      } else {
        const createDto: CreateAccountDto = processedData;
        console.log('Sending create DTO:', createDto);
        this.accountingService.createAccount(createDto).subscribe({
          next: (account) => {
            console.log('Account created successfully:', account);
            this.accountSaved.emit(account);
          },
          error: (error) => {
            console.error('Error creating account:', error);
          }
        });
      }
    } else {
      console.log('Form is invalid:', this.accountForm.errors);
      console.log('Form controls:', this.accountForm.controls);
    }
  }

  onCancel() {
    this.cancelled.emit();
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
      this.updateValidationBasedOnAccountType(accountTypeSelection);
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
        bankName: ''
      });
      this.updateValidationBasedOnAccountType('main');
    }
  }

  private setupForAddSubAccount() {
    if (this.parentId) {
      // Set as partial account with parentId
      this.accountForm.patchValue({
        accountTypeSelection: 'partial',
        isMainAccount: false,
        parentId: this.parentId
      });
      // Wait for accounts to be loaded, then set main account
      this.accountingService.accounts$.subscribe(accounts => {
        if (accounts && accounts.length > 0) {
          const parentAccount = accounts.find(acc => acc.id === this.parentId);
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