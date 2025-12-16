import { Component, EventEmitter, Input, Output } from '@angular/core';
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
export class AddAccountComponent {
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
    private translate: TranslateService
  ) {
    this.accountForm = this.fb.group({
      accountTypeSelection: ['main'], // Default to main account
      accountCode: [{value:'', disabled: this.infoMode}, {
        validators: [Validators.required]
      }],
      accountNameAr: [{value: this.accountNameAr, disabled: this.infoMode}, {
        validators: [Validators.required, Validators.minLength(3)]
      }],
      accountNameEn: [{value: this.accountNameEn, disabled: this.infoMode}, {
        validators: [Validators.required, Validators.minLength(3)]
      }],
      accountId: [{value: 0, disabled: this.infoMode}],
      companyId: [{value: this.companyId, disabled: this.infoMode}],
      accountCategoryId: [{value: this.accountCategoryId, disabled: this.infoMode}],
      accountTypeId: [{value: this.accountTypeId, disabled: this.infoMode}],
      accountLevel: [{value: this.accountLevel, disabled: this.infoMode}],
      isMainAccount: [{value: this.isMainAccount, disabled: this.infoMode}],
      mainAccountId: [{value: this.accountId, disabled: this.infoMode}],
      mainAccountCode: [{value: this.accountCode, disabled: !this.accountDialogMode}],
      mainAccountName: [{value: this.accountNameEn, disabled: !this.accountDialogMode}],
      currencyId: [{value: this.currencyId, disabled: this.infoMode}],
      hasCostCenter: [{value: false, disabled: this.infoMode}],
      costCenterId: [{value: 0, disabled: this.infoMode}],
      isRetired: [{value: false, disabled: this.infoMode}],
      isActive: [{value: true, disabled: this.infoMode}],
      inActiveReasons: [{value: '', disabled: this.infoMode}],
      isPrivate: [{value: false, disabled: this.infoMode}],
      hasRemarks: [{value: false, disabled: this.infoMode}],
      remarksAr: [{value: '', disabled: this.infoMode}],
      remarksEn: [{value: '', disabled: this.infoMode}],
      notesAr: [{value: '', disabled: this.infoMode}],
      notesEn: [{value: '', disabled: this.infoMode}],
      createNewClient: [{value: this.createNewClient, disabled: this.infoMode}],
      createNewSupplier: [{value: this.createNewSupplier, disabled: this.infoMode}],
      createNewBank: [{value: this.createNewBank, disabled: this.infoMode}],
      clientId: [{value: null, disabled: this.infoMode}],
      clientName: [{value: '', disabled: this.infoMode}],
      supplierId: [{value: null, disabled: this.infoMode}],
      supplierName: [{value: '', disabled: this.infoMode}],
      bankId: [{value: null, disabled: this.infoMode}],
      bankName: [{value: '', disabled: this.infoMode}],
    });
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
    }
  }

  onSave() {
    if (this.accountForm.valid) {
      const formValue = this.accountForm.value;

      if (this.isEditing && this.editingAccount) {
        const updateDto: UpdateAccountDto = {
          id: this.editingAccount.id,
          ...formValue,
          isActive: true
        };
        this.accountingService.updateAccount(updateDto).subscribe(account => {
          this.accountSaved.emit(account);
        });
      } else {
        const createDto: CreateAccountDto = formValue;
        this.accountingService.createAccount(createDto).subscribe(account => {
          this.accountSaved.emit(account);
        });
      }
    }
  }

  onCancel() {
    this.cancelled.emit();
  }
}