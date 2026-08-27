import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreService } from '../../../services/store.service';
import { InventoryClosingPeriodService } from '../../../services/inventory-closing-period.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/AuthService.service';
import { Store } from '../../../models/branch.model';
import { InventoryClosingPeriod } from '../../../models/inventory-closing-period.model';

@Component({
  selector: 'app-inventory-closing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './inventory-closing.component.html',
  styleUrls: ['./inventory-closing.component.css'],
})
export class InventoryClosingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private storeService = inject(StoreService);
  private closingService = inject(InventoryClosingPeriodService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);

  form!: FormGroup;
  stores = signal<Store[]>([]);
  history = signal<InventoryClosingPeriod[]>([]);
  isClosing = signal(false);
  isLoadingHistory = signal(false);

  constructor() {
    this.form = this.fb.group({
      storeId: [null, Validators.required],
      periodStart: [null, Validators.required],
      periodEnd: [null, Validators.required],
      manualClosingInventoryValue: [null],
    });
  }

  ngOnInit(): void {
    this.storeService.getAll().subscribe({
      next: (data) => this.stores.set(data || []),
      error: () => this.notificationService.showError(this.translate.instant('INVENTORY_CLOSING.LOAD_STORES_ERROR')),
    });

    this.form.get('storeId')?.valueChanges.subscribe((storeId) => {
      if (storeId) this.loadHistory(storeId);
    });
  }

  loadHistory(storeId: number): void {
    this.isLoadingHistory.set(true);
    this.closingService.getByStoreId(storeId).subscribe({
      next: (res) => {
        this.history.set(res.data || []);
        this.isLoadingHistory.set(false);
      },
      error: () => {
        this.history.set([]);
        this.isLoadingHistory.set(false);
      },
    });
  }

  close(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showWarning(this.translate.instant('INVENTORY_CLOSING.VALIDATION_ERROR'));
      return;
    }

    const v = this.form.value;
    const createdBy = this.authService.currentUser()?.id ?? 0;
    this.isClosing.set(true);

    this.closingService
      .close(
        {
          storeId: v.storeId,
          periodStart: v.periodStart,
          periodEnd: v.periodEnd,
          manualClosingInventoryValue: v.manualClosingInventoryValue ?? undefined,
        },
        createdBy
      )
      .subscribe({
        next: () => {
          this.isClosing.set(false);
          this.notificationService.showSuccess(this.translate.instant('INVENTORY_CLOSING.CLOSE_SUCCESS'));
          this.loadHistory(v.storeId);
        },
        error: (err) => {
          this.isClosing.set(false);
          const msg = err?.error?.message || err?.error || this.translate.instant('INVENTORY_CLOSING.CLOSE_ERROR');
          this.notificationService.showError(msg);
        },
      });
  }
}
