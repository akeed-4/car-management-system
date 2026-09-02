import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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
import { ReceiptService } from '../../../../services/receipt.service';
import { SalesService } from '../../../../services/sales.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../../services/permission.service';
import { Receipt } from '../../../../models/receipt.model';
import { SalesChannel } from '../../../../models/enums/sales-channel.enum';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

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
    SharedDataGridComponent,
    TranslateModule
  ],
  templateUrl: './corporate-receipt-list.component.html',
  styleUrls: ['./corporate-receipt-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateReceiptListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private receiptService = inject(ReceiptService);
  private salesService = inject(SalesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  permissionService = inject(PermissionService);

  receipts = signal<Receipt[]>([]);
  loading = signal(false);

  /** Config-driven columns -- same fields/formats as before (i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'voucherNumber', dataType: 'string', caption: 'ACCOUNTS.RECEIPTS.COL_VOUCHER_NUMBER', width: 140 },
    { dataField: 'customerName', dataType: 'string', caption: 'ACCOUNTS.RECEIPTS.COL_CUSTOMER' },
    { dataField: 'date', dataType: 'date', caption: 'ACCOUNTS.RECEIPTS.COL_DATE' },
    { dataField: 'amount', dataType: 'number', format: 'currency', caption: 'ACCOUNTS.RECEIPTS.COL_AMOUNT' },
    { dataField: 'paymentMethod', dataType: 'string', caption: 'INVOICE.PAYMENT_METHOD' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 80, allowSorting: false, allowFiltering: false },
  ];

  /** Same single edit button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('sales.corporate.receipts.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEdit(e.row);
  }

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
    const id = (e?.row?.data ?? e)?.id;
    this.router.navigate(['/accounts/receipts/edit', id]);
  };

  exportExcel(): void {
    const component = this.grid?.getInstance();
    if (!component) { return; }
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('CorporateReceipts');
        exportDataGrid({ component, worksheet }).then(() => {
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
    const component = this.grid?.getInstance();
    if (!component) { return; }
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({ jsPDFDocument: doc, component }).then(() => {
        doc.save('CorporateReceipts.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
