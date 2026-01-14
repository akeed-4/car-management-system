import { ChangeDetectionStrategy, Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sales-return-invoice-list',
  standalone: true,
  imports: [TranslateModule, DxDataGridModule, MatIconModule],
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

  editInvoice(invoice: any): void {
    this.onEdit.emit(invoice);
  }

  deleteInvoice(invoice: any): void {
    this.onDelete.emit(invoice);
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
