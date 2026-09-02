import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, inject, signal, viewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../../services/permission.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';
import { MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

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
    SharedDataGridComponent,
    TranslateModule
  ],
  providers: [CurrencyPipe],
  templateUrl: './bank-quotation-list.component.html',
  styleUrls: ['./bank-quotation-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankQuotationListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private bankFinancingService = inject(BankFinancingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private currencyPipe = inject(CurrencyPipe);
  permissionService = inject(PermissionService);

  quotations = signal<BankQuotation[]>([]);
  loading = signal(false);

  /** Same badge classes/labels as before -- status is not a plain boolean, so
   *  it's ported via a projected cell template rather than the generic
   *  built-in type:'status' template. */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');
  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/widths/formats as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'quotationNumber', dataType: 'string', caption: 'CORPORATE.QUOTATION_NUMBER', width: 140 },
    { dataField: 'endUserName', dataType: 'string', caption: 'BANK_FINANCING.END_USER_NAME' },
    { dataField: 'bankName', dataType: 'string', caption: 'BANK_FINANCING.BANK' },
    { dataField: 'carDescription', dataType: 'string', caption: 'PURCHASE_INVOICE.CAR' },
    { dataField: 'vehiclePrice', dataType: 'number', format: 'currency', caption: 'BANK_FINANCING.VEHICLE_PRICE' },
    { dataField: 'status', dataType: 'string', caption: 'BANK_FINANCING.STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'CORPORATE.ACTIONS', width: 140, allowSorting: false, allowFiltering: false },
  ];

  /** Same conditional "record approval" action as before -- only shown while
   *  the quotation is Locked (adapts isLocked's existing predicate). */
  rowActions: sharedGridRowActionDto[] = [
    {
      id: 'createApproval', icon: 'add', labelKey: 'BANK_FINANCING.RECORD_APPROVAL',
      visible: (rowData) => this.isLocked({ row: { data: rowData } }) && this.permissionService.hasPermission('sales.bank.quotations.view'),
    },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'createApproval') this.onCreateApproval();
  }

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
    const component = this.grid?.getInstance();
    if (!component) return;
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('BankQuotations');
        exportDataGrid({ component, worksheet }).then(() => {
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
    const component = this.grid?.getInstance();
    if (!component) return;
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({ jsPDFDocument: doc, component }).then(() => {
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
