import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule, DxDataGridComponent, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SalesService } from '../../../../services/sales.service';
import { NotificationService } from '@/src/services/notification.service';
import { SalesInvoice } from '../../../../models/sales-invoice.model';
import { SaleType } from '../../../../models/sales-enhancements.model';
import { SalesChannel } from '../../../../models/enums/sales-channel.enum';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';

@Component({
  selector: 'app-installment-sale-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    DxDataGridModule,
    DxTemplateModule,
    TranslateModule,
    MobileCardListComponent
  ],
  templateUrl: './installment-sale-list.component.html',
  styleUrls: ['./installment-sale-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstallmentSaleListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private salesService = inject(SalesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  invoices = signal<SalesInvoice[]>([]);
  loading = signal(false);

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: SalesInvoice) => item.invoiceNumber;
  mobileTrackBy = (_index: number, item: SalesInvoice) => item.id;

  mobileFields: MobileCardField<SalesInvoice>[] = [
    { label: 'INVOICE.CUSTOMER', value: (item) => item.customerName },
    { label: 'INVOICE.INVOICE_DATE', value: (item) => item.invoiceDate },
    { label: 'INVOICE.DOWN_PAYMENT', value: (item) => item.downPayment },
    { label: 'INVOICE.TOTAL', value: (item) => item.totalAmount },
    { label: 'INVOICE.AMOUNT_DUE', value: (item) => item.amountDue },
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
        this.invoices.set(invoices.filter(i => i.saleType === SaleType.Installments && (i.salesChannel === undefined || i.salesChannel === SalesChannel.Afrad)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('DIRECT_SALES.INSTALLMENT.LOAD_FAILED');
      }
    });
  }

  refresh(): void {
    this.loadInvoices();
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/direct/installment-sale/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/sales/direct/installment-sale/edit', e.row.data.id]);
  };

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('InstallmentSales');
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'InstallmentSales.xlsx');
            });
          });
        });
      });
    });
  }

  exportPdf(): void {
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({ jsPDFDocument: doc, component: this.grid.instance }).then(() => {
        doc.save('InstallmentSales.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
