import { ChangeDetectionStrategy, Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { SalesService } from '../../../../services/sales.service';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-sales-return-invoice-list',
  standalone: true,
  imports: [TranslateModule, DxDataGridModule],
  templateUrl: './sales-return-invoice-list.component.html',
  styleUrl: './sales-return-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnInvoiceListComponent {
  @Input() isCashReturn: boolean = false;
  @Input() customTitle: any;
  @Input() dataSource: any[] = [];

  // Output events for child-to-parent communication
  @Output() onViewDetails = new EventEmitter<any>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onAddNew = new EventEmitter<void>();

  private translate = inject(TranslateService);
  private router = inject(Router);
  private salesService = inject(SalesService);
  private toastService = inject(ToastService);

  paymentTypeOptions = [
    { value: 'Cash', text: this.translate.instant('SALES.RETURN.CASH') },
    { value: 'Credit', text: this.translate.instant('SALES.RETURN.CREDIT') }
  ];

  customizeTotalText = (data: any) => {
    return this.translate.instant('SALES.RETURN.TOTAL_SUMMARY', { 0: data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س' });
  };

  customizeCountText = (data: any) => {
    return this.translate.instant('SALES.RETURN.COUNT_SUMMARY', { 0: data.value || 0 });
  };

  // Child-to-parent communication methods
  viewDetails(invoice: any): void {
    this.onViewDetails.emit(invoice);
  }
  onEditClick = (e: any) => {
    const invoiceId = e.row.data.id;
    const editRoute = this.isCashReturn ? `/sales/return/${invoiceId}/edit` : `/sales/return/${invoiceId}/edit`;
    this.router.navigate([editRoute]);
  }

  onPrintClick = (e: any) => {
    const invoice = e.row.data;
    console.log('Print invoice:', invoice);
    // Implement print functionality
    window.print();
  }

  editInvoice(invoice: any): void {
    this.onEdit.emit(invoice);
  }

  deleteInvoice(invoice: any): void {
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.salesService.deleteInvoice(invoice.id).subscribe({
        next: () => {
          this.toastService.showSuccess('INVOICE.DELETED_SUCCESS');
          // Emit event to parent to handle refresh
          this.onDelete.emit(invoice);
        },
        error: (error) => {
          console.error('Failed to delete invoice', error);
          this.toastService.showError('INVOICE.DELETED_ERROR');
        }
      });
    }
  }

  addNewInvoice(): void {
    this.onAddNew.emit();
  }
  
}
