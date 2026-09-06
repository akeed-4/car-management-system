import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ReportFilterPanelComponent } from '../report-filter-panel/report-filter-panel.component';
import { ReportToolbarComponent } from '../report-toolbar/report-toolbar.component';
import { ReportColumnConfig, ReportFilterFieldConfig, ReportFilters } from '../../../../../models/reportmodel/car-report.types';

@Component({
  selector: 'app-car-report-shell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DxDataGridModule,
    TranslateModule,
    ReportFilterPanelComponent,
    ReportToolbarComponent,
  ],
  templateUrl: './car-report-shell.component.html',
  styleUrl: './car-report-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarReportShellComponent {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  @Input({ required: true }) titleKey!: string;
  @Input({ required: true }) subtitleKey!: string;
  @Input({ required: true }) breadcrumbKey!: string;
  @Input({ required: true }) columns: ReportColumnConfig[] = [];
  @Input({ required: true }) filterFields: ReportFilterFieldConfig[] = [];
  @Input() rows: any[] = [];
  @Input() loading = false;
  @Input() exportFileName = 'Report';
  @Input() dataCaveatKey?: string;
  @Input() canPrint = true;
  @Input() canExportExcel = true;
  @Input() canExportPdf = true;
  @Input() noDataText = 'CAR_REPORTS.NO_DATA';

  @Output() filtersChange = new EventEmitter<ReportFilters>();
  @Output() refresh = new EventEmitter<void>();
  @Output() rowDblClick = new EventEmitter<any>();

  filters: ReportFilters = {};

  onRowDblClick(e: { data?: any }): void {
    if (e.data) {
      this.rowDblClick.emit(e.data);
    }
  }

  onFiltersChange(filters: ReportFilters): void {
    this.filters = filters;
    this.filtersChange.emit(filters);
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  openColumnChooser(): void {
    this.grid?.instance?.showColumnChooser();
  }

  exportExcelHandler(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(this.exportFileName);
        exportDataGrid({ component: this.grid.instance, worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${this.exportFileName}.xlsx`);
            });
          });
        });
      });
    });
  }

  exportPdfHandler(): void {
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({ jsPDFDocument: doc, component: this.grid.instance }).then(() => {
        doc.save(`${this.exportFileName}.pdf`);
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
