import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule, DxDataGridComponent, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SalesService } from '../../../../services/sales.service';
import { NotificationService } from '@/src/services/notification.service';
import { SalesInvoice } from '../../../../models/sales-invoice.model';
import { SalesChannel } from '../../../../models/enums/sales-channel.enum';

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
    DxDataGridModule,
    DxTemplateModule,
    TranslateModule
  ],
  templateUrl: './bank-invoice-list.component.html',
  styleUrls: ['./bank-invoice-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankInvoiceListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private salesService = inject(SalesService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  invoices = signal<SalesInvoice[]>([]);
  loading = signal(false);

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
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('BankInvoices');
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
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
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({ jsPDFDocument: doc, component: this.grid.instance }).then(() => {
        doc.save('BankInvoices.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
