import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { SalesService } from '../../../../services/sales.service';
import { NotificationService } from '@/src/services/notification.service';
import { SalesInvoice } from '../../../../models/sales-invoice.model';
import { SaleType } from '../../../../models/sales-enhancements.model';
import { SalesChannel } from '../../../../models/enums/sales-channel.enum';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-cash-sale-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    TranslateModule,
    SharedDataGridComponent
  ],
  templateUrl: './cash-sale-list.component.html',
  styleUrls: ['./cash-sale-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashSaleListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private salesService = inject(SalesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  invoices = signal<SalesInvoice[]>([]);
  loading = signal(false);

  /** Config-driven columns -- same fields/formats/i18n keys as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'invoiceNumber', dataType: 'string', caption: 'INVOICE.INVOICE_NUMBER', width: 140 },
    { dataField: 'customerName', dataType: 'string', caption: 'INVOICE.CUSTOMER' },
    { dataField: 'invoiceDate', dataType: 'date', caption: 'INVOICE.INVOICE_DATE' },
    { dataField: 'totalAmount', dataType: 'number', caption: 'INVOICE.TOTAL', format: 'currency' },
    { dataField: 'amountPaid', dataType: 'number', caption: 'INVOICE.AMOUNT_PAID', format: 'currency' },
    { dataField: 'status', dataType: 'string', caption: 'INVOICE.STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 80, allowSorting: false, allowFiltering: false },
  ];

  /** Same single edit button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT' },
  ];

  /** Screen-specific status badge, passed generically to the Shared DataGrid. */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');
  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEdit({ row: { data: e.row } });
  }

  onGridRowDblClick(rowData: any): void {
    this.onEdit({ row: { data: rowData } });
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: SalesInvoice) => item.invoiceNumber;
  mobileTrackBy = (_index: number, item: SalesInvoice) => item.id;

  mobileFields: MobileCardField<SalesInvoice>[] = [
    { label: 'INVOICE.CUSTOMER', value: (item) => item.customerName },
    { label: 'INVOICE.INVOICE_DATE', value: (item) => item.invoiceDate },
    { label: 'INVOICE.TOTAL', value: (item) => item.totalAmount },
    { label: 'INVOICE.AMOUNT_PAID', value: (item) => item.amountPaid },
    { label: 'INVOICE.STATUS', value: (item) => this.translate.instant('INVOICE.STATUS_' + item.status?.toUpperCase()) },
  ];

  mobileEdit(item: SalesInvoice): void {
    this.onEdit({ row: { data: item } });
  }

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.salesService.getInvoices().subscribe({
      next: invoices => {
        this.invoices.set(invoices.filter(i => i.saleType === SaleType.Cash && (i.salesChannel === undefined || i.salesChannel === SalesChannel.Afrad)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('DIRECT_SALES.CASH.LOAD_FAILED');
      }
    });
  }

  refresh(): void {
    this.loadInvoices();
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/direct/cash-sale/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/sales/direct/cash-sale/edit', e.row.data.id]);
  };

  exportExcel(): void {
    const component = this.grid?.getInstance();
    if (!component) return;
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('CashSales');
        exportDataGrid({ component, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'CashSales.xlsx');
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
        doc.save('CashSales.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
