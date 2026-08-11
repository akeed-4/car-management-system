import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule, DxDataGridComponent, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';

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
    TranslateModule,
    MobileCardListComponent
  ],
  providers: [CurrencyPipe],
  templateUrl: './bank-quotation-list.component.html',
  styleUrls: ['./bank-quotation-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankQuotationListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private bankFinancingService = inject(BankFinancingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private currencyPipe = inject(CurrencyPipe);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

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

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: BankQuotation) => item.quotationNumber;
  mobileTrackBy = (_index: number, item: BankQuotation) => item.id;

  mobileFields: MobileCardField<BankQuotation>[] = [
    { label: 'BANK_FINANCING.END_USER_NAME', value: (item) => item.endUserName },
    { label: 'BANK_FINANCING.BANK', value: (item) => item.bankName },
    { label: 'PURCHASE_INVOICE.CAR', value: (item) => item.carDescription },
    { label: 'BANK_FINANCING.VEHICLE_PRICE', value: (item) => this.currencyPipe.transform(item.vehiclePrice, 'SAR') },
    { label: 'BANK_FINANCING.STATUS', value: (item) => this.translate.instant('BANK_FINANCING.STATUS_' + item.status?.toUpperCase()) },
  ];

  mobileIsLocked(item: BankQuotation): boolean {
    return item.status === 'Locked';
  }

  mobileCreateApproval(item: BankQuotation): void {
    this.onCreateApproval();
  }
}
