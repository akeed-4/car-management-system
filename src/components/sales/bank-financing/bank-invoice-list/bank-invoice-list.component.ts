import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { SalesService } from '../../../../services/sales.service';
import { NotificationService } from '@/src/services/notification.service';
import { SalesInvoice } from '../../../../models/sales-invoice.model';
import { SalesChannel } from '../../../../models/enums/sales-channel.enum';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-bank-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    SharedDataGridComponent,
    TranslateModule
  ],
  templateUrl: './bank-invoice-list.component.html',
  styleUrls: ['./bank-invoice-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankInvoiceListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private salesService = inject(SalesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  invoices = signal<SalesInvoice[]>([]);
  loading = signal(false);

  /** Same badge classes/labels as before -- status is not a plain boolean, so
   *  it's ported via a projected cell template rather than the generic
   *  built-in type:'status' template. */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');
  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/widths/formats as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'invoiceNumber', dataType: 'string', caption: 'INVOICE.INVOICE_NUMBER', width: 140 },
    { dataField: 'customerName', dataType: 'string', caption: 'INVOICE.CUSTOMER' },
    { dataField: 'funderBankName', dataType: 'string', caption: 'BANK_FINANCING.BANK' },
    { dataField: 'invoiceDate', dataType: 'date', caption: 'INVOICE.INVOICE_DATE' },
    { dataField: 'totalAmount', dataType: 'number', format: 'currency', caption: 'INVOICE.TOTAL' },
    { dataField: 'status', dataType: 'string', caption: 'INVOICE.STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 80, allowSorting: false, allowFiltering: false },
  ];

  /** Same single edit button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEdit({ row: { data: e.row } });
  }

  /** Row double-click opens the record -- same behavior, adapted to the shared output. */
  onGridRowDblClick(row: any): void {
    this.onEdit({ row: { data: row } });
  }

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.salesService.getInvoices().subscribe({
      next: invoices => {
        this.invoices.set(invoices.filter(i => i.salesChannel === SalesChannel.Bunuk));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.INVOICES_LOAD_FAILED');
      }
    });
  }

  refresh(): void {
    this.loadInvoices();
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/bank/invoices/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/sales/bank/invoices/edit', e.row.data.id]);
  };

  exportExcel(): void {
    const component = this.grid?.getInstance();
    if (!component) return;
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('BankInvoices');
        exportDataGrid({ component, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'BankInvoices.xlsx');
            });
          });
        });
      });
    });
  }

  exportPdf(): void {
    const component = this.grid?.getInstance();
    if (!component) return;
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({ jsPDFDocument: doc, component }).then(() => {
        doc.save('BankInvoices.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
