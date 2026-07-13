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
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';

@Component({
  selector: 'app-bank-quotation-list',
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
  templateUrl: './bank-quotation-list.component.html',
  styleUrls: ['./bank-quotation-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankQuotationListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private bankFinancingService = inject(BankFinancingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  quotations = signal<BankQuotation[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.loading.set(true);
    this.bankFinancingService.getAllBankQuotations().subscribe({
      next: quotations => {
        this.quotations.set(quotations);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.QUOTATIONS_LOAD_FAILED');
      }
    });
  }

  refresh(): void {
    this.loadQuotations();
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/bank/quotations/new']);
  }

  onCreateApproval = (): void => {
    this.router.navigate(['/sales/bank/approvals/new']);
  };

  isLocked = (e: any): boolean => {
    return e.row?.data?.status === 'Locked';
  };

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('BankQuotations');
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'BankQuotations.xlsx');
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
        doc.save('BankQuotations.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
