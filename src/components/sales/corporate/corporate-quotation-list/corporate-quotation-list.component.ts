import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { NotificationService } from '@/src/services/notification.service';
import { CorporateQuotation } from '../../../../models/corporate/corporate-quotation.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

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
    SharedDataGridComponent,
    TranslateModule
  ],
  templateUrl: './corporate-quotation-list.component.html',
  styleUrls: ['./corporate-quotation-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateQuotationListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private corporateFleetService = inject(CorporateFleetService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  quotations = signal<CorporateQuotation[]>([]);
  loading = signal(false);

  /** Screen-specific status badge, passed generically to the Shared DataGrid. */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/formats as before (i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'quotationNumber', dataType: 'string', caption: 'CORPORATE.QUOTATION_NUMBER', width: 140 },
    { dataField: 'customerName', dataType: 'string', caption: 'CORPORATE.CUSTOMER' },
    { dataField: 'quotationDate', dataType: 'date', caption: 'CORPORATE.QUOTATION_DATE' },
    { dataField: 'expiryDate', dataType: 'date', caption: 'CORPORATE.EXPIRY_DATE' },
    { dataField: 'totalAmount', dataType: 'number', format: 'currency', caption: 'INVOICE.TOTAL' },
    { dataField: 'status', dataType: 'string', caption: 'CORPORATE.QUOTATION_STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'CORPORATE.ACTIONS', width: 140, allowSorting: false, allowFiltering: false },
  ];

  /** Same "create order" action as before -- only visible for Approved quotations. */
  rowActions: sharedGridRowActionDto[] = [
    {
      id: 'createOrder', icon: 'add', labelKey: 'CORPORATE.CREATE_ORDER',
      visible: (rowData) => rowData?.status === 'Approved',
    },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'createOrder') this.onCreateOrder(e.row);
  }

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.loading.set(true);
    this.corporateFleetService.getAllQuotations().subscribe({
      next: (quotations: any) => {
        this.quotations.set(quotations.data || quotations || []);
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
    const id = (e?.row?.data ?? e)?.id;
    this.router.navigate(['/sales/corporate/orders/new'], { queryParams: { quotationId: id } });
  };

  exportExcel(): void {
    const component = this.grid?.getInstance();
    if (!component) { return; }
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('CorporateQuotations');
        exportDataGrid({ component, worksheet }).then(() => {
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
    const component = this.grid?.getInstance();
    if (!component) { return; }
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({ jsPDFDocument: doc, component }).then(() => {
        doc.save('CorporateQuotations.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
