import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DxDataGridModule, DxButtonModule, DxPopupModule, DxTextAreaModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SalesReturn, PurchaseReturn } from '../../../types/sales-return.model';
import { SalesReturnService } from '../../../services/sales-return.service';
import { PurchaseReturnService } from '../../../services/purchase-return.service';
import { AccountingService } from '../../../services/accounting.service';
import { AlertsService } from '../../../services/alerts.service';

@Component({
  selector: 'app-manager-approval',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DxDataGridModule,
    DxButtonModule,
    DxPopupModule,
    DxTextAreaModule,
    TranslateModule
  ],
  templateUrl: './manager-approval.component.html',
  styleUrl: './manager-approval.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerApprovalComponent implements OnInit {
  private salesReturnService = inject(SalesReturnService);
  private purchaseReturnService = inject(PurchaseReturnService);
  private accountingService = inject(AccountingService);
  private alertsService = inject(AlertsService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  // Signals
  salesReturns = signal<SalesReturn[]>([]);
  purchaseReturns = signal<PurchaseReturn[]>([]);
  isApproving = signal<Set<number>>(new Set());
  isRejecting = signal<Set<number>>(new Set());
  selectedReturn = signal<SalesReturn | PurchaseReturn | null>(null);
  showRejectionDialog = signal(false);
  returnType = signal<'sales' | 'purchase'>('sales');

  rejectionForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(10)]]
  });

  // Computed
  pendingSalesReturns = computed(() =>
    this.salesReturns().filter(r => r.status === 'DRAFT' || r.status === 'PENDING_APPROVAL')
  );

  pendingPurchaseReturns = computed(() =>
    this.purchaseReturns().filter(r => r.status === 'DRAFT' || r.status === 'PENDING_APPROVAL')
  );

  ngOnInit() {
    this.loadPendingReturns();
  }

  loadPendingReturns() {
    this.salesReturnService.getPendingReturns().subscribe({
      next: (data) => this.salesReturns.set(data),
      error: (error) => console.error('Failed to load sales returns:', error)
    });

    this.purchaseReturnService.getPendingReturns().subscribe({
      next: (data) => this.purchaseReturns.set(data),
      error: (error) => console.error('Failed to load purchase returns:', error)
    });
  }

  approveSalesReturn(salesReturn: SalesReturn) {
    const approvingSet = new Set(this.isApproving());
    approvingSet.add(salesReturn.id || 0);
    this.isApproving.set(approvingSet);

    // Generate journal entries
    const entries = this.accountingService.createSalesReturnEntry(salesReturn);

    this.salesReturnService.approveSalesReturn(salesReturn.id || 0, entries).subscribe({
      next: () => {
        console.log('Sales return approved successfully');
        this.loadPendingReturns();
        approvingSet.delete(salesReturn.id || 0);
        this.isApproving.set(approvingSet);
      },
      error: (error) => {
        console.error('Failed to approve sales return:', error);
        approvingSet.delete(salesReturn.id || 0);
        this.isApproving.set(approvingSet);
      }
    });
  }

  approvePurchaseReturn(purchaseReturn: PurchaseReturn) {
    const approvingSet = new Set(this.isApproving());
    approvingSet.add(purchaseReturn.id || 0);
    this.isApproving.set(approvingSet);

    // Generate journal entries
    const entries = this.accountingService.createPurchaseReturnEntry(purchaseReturn);

    this.purchaseReturnService.approvePurchaseReturn(purchaseReturn.id || 0, entries).subscribe({
      next: () => {
        console.log('Purchase return approved successfully');
        this.loadPendingReturns();
        approvingSet.delete(purchaseReturn.id || 0);
        this.isApproving.set(approvingSet);
      },
      error: (error) => {
        console.error('Failed to approve purchase return:', error);
        approvingSet.delete(purchaseReturn.id || 0);
        this.isApproving.set(approvingSet);
      }
    });
  }

  openRejectionDialog(returnItem: SalesReturn | PurchaseReturn, type: 'sales' | 'purchase') {
    this.selectedReturn.set(returnItem);
    this.returnType.set(type);
    this.rejectionForm.reset();
    this.showRejectionDialog.set(true);
  }

  rejectReturn() {
    if (!this.rejectionForm.valid || !this.selectedReturn()) {
      return;
    }

    const reason = this.rejectionForm.get('reason')?.value;
    const returnItem = this.selectedReturn();
    const type = this.returnType();

    const rejectingSet = new Set(this.isRejecting());
    rejectingSet.add(returnItem?.id || 0);
    this.isRejecting.set(rejectingSet);

    if (type === 'sales') {
      this.salesReturnService.rejectSalesReturn(returnItem?.id || 0, reason).subscribe({
        next: () => {
          console.log('Sales return rejected');
          this.loadPendingReturns();
          this.showRejectionDialog.set(false);
          rejectingSet.delete(returnItem?.id || 0);
          this.isRejecting.set(rejectingSet);
        },
        error: () => {
          console.error('Failed to reject sales return');
          rejectingSet.delete(returnItem?.id || 0);
          this.isRejecting.set(rejectingSet);
        }
      });
    } else {
      this.purchaseReturnService.rejectPurchaseReturn(returnItem?.id || 0, reason).subscribe({
        next: () => {
          console.log('Purchase return rejected');
          this.loadPendingReturns();
          this.showRejectionDialog.set(false);
          rejectingSet.delete(returnItem?.id || 0);
          this.isRejecting.set(rejectingSet);
        },
        error: () => {
          console.error('Failed to reject purchase return');
          rejectingSet.delete(returnItem?.id || 0);
          this.isRejecting.set(rejectingSet);
        }
      });
    }
  }

  closeRejectionDialog() {
    this.showRejectionDialog.set(false);
    this.selectedReturn.set(null);
    this.rejectionForm.reset();
  }

  getReturnInfo(returnItem: SalesReturn | PurchaseReturn): string {
    if ('invoiceId' in returnItem) {
      return `Invoice: ${returnItem.invoiceId}`;
    } else {
      return `Purchase Invoice: ${returnItem.purchaseInvoiceId}`;
    }
  }
}
