import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PurchaseAdditionalCostService } from '../../../services/purchase-additional-cost.service';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/AuthService.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { ModalComponent } from '../../shared/modal/modal.component';
import { PurchaseAdditionalCost } from '../../../models/purchase-additional-cost.model';

@Component({
  selector: 'app-purchase-additional-cost-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    HasPermissionDirective,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './purchase-additional-cost-list.component.html',
  styleUrl: './purchase-additional-cost-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseAdditionalCostListComponent {
  private service = inject(PurchaseAdditionalCostService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  /** When set, this list is embedded in a Purchase Invoice's "Additional Costs" tab: only that
   * invoice's costs are shown and the "Purchase Invoice" column is hidden. */
  @Input() purchaseInvoiceId: number | null = null;
  @Output() addRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<number>();

  items = signal<PurchaseAdditionalCost[]>([]);
  loading = signal(false);
  statusFilter = signal<string>('');

  statusOptions = ['Draft', 'Posted', 'Cancelled'];

  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  /** Rows scoped to purchaseInvoiceId when embedded in a Purchase Invoice tab, otherwise every row. */
  private invoiceRows = computed(() => {
    const invoiceId = this.purchaseInvoiceId;
    return invoiceId ? this.items().filter(r => r.purchaseInvoiceId === invoiceId) : this.items();
  });

  filteredItems = computed(() => {
    const filter = this.statusFilter();
    const rows = this.invoiceRows();
    return filter ? rows.filter(r => r.status === filter) : rows;
  });

  summary = computed(() => {
    const rows = this.invoiceRows();
    return {
      total: rows.length,
      draft: rows.filter(r => r.status === 'Draft').length,
      posted: rows.filter(r => r.status === 'Posted').length,
      totalAmount: rows.filter(r => r.status !== 'Cancelled').reduce((sum, r) => sum + r.amount, 0),
    };
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (response) => {
        this.items.set(response.success ? response.data : []);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }

  newCost(): void {
    this.addRequested.emit();
  }

  editCost(id: number): void {
    this.editRequested.emit(id);
  }

  canEdit(item: PurchaseAdditionalCost): boolean {
    return item.status === 'Draft';
  }

  postCost(item: PurchaseAdditionalCost): void {
    const userId = this.authService.currentUser()?.id ?? 0;
    this.service.post(item.id, userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showSuccess('PURCHASE_ADDITIONAL_COST.POSTED');
          this.refresh();
        } else {
          this.notificationService.showError(response.message);
        }
      },
      error: (err) => this.notificationService.showError(err?.error?.message ?? err?.message ?? 'Error'),
    });
  }

  cancelCost(item: PurchaseAdditionalCost): void {
    const userId = this.authService.currentUser()?.id ?? 0;
    this.service.cancel(item.id, userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showSuccess('PURCHASE_ADDITIONAL_COST.CANCELLED');
          this.refresh();
        } else {
          this.notificationService.showError(response.message);
        }
      },
      error: (err) => this.notificationService.showError(err?.error?.message ?? err?.message ?? 'Error'),
    });
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.service.delete(id).subscribe(() => this.refresh());
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }

  onStatusFilterChange(): void {}
}
