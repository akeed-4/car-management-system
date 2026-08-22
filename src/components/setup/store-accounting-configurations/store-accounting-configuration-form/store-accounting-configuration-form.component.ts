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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreAccountingConfigurationService } from '../../../../services/store-accounting-configuration.service';
import { StoreService } from '../../../../services/store.service';
import { AccountingService } from '../../../accounting/accounting.service';
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
  private translate = inject(TranslateService);

  form!: FormGroup;
  mode: FormMode = 'create';
  configId: number | null = null;
  isLoading = signal(false);
  isSaving = signal(false);
  stores = signal<Store[]>([]);
  accounts = signal<Account[]>([]);

  constructor() {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      storeId: [null, Validators.required],
      inventoryAccountId: [null, Validators.required],
      cogsAccountId: [null, Validators.required],
      inventoryAdjustmentAccountId: [null, Validators.required],
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
      next: (data) => this.accounts.set(data || []),
      error: () => this.notificationService.showError(this.translate.instant('STORE_ACCOUNTING_CONFIG.LOAD_ACCOUNTS_ERROR'))
    });
  }

  loadConfiguration(id: number): void {
    this.isLoading.set(true);
    this.configService.getById(id).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.isLoading.set(false);
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
