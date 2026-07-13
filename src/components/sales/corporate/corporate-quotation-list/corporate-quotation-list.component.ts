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
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { NotificationService } from '@/src/services/notification.service';
import { CorporateQuotation } from '../../../../models/corporate/corporate-quotation.model';

@Component({
  selector: 'app-corporate-quotation-list',
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
  templateUrl: './corporate-quotation-list.component.html',
  styleUrls: ['./corporate-quotation-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateQuotationListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private corporateFleetService = inject(CorporateFleetService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  quotations = signal<CorporateQuotation[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.loading.set(true);
    this.corporateFleetService.getAllQuotations().subscribe({
      next: quotations => {
        this.quotations.set(quotations);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.QUOTATIONS_LOAD_FAILED');
      }
    });
  }

  refresh(): void {
    this.loadQuotations();
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/corporate/quotations/new']);
  }

  onCreateOrder = (e: any): void => {
    this.router.navigate(['/sales/corporate/orders/new'], { queryParams: { quotationId: e.row.data.id } });
  };

  isApproved = (e: any): boolean => {
    return e.row?.data?.status === 'Approved';
  };

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('CorporateQuotations');
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'CorporateQuotations.xlsx');
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
        doc.save('CorporateQuotations.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
