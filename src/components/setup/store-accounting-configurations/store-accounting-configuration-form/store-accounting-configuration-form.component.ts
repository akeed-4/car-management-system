import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreAccountingConfigurationService } from '../../../../services/store-accounting-configuration.service';
import { StoreService } from '../../../../services/store.service';
import { AccountingService } from '../../../accounting/accounting.service';
import { openCreateAccountDialog } from '../../../accounting/create-account-dialog.helper';
import { NotificationService } from '../../../../services/notification.service';
import { Store } from '../../../../models/branch.model';
import { Account } from '../../../accounting/models';
import { CreateStoreAccountingConfigurationDto, UpdateStoreAccountingConfigurationDto } from '../../../../models/store-accounting-configuration.model';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-store-accounting-configuration-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './store-accounting-configuration-form.component.html',
  styleUrls: ['./store-accounting-configuration-form.component.css']
})
export class StoreAccountingConfigurationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private configService = inject(StoreAccountingConfigurationService);
  private storeService = inject(StoreService);
  private accountingService = inject(AccountingService);
  private notificationService = inject(NotificationService);
  protected translate = inject(TranslateService);
  private dialog = inject(MatDialog);

  form!: FormGroup;
  mode: FormMode = 'create';
  configId: number | null = null;
  isLoading = signal(false);
  isSaving = signal(false);
  stores = signal<Store[]>([]);
  accounts = signal<Account[]>([]);
  /** Requirement 4: account IDs saved on this configuration before it stopped being a postable
   *  (leaf) account -- e.g. a child account was added under it afterwards. Merged into `accounts`
   *  so the field still displays clearly instead of going blank, and flagged here so the template
   *  can mark that specific option instead of silently treating it as a normal valid choice. */
  nonPostableAccountIds = signal<Set<number>>(new Set());
  private reconciledAccountIds = new Set<number>();

  constructor() {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      storeId: [null, Validators.required],
      inventoryAccountId: [null, Validators.required],
      cogsAccountId: [null, Validators.required],
      inventoryAdjustmentAccountId: [null, Validators.required],
      // Optional: null means "not configured yet", not "post to nothing" -- the backend falls
      // back to inventoryAccountId (capitalized costs) or reports a clear error (expensed costs
      // with no PurchaseExpenseAccountId) rather than posting to a guessed account.
      additionalCostAccountId: [null],
      purchaseExpenseAccountId: [null],
      freightShippingAccountId: [null],
      customsAccountId: [null],
      openingBalanceEquityAccountId: [null],
      inventoryAccountingMethod: ['Perpetual', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadStores();
    this.loadAccounts();

    const url = this.route.snapshot.url.map(s => s.path);
    this.mode = url.includes('edit') ? 'edit' : 'create';

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.configId = +idParam;
      this.loadConfiguration(this.configId);
      // A configuration's Store never changes once created -- correcting it means deleting and
      // re-creating the row (see StoreAccountingConfigurationService, one-per-Store uniqueness).
      this.form.get('storeId')?.disable();
    } else {
      // Arrived via the "Configure Store" action on a document form's setup warning
      // (see store-accounting-setup-warning.helper.ts) -- prefill the Store the user was
      // actually trying to post against instead of leaving them to find it again.
      const storeIdParam = this.route.snapshot.queryParamMap.get('storeId');
      if (storeIdParam) {
        this.form.patchValue({ storeId: +storeIdParam });
      }
    }
  }

  private loadStores(): void {
    this.storeService.getAll().subscribe({
      next: (data) => this.stores.set(data || []),
      error: () => this.notificationService.showError(this.translate.instant('STORE_ACCOUNTING_CONFIG.LOAD_STORES_ERROR'))
    });
  }

  private loadAccounts(): void {
    this.accountingService.getPostableAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data || []);
        this.reconcileConfiguredAccounts();
      },
      error: () => this.notificationService.showError(this.translate.instant('STORE_ACCOUNTING_CONFIG.LOAD_ACCOUNTS_ERROR'))
    });
  }

  /** Requirement 4: the account dropdowns only ever list postable (leaf) accounts, but a
   *  configuration saved earlier can still point to an account that has since gained children and
   *  is no longer postable. Without this, that field's <mat-select> would render blank (no
   *  matching option) even though the stored value is untouched -- confusing, and risky if it
   *  nudges someone into picking a replacement without realizing the original is still saved.
   *  Runs after BOTH the postable list and the configuration have loaded (each load path calls
   *  this; the guard below makes it a safe no-op until both are ready), fetches any configured
   *  account missing from the postable list, and merges it in so it still displays -- never
   *  clears or changes the stored value itself. */
  private reconcileConfiguredAccounts(): void {
    if (this.mode !== 'edit' || this.accounts().length === 0) return;

    const fields = [
      'inventoryAccountId', 'cogsAccountId', 'inventoryAdjustmentAccountId',
      'additionalCostAccountId', 'purchaseExpenseAccountId', 'freightShippingAccountId', 'customsAccountId',
      'openingBalanceEquityAccountId'
    ];
    const knownIds = new Set(this.accounts().map(a => a.id));
    const missingIds = fields
      .map(name => this.form.get(name)?.value as number | null)
      .filter((id): id is number => !!id && !knownIds.has(id) && !this.reconciledAccountIds.has(id));

    if (missingIds.length === 0) return;
    missingIds.forEach(id => this.reconciledAccountIds.add(id));

    missingIds.forEach(id => {
      this.accountingService.getAccountById(id).subscribe({
        next: (account) => {
          if (!account) return;
          this.accounts.update(list => [...list, account]);
          this.nonPostableAccountIds.update(ids => new Set(ids).add(id));
        },
        error: () => { /* Non-fatal: the field just stays blank, same as before this fix. */ }
      });
    });

    this.notificationService.showWarning(this.translate.instant('STORE_ACCOUNTING_CONFIG.NON_POSTABLE_ACCOUNT_WARNING'));
  }

  // --- Requirement 9: "+ Create Account" from this document -----------------------------------
  openCreateInventoryAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.form.get('inventoryAccountId')?.setValue(created.id);
    });
  }

  openCreateCogsAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.form.get('cogsAccountId')?.setValue(created.id);
    });
  }

  openCreateInventoryAdjustmentAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.form.get('inventoryAdjustmentAccountId')?.setValue(created.id);
    });
  }

  openCreateAdditionalCostAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.form.get('additionalCostAccountId')?.setValue(created.id);
    });
  }

  openCreatePurchaseExpenseAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.form.get('purchaseExpenseAccountId')?.setValue(created.id);
    });
  }

  openCreateFreightShippingAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.form.get('freightShippingAccountId')?.setValue(created.id);
    });
  }

  openCreateCustomsAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.form.get('customsAccountId')?.setValue(created.id);
    });
  }

  openCreateOpeningBalanceEquityAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.form.get('openingBalanceEquityAccountId')?.setValue(created.id);
    });
  }

  loadConfiguration(id: number): void {
    this.isLoading.set(true);
    this.configService.getById(id).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.isLoading.set(false);
        this.reconcileConfiguredAccounts();
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError(this.translate.instant('STORE_ACCOUNTING_CONFIG.LOAD_ERROR'));
        this.router.navigate(['/setup/store-accounting-configurations']);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showWarning(this.translate.instant('STORE_ACCOUNTING_CONFIG.VALIDATION_ERROR'));
      return;
    }

    const raw = this.form.getRawValue();
    this.isSaving.set(true);

    const onSuccess = () => {
      this.isSaving.set(false);
      this.notificationService.showSuccess(this.translate.instant(this.mode === 'edit' ? 'STORE_ACCOUNTING_CONFIG.UPDATE_SUCCESS' : 'STORE_ACCOUNTING_CONFIG.CREATE_SUCCESS'));
      this.router.navigate(['/setup/store-accounting-configurations']);
    };
    const onError = (err: any) => {
      this.isSaving.set(false);
      const msg = err?.error?.message || err?.error || this.translate.instant('STORE_ACCOUNTING_CONFIG.SAVE_ERROR');
      this.notificationService.showError(msg);
    };

    if (this.mode === 'edit' && this.configId) {
      const dto: UpdateStoreAccountingConfigurationDto = {
        inventoryAccountId: raw.inventoryAccountId,
        cogsAccountId: raw.cogsAccountId,
        inventoryAdjustmentAccountId: raw.inventoryAdjustmentAccountId,
        additionalCostAccountId: raw.additionalCostAccountId,
        purchaseExpenseAccountId: raw.purchaseExpenseAccountId,
        freightShippingAccountId: raw.freightShippingAccountId,
        customsAccountId: raw.customsAccountId,
        openingBalanceEquityAccountId: raw.openingBalanceEquityAccountId,
        inventoryAccountingMethod: raw.inventoryAccountingMethod,
        isActive: raw.isActive
      };
      this.configService.update(this.configId, dto).subscribe({ next: onSuccess, error: onError });
    } else {
      const dto: CreateStoreAccountingConfigurationDto = raw;
      this.configService.create(dto).subscribe({ next: onSuccess, error: onError });
    }
  }

  cancel(): void {
    this.router.navigate(['/setup/store-accounting-configurations']);
  }
}
