import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule, DxDropDownBoxModule } from 'devextreme-angular';

export interface InvoiceData {
  id: number;
  invoiceNumber: string;
  invoiceDate: Date;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
}

@Component({
  selector: 'app-invoice-dropdown-grid',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    DxDataGridModule,
    DxDropDownBoxModule,
  ],
  templateUrl: './invoice-dropdown-grid.component.html',
  styleUrl: './invoice-dropdown-grid.component.css',
})
export class InvoiceDropdownGridComponent {
  @Input() dataSource: InvoiceData[] = [];
  @Input() placeholder: string = 'Select Invoice';
  @Input() label: string = 'Invoice';
  @Input() disabled: boolean = false;
  
  @Output() selectionChanged = new EventEmitter<InvoiceData>();
  @Output() valueChanged = new EventEmitter<number | null>();
  
  isDropDownOpened = signal(false);
  gridBoxValue = signal<number[]>([]);

  constructor(private translate: TranslateService) {}

  getDisplayExpr = (item: InvoiceData | null) => {
    if (!item) return '';
    return `${item.invoiceNumber} - ${this.translate.instant('INVOICE.AMOUNT_DUE')}: ${item.amountDue}`;
  };

  onInvoiceSelectionChanged(e: any) {
    const selectedInvoice = e.selectedRowsData[0];
    if (selectedInvoice) {
      this.gridBoxValue.set([selectedInvoice.id]);
      this.isDropDownOpened.set(false);
      this.selectionChanged.emit(selectedInvoice);
    }
  }

  onDropDownBoxValueChanged(e: any) {
    if (e.value && e.value.length > 0) {
      const invoiceId = e.value[0];
      const invoice = this.dataSource.find(inv => inv.id === invoiceId);
      if (invoice) {
        this.valueChanged.emit(invoiceId);
      }
    } else {
      this.valueChanged.emit(null);
    }
  }

  clearSelection() {
    this.gridBoxValue.set([]);
  }
}
