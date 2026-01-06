import { ChangeDetectionStrategy, Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';

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

  paymentTypeOptions = [
    { value: 'Cash', text: this.translate.instant('SALES.RETURN.CASH') },
    { value: 'Credit', text: this.translate.instant('SALES.RETURN.CREDIT') }
  ];

  customizeTotalText = (data: any) => {
    return `الإجمالي الكلي: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

  customizeCountText = (data: any) => {
    return `عدد المرتجعات: ${data.value || 0}`;
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
    this.onAddNew.emit();
  }
}
