import { ChangeDetectionStrategy, Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { SalesService } from '../../../../services/sales.service';
import { ToastService } from '../../../../services/toast.service';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { identity } from 'rxjs';

@Component({
  selector: 'app-sales-return-invoice-list',
  standalone: true,
  imports: [TranslateModule, MatIconModule, SharedDataGridComponent],
  templateUrl: './sales-return-invoice-list.component.html',
  styleUrl: './sales-return-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnInvoiceListComponent {
  @Input() isCashReturn: boolean = false;
  @Input() customTitle: string = 'SALES.RETURN.LIST_TITLE';
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

  /** Config-driven columns -- same fields/formats/i18n keys as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'returnNo', dataType: 'string', caption: 'SALES.RETURN.RETURN_NUMBER', alignment: 'right' },
    { dataField: 'returnDate', dataType: 'date', caption: 'SALES.RETURN.RETURN_DATE', format: 'yyyy-MM-dd', alignment: 'right' },
    { dataField: 'invoiceNo', dataType: 'string', caption: 'SALES.RETURN.ORIGINAL_INVOICE', alignment: 'right' },
    { dataField: 'refundableAmount', dataType: 'number', caption: 'SALES.RETURN.TOTAL_AMOUNT', format: { type: 'currency', currency: 'SAR' }, alignment: 'right' },
    { dataField: '__actions', dataType: 'string', type: 'actions', caption: 'SALES.RETURN.ACTIONS', allowSorting: false, allowFiltering: false },
  ];

  /** Same edit/delete buttons as before ('trash' -> Material's 'delete' icon). */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'SALES.RETURN.EDIT' },
    { id: 'delete', icon: 'delete', labelKey: 'SALES.RETURN.DELETE', cssClass: 'warn' },
  ];

  /** Same sum/count totals as before -- SharedDataGrid's summary items don't support a
   *  customizeText callback, so the previous translated customizeTotalText/customizeCountText
   *  strings (which already use a literal {0} placeholder) are passed straight through as
   *  displayFormat, which DevExtreme substitutes with the computed value the same way. */
  summaryItems: any[] = [
    { column: 'refundableAmount', summaryType: 'sum', valueFormat: { type: 'currency', currency: 'SAR' }, displayFormat: this.translate.instant('SALES.RETURN.TOTAL_SUMMARY') },
    { column: 'returnNo', summaryType: 'count', displayFormat: this.translate.instant('SALES.RETURN.COUNT_SUMMARY') },
  ];

  customizeTotalText = (data: any) => {
    return this.translate.instant('SALES.RETURN.TOTAL_SUMMARY', { 0: data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س' });
  };

  customizeCountText = (data: any) => {
    return this.translate.instant('SALES.RETURN.COUNT_SUMMARY', { 0: data.value || 0 });
  };
constructor() {
  this.onEditClick = this.onEditClick.bind(this);
  this.onPrintClick = this.onPrintClick.bind(this);
  this.deleteInvoice = this.deleteInvoice.bind(this);
}

  /** Dispatches the Shared DataGrid's rowAction the same way DevExtreme's own dxi-button
   *  onClick did -- wrapping the row back into a {row:{data}} shape so onEditClick/
   *  deleteInvoice (below) don't need to change at all, INCLUDING deleteInvoice's existing
   *  `invoice.id` access, which already relied on receiving the raw click event, not the
   *  unwrapped row (see deleteInvoice). */
  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEditClick({ row: { data: e.row } });
    else if (e.actionId === 'delete') this.deleteInvoice({ row: { data: e.row } });
  }

  // Child-to-parent communication methods
  viewDetails(invoice: any): void {
    this.onViewDetails.emit(invoice);
  }
  onEditClick = (e: any) => {
    const invoiceId = e.row.data.id;
    const editRoute = `/sales/return/${invoiceId}/edit`;
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
         this.toastService.showError(this.translate.instant('INVOICE.DELETED_ERROR'));
        }
      });
    }
  }

  addNewInvoice(): void {
    if (this.isCashReturn) {
      this.router.navigate(['/sales/return/cash/new']);
    } else {
      this.router.navigate(['/sales/return/credit/new']);
    }
  }
  getTitle(): string {
    return this.isCashReturn ? this.translate.instant('SALES.RETURN.CASH_LIST_TITLE') : this.translate.instant('SALES.RETURN.CREDIT_LIST_TITLE');
  }

}
