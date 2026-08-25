import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { PaymentService } from '../../../services/payment.service';
import { Payment } from '../../../models/payment.model';
import { AccountingService } from '../../accounting/accounting.service';
import { Account } from '../../accounting/models';
import CustomStore from 'devextreme/data/custom_store';
import { firstValueFrom, map } from 'rxjs';
import { ToastService } from '@/src/services/toast.service';
import { NotificationService } from '@/src/services/notification.service';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    SharedDataGridComponent,
  ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css',
  // DatePipe/CurrencyPipe are injected below for the mobile card list -- they must be provided
  // here or construction fails with NullInjectorError (same as bank-order-list.component.ts).
  providers: [DatePipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent implements OnDestroy, AfterViewInit, OnInit {
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private accountingService = inject(AccountingService);
  private toastService = inject(NotificationService);
  private responsiveService = inject(ResponsiveService);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);
  isMobile = this.responsiveService.isMobile;

  @ViewChild('toastContainer') toastContainer!: ElementRef;

  /** Config-driven columns for the Shared DataGrid -- same fields/formats the
   *  inline dxi-column definitions used before (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'voucherNumber', dataType: 'string', alignment: 'right', caption: 'ACCOUNTS.PAYMENTS.COL_VOUCHER_NUMBER' },
    { dataField: 'voucherDate', dataType: 'date', format: 'yyyy-MM-dd', alignment: 'right', caption: 'ACCOUNTS.PAYMENTS.COL_DATE' },
    { dataField: 'supplierName', dataType: 'string', alignment: 'right', caption: 'ACCOUNTS.PAYMENTS.COL_SUPPLIER' },
    { dataField: 'purchaseInvoiceNumber', dataType: 'string', alignment: 'right', caption: 'ACCOUNTS.PAYMENTS.COL_INVOICE' },
    { dataField: 'amount', dataType: 'number', format: { type: 'currency', precision: 2, currency: 'SAR' }, alignment: 'right', caption: 'ACCOUNTS.PAYMENTS.COL_AMOUNT' },
    { dataField: '__actions', dataType: 'string', alignment: 'center', width: 120, caption: 'ACCOUNTS.PAYMENTS.COL_ACTIONS', type: 'actions', allowSorting: false, allowFiltering: false },
  ];

  /** Row actions -- same edit/delete behavior via the shared template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT' },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn' },
  ];

  /** Totals summary -- same amount sum as the previous dxo-summary block. */
  get summaryItems(): any[] {
    return [{ column: 'amount', summaryType: 'sum', alignment: 'right' }];
  }

  /** Single dispatcher for the Shared DataGrid's rowAction output. */
  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.editPayment(wrapped);
    else if (e.actionId === 'delete') this.deletePayment(wrapped);
  }

  
  editPayment = (e: any) => {
    const paymentId = e.row.data.id;
    if (paymentId) {
      this.router.navigate(['/accounts/payments/edit', paymentId]);
    } else {
      console.error('Payment ID not found:', e.row.data);
    }
  }


  deletePayment = (e: any) => {
        const paymentId = e.row.data.id;
    if (confirm(this.translate.instant('ACCOUNTS.PAYMENTS.CONFIRM_DELETE') || 'Are you sure you want to delete this payment?')) {
      this.paymentService.deletePayment(paymentId).subscribe({
        next: () => {
          // Refresh the grid data
          this.dataSource.load();
          this.toastService.showSuccess(this.translate.instant('ACCOUNTS.PAYMENTS.DELETED') || 'Payment deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting payment:', error);
          alert(this.translate.instant('ACCOUNTS.PAYMENTS.ERROR_DELETING') || 'Error deleting payment');
        }
      });
    }
  }

  trackByPaymentId(index: number, payment: Payment): number {
    return payment.id!;
  }

  payments = toSignal(this.paymentService.payments$, {initialValue: []});
  accounts = signal<Account[]>([]);

  // Mirrors the same rows the grid's CustomStore loads, kept as a plain signal so the mobile
  // card list (which needs a concrete array, not a DevExtreme data source) can render/refresh
  // independently of payments$ (a one-shot Observable captured at service construction time,
  // never re-emitting after a delete).
  mobilePayments = signal<Payment[]>([]);

  dataSource = new CustomStore({
    key: 'id',
    load: (loadOptions) => {
      return firstValueFrom(this.paymentService.getPayments()).then(data => {
        this.mobilePayments.set(data);
        return data;
      });
    }
  });

  ngOnInit(): void {
    // Populates mobilePayments regardless of which view (grid vs. card list) actually renders --
    // the dx-data-grid's own [dataSource] binding would otherwise be the only thing triggering
    // this load, and on mobile the grid never mounts.
    this.dataSource.load();
  }

  ngAfterViewInit(): void {
    // Set the toast container for this component
    if (this.toastContainer) {
      // this.toastService.setContainer('toast-payments-container');
    }
  }

  ngOnDestroy(): void {
    // Clear the container when component is destroyed
    // this.toastService.clearContainer();
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: Payment) => item.voucherNumber;
  mobileTrackBy = (_index: number, item: Payment) => item.id!;

  mobileFields: MobileCardField<Payment>[] = [
    { label: 'ACCOUNTS.PAYMENTS.COL_DATE', value: (item) => item.voucherDate ? this.datePipe.transform(item.voucherDate, 'yyyy-MM-dd') : '' },
    { label: 'ACCOUNTS.PAYMENTS.COL_SUPPLIER', value: (item) => (item as any).supplierName },
    { label: 'ACCOUNTS.PAYMENTS.COL_INVOICE', value: (item) => (item as any).purchaseInvoiceNumber },
    { label: 'ACCOUNTS.PAYMENTS.COL_AMOUNT', value: (item) => this.currencyPipe.transform(item.amount, 'SAR') },
  ];

  mobileEdit(item: Payment): void {
    if (item.id) {
      this.router.navigate(['/accounts/payments/edit', item.id]);
    }
  }

  mobileDelete(item: Payment): void {
    this.deletePayment({ row: { data: item } });
  }
}