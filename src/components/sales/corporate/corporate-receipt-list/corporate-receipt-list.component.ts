import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule, DxDataGridComponent, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ReceiptService } from '../../../../services/receipt.service';
import { SalesService } from '../../../../services/sales.service';
import { NotificationService } from '@/src/services/notification.service';
import { Receipt } from '../../../../models/receipt.model';
import { SalesChannel } from '../../../../models/enums/sales-channel.enum';

@Component({
  selector: 'app-corporate-receipt-list',
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
    TranslateModule
  ],
  templateUrl: './corporate-receipt-list.component.html',
  styleUrls: ['./corporate-receipt-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateReceiptListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private receiptService = inject(ReceiptService);
  private salesService = inject(SalesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  receipts = signal<Receipt[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadReceipts();
  }

  /**
   * Receipt has no channel field. Corporate receipts are identified by joining against sales
   * invoices with salesChannel === Sharikat via receipt.referenceId (set when source = Sale) —
   * receipts not linked to a corporate invoice (e.g. manually entered, unlinked receipts) will
   * not appear here.
   */
  loadReceipts(): void {
    this.loading.set(true);
    forkJoin({
      receipts: this.receiptService.getReceipts(),
      invoices: this.salesService.getInvoices()
    }).subscribe({
      next: ({ receipts, invoices }) => {
        const corporateInvoiceIds = new Set(
          invoices.filter(i => i.salesChannel === SalesChannel.Sharikat).map(i => i.id)
        );
        this.receipts.set(receipts.filter(r => r.referenceId != null && corporateInvoiceIds.has(r.referenceId)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.RECEIPTS_LOAD_FAILED');
      }
    });
  }

  refresh(): void {
    this.loadReceipts();
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/corporate/receipts/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/accounts/receipts/edit', e.row.data.id]);
  };

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('CorporateReceipts');
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'CorporateReceipts.xlsx');
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
        doc.save('CorporateReceipts.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
