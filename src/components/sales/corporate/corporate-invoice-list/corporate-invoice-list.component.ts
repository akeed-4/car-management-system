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
import { SalesChannel } from '../../../../models/enums/sales-channel.enum';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';

@Component({
  selector: 'app-corporate-invoice-list',
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
  templateUrl: './corporate-invoice-list.component.html',
  styleUrls: ['./corporate-invoice-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateInvoiceListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private salesService = inject(SalesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private responsiveService = inject(ResponsiveService);
  private translateService = inject(TranslateService);
  isMobile = this.responsiveService.isMobile;

  invoices = signal<SalesInvoice[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.salesService.getInvoices().subscribe({
      next: invoices => {
        this.invoices.set(invoices.filter(i => i.salesChannel === SalesChannel.Sharikat));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.INVOICES_LOAD_FAILED');
      }
    });
  }

  refresh(): void {
    this.loadInvoices();
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/corporate/invoices/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/sales/corporate/invoices/edit', e.row.data.id]);
  };

  exportExcel(): void {
    if (!this.grid) { return; }
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('CorporateInvoices');
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'CorporateInvoices.xlsx');
            });
          });
        });
      });
    });
  }

  exportPdf(): void {
    if (!this.grid) { return; }
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({ jsPDFDocument: doc, component: this.grid.instance }).then(() => {
        doc.save('CorporateInvoices.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (inv: SalesInvoice) => inv.invoiceNumber;
  mobileTrackBy = (_index: number, inv: SalesInvoice) => inv.id;

  mobileFields: MobileCardField<SalesInvoice>[] = [
    { label: 'INVOICE.CUSTOMER', value: (inv) => inv.customerName },
    { label: 'INVOICE.INVOICE_DATE', value: (inv) => inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '' },
    { label: 'INVOICE.DUE_DATE', value: (inv) => inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '' },
    { label: 'INVOICE.TOTAL', value: (inv) => inv.totalAmount },
    { label: 'INVOICE.AMOUNT_DUE', value: (inv) => inv.amountDue },
    { label: 'INVOICE.STATUS', value: (inv) => this.translateService.instant('INVOICE.STATUS_' + inv.status?.toUpperCase()) },
  ];

  mobileEdit(inv: SalesInvoice): void {
    this.onEdit({ row: { data: { id: inv.id } } });
  }
}
