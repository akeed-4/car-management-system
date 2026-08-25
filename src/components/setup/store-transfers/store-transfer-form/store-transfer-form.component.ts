import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreTransferService } from '../../../../services/store-transfer.service';
import { StoreService } from '../../../../services/store.service';
import { InventoryService } from '../../../../services/inventory.service';
import { NotificationService } from '../../../../services/notification.service';
import { StoreAccountingConfigurationService } from '../../../../services/store-accounting-configuration.service';
import { warnIfStoreNotConfigured } from '../../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { Store } from '../../../../models/branch.model';
import { CreateStoreTransferDto } from '../../../../models/store-transfer.model';

const differentStoresValidator: ValidatorFn = (group): ValidationErrors | null => {
  const from = group.get('fromStoreId')?.value;
  const to = group.get('toStoreId')?.value;
  return from && to && from === to ? { sameStore: true } : null;
};

@Component({
  selector: 'app-store-transfer-form',
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
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './store-transfer-form.component.html',
  styleUrls: ['./store-transfer-form.component.css']
})
export class StoreTransferFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private transferService = inject(StoreTransferService);
  private storeService = inject(StoreService);
  private inventoryService = inject(InventoryService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private storeAccountingConfigService = inject(StoreAccountingConfigurationService);
  private dialog = inject(MatDialog);

  form!: FormGroup;
  isSaving = signal(false);
  stores = signal<Store[]>([]);
  cars = this.inventoryService.cars$;

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  constructor() {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      transferDate: [new Date().toISOString().split('T')[0], Validators.required],
      fromStoreId: [null, Validators.required],
      toStoreId: [null, Validators.required],
      notes: [''],
      items: this.fb.array([this.newItemGroup()])
    }, { validators: differentStoresValidator });
  }

  private newItemGroup() {
    return this.fb.group({
      carId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  addItem(): void {
    this.items.push(this.newItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
  }

  onStoreSelectionChange(storeId: number): void {
    const selectedStore = this.stores().find(s => s.id === storeId);
    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, selectedStore?.nameEn ?? '').subscribe();
  }

  ngOnInit(): void {
    this.storeService.getAll().subscribe({
      next: (data) => this.stores.set(data || []),
      error: () => this.notificationService.showError(this.translate.instant('STORE_TRANSFER.LOAD_STORES_ERROR'))
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const message = this.form.hasError('sameStore')
        ? this.translate.instant('STORE_TRANSFER.SAME_STORE_ERROR')
        : this.translate.instant('STORE_TRANSFER.VALIDATION_ERROR');
      this.notificationService.showWarning(message);
      return;
    }

    const raw = this.form.getRawValue();
    const dto: CreateStoreTransferDto = raw;
    this.isSaving.set(true);

    this.transferService.create(dto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notificationService.showSuccess(this.translate.instant('STORE_TRANSFER.CREATE_SUCCESS'));
        this.router.navigate(['/setup/store-transfers']);
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err?.error?.message || err?.error || this.translate.instant('STORE_TRANSFER.SAVE_ERROR');
        this.notificationService.showError(msg);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/setup/store-transfers']);
  }
}
