import { ChangeDetectionStrategy, Component, inject, Input, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SalesService } from '../../../../services/sales.service';
import { ToastService } from '../../../../services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

@Component({
  selector: 'app-sales-invoice-list',
  standalone: true,
  imports: [RouterLink, TranslateModule, DxDataGridModule, MatIconModule, MatButtonModule, MatTooltipModule],
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
  allInvoices = toSignal(this.salesService.getInvoices(), { initialValue: [] });

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
