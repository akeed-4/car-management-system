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
import { ReceiptVoucher } from '../../../../models/receipt-voucher.model';
import { SalesChannel } from '../../../../models/enums/sales-channel.enum';

@Component({
  selector: 'app-bank-collection-list',
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
  templateUrl: './bank-collection-list.component.html',
  styleUrls: ['./bank-collection-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCollectionListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private receiptService = inject(ReceiptService);
  private salesService = inject(SalesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  receipts = signal<ReceiptVoucher[]>([]);
  loading = signal(false);

  /**
   * ReceiptVoucher has no channel field. Bank collections are identified by
   * joining against sales invoices with salesChannel === Bunuk via
   * receipt.salesInvoiceId — receipts not linked to a bank-financed invoice
   * (e.g. manually entered, unlinked receipts) will not appear here.
   */
  ngOnInit(): void {
    this.loadReceipts();
  }

  loadReceipts(): void {
    this.loading.set(true);
    forkJoin({
      receipts: this.receiptService.getReceipts(),
      invoices: this.salesService.getInvoices()
    }).subscribe({
      next: ({ receipts, invoices }) => {
        const bankInvoiceIds = new Set(
          invoices.filter(i => i.salesChannel === SalesChannel.Bunuk).map(i => i.id)
        );
        this.receipts.set(receipts.filter(r => r.salesInvoiceId != null && bankInvoiceIds.has(r.salesInvoiceId)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.COLLECTIONS_LOAD_FAILED');
      }
    });
  }

  refresh(): void {
    this.loadReceipts();
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/bank/collections/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/accounts/receipts/edit', e.row.data.id]);
  };

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('BankCollections');
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'BankCollections.xlsx');
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
        doc.save('BankCollections.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
