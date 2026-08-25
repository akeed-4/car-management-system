import { ChangeDetectionStrategy, Component, inject, Input, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { SalesService } from '../../../../services/sales.service';
import { ToastService } from '../../../../services/toast.service';
import { NotificationService } from '@/src/services/notification.service';
import { SalesInvoice } from '../../../../models/sales-invoice.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-sales-invoice-list',
  standalone: true,
  imports: [RouterLink, TranslateModule, MatIconModule, MatButtonModule, MatTooltipModule, SharedDataGridComponent],
  templateUrl: './sales-invoice-list.component.html',
  styleUrl: './sales-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceListComponent {
  @Input() isCashInvoice: boolean = false;
  @Input() customTitle: any;
  @Input() dataSource: any;

  private salesService = inject(SalesService);
  private router = inject(Router);
  private toastService = inject(NotificationService);
  private translate = inject(TranslateService);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;
  allInvoices = toSignal(this.salesService.getInvoices(), { initialValue: [] });

  /** Config-driven columns -- same fields/formats/i18n keys as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'invoiceNumber', dataType: 'string', caption: 'SALES.COL_INVOICE_NUMBER', width: 150, alignment: 'right' },
    { dataField: 'invoiceDate', dataType: 'date', caption: 'SALES.COL_DATE', format: 'yyyy-MM-dd', width: 120, alignment: 'right' },
    { dataField: 'customerName', dataType: 'string', caption: 'SALES.COL_CUSTOMER', minWidth: 200, alignment: 'right' },
    { dataField: 'totalAmount', dataType: 'number', caption: 'SALES.COL_TOTAL', format: { type: 'currency', currency: 'SAR' }, width: 130, alignment: 'right' },
    { dataField: 'paymentStatus', dataType: 'string', caption: 'SALES.COL_STATUS', width: 120, alignment: 'right' },
    { dataField: '__actions', dataType: 'string', type: 'actions', caption: 'PURCHASES.ACTIONS', width: 200, cssClass: 'no-print', allowSorting: false, allowFiltering: false },
  ];

  /** Same print + edit buttons as before (in the same order). */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'print', icon: 'print', labelKey: 'PURCHASES.PRINT_INVOICE' },
    { id: 'edit', icon: 'edit', labelKey: 'PURCHASES.EDIT_INVOICE' },
  ];

  /** Same sum/count totals as before -- SharedDataGrid's summary items don't support a
   *  customizeText callback, so the previous customizeTotalText/customizeCountText
   *  formatting is reproduced via displayFormat's own {0} placeholder substitution. */
  summaryItems: any[] = [
    { column: 'totalAmount', summaryType: 'sum', valueFormat: { type: 'currency', currency: 'SAR' }, displayFormat: 'المجموع: {0}' },
    { column: 'invoiceNumber', summaryType: 'count', displayFormat: 'عدد الفواتير: {0}' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'print') this.onPrintClick({ row: { data: e.row } });
    else if (e.actionId === 'edit') this.onEditClick({ row: { data: e.row } });
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: SalesInvoice) => item.invoiceNumber;
  mobileTrackBy = (_index: number, item: SalesInvoice) => item.id;

  mobileFields: MobileCardField<SalesInvoice>[] = [
    { label: 'SALES.COL_DATE', value: (item) => item.invoiceDate },
    { label: 'SALES.COL_CUSTOMER', value: (item) => item.customerName },
    { label: 'SALES.COL_TOTAL', value: (item) => item.totalAmount },
    { label: 'SALES.COL_STATUS', value: (item) => (item as any).paymentStatus },
  ];

  mobileEditClick(item: SalesInvoice): void {
    this.onEditClick({ row: { data: item } });
  }

  mobilePrintClick(item: SalesInvoice): void {
    this.onPrintClick({ row: { data: item } });
  }

  invoices = computed(() => {
    // If dataSource is provided, use it directly
    if (this.dataSource) {
      return this.dataSource;
    }

    // Otherwise, filter from all invoices
    const all = this.allInvoices();
    if (this.isCashInvoice) {
      // Filter for cash invoices - use isCash property if available, otherwise fallback to paymentMethod
      return all.filter(invoice => invoice.isCash === true || (invoice.isCash === undefined && invoice.paymentMethod === 'Cash'));
    } else {
      // Filter for credit invoices - use isCash property if available, otherwise fallback to paymentMethod
      return all.filter(invoice => invoice.isCash === false || (invoice.isCash === undefined && invoice.paymentMethod !== 'Cash'));
    }
  });

  customizeTotalText = (data: any) => {
    return `المجموع: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`;
  };

  customizeCountText = (data: any) => {
    return `عدد الفواتير: ${data.value}`;
  }

  onEditClick = (e: any) => {
    const invoiceId = e.row.data.id;
    const editRoute = this.isCashInvoice ? `/sales/invoice/cash/edit/${invoiceId}` : `/sales/invoice/credit/edit/${invoiceId}`;
    this.router.navigate([editRoute]);
  }

  onPrintClick = (e: any) => {
    const invoiceId = e.row.data.id;
    // Opens the dedicated print route in its own tab so the printable page never inherits the
    // app's sidebar/toolbar -- see PrintableSalesInvoiceComponent.
    window.open(`/sales/invoice/print/${invoiceId}`, '_blank');
  }

  deleteInvoice(invoice: any): void {
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.salesService.deleteInvoice(invoice.id).subscribe({
        next: () => {
          this.toastService.showSuccess('INVOICE.DELETED_SUCCESS');
          // Refresh the data
          this.allInvoices = toSignal(this.salesService.getInvoices(), { initialValue: [] });
        },
        error: (error) => {
          console.error('Failed to delete invoice', error);
         this.toastService.showError(this.translate.instant('INVOICE.DELETED_ERROR'));
        }
      });
    }
  }

}
