import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDropDownBoxModule } from 'devextreme-angular';
import { SharedDataGridComponent } from '../shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto } from '../../../models/grid.model';

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
    SharedDataGridComponent,
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

  /** Config-driven columns for the Shared DataGrid (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'invoiceNumber', dataType: 'string', caption: 'ACCOUNTS.FORM.INVOICE_NUMBER' },
    { dataField: 'invoiceDate', dataType: 'date', format: 'dd/MM/yyyy', caption: 'ACCOUNTS.FORM.INVOICE_DATE' },
    { dataField: 'totalAmount', dataType: 'number', format: 'currency', caption: 'ACCOUNTS.FORM.TOTAL' },
    { dataField: 'amountPaid', dataType: 'number', format: 'currency', caption: 'ACCOUNTS.FORM.PAID' },
    { dataField: 'amountDue', dataType: 'number', format: 'currency', caption: 'ACCOUNTS.FORM.DUE', cssClass: 'due-amount' },
  ];
  
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
