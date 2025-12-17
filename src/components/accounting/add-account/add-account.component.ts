import { Component, EventEmitter, Input, Output, OnChanges, OnInit } from '@angular/core';
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
  clientId: number | null = null;
  clientName = '';
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
      clientId: [null],
      clientName: [''],
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
        // Find parent account to set mainAccountId, mainAccountCode, mainAccountName
        const accounts = this.accountingService.getCurrentAccounts();
        const parentAccount = accounts.find(acc => acc.id === +parentId);
        if (parentAccount) {
          this.accountForm.patchValue({
            mainAccountId: parentAccount.id,
            mainAccountCode: parentAccount.accountCode,
            mainAccountName: parentAccount.accountNameEn
          });
        }
      }
    });
  }

  private updateValidationBasedOnAccountType(accountType: string) {
    const accountNameArControl = this.accountForm.get('accountNameAr');

    if (accountType === 'main') {
      // For main accounts, Arabic name is optional
      accountNameArControl?.clearValidators();
    } else {
      // For partial accounts, Arabic name is required
      accountNameArControl?.setValidators([Validators.required, Validators.minLength(3)]);
    }

    // Update validation
    accountNameArControl?.updateValueAndValidity();
  }

  ngOnChanges() {
    if (this.isEditing && this.editingAccount) {
      this.accountForm.patchValue({
        accountTypeSelection: 'partial',
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
        clientId: this.editingAccount.clientId,
        clientName: this.editingAccount.clientName,
        supplierId: this.editingAccount.supplierId,
        supplierName: this.editingAccount.supplierName,
        bankId: this.editingAccount.bankId,
        bankName: this.editingAccount.bankName
      });
      this.updateValidationBasedOnAccountType('partial');
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
        clientId: null,
        clientName: '',
        supplierId: null,
        supplierName: '',
        bankId: null,
        bankName: ''
      });
      this.updateValidationBasedOnAccountType('main');
    }
  }

  onSave() {
    if (this.accountForm.valid) {
      const formValue = this.accountForm.value;

      // Remove the accountTypeSelection field as it's not part of the DTO
      const { accountTypeSelection, ...dtoData } = formValue;

      const processedData = { ...dtoData };

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
}