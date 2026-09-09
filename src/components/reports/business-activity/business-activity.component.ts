import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportGridComponent, GridColumn } from '../shared/report-grid/report-grid.component';
import { AccountReportService } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';
import { BusinessActivityReport } from '@/src/models/reportmodel/business-activity-report.model';
import { ReportFilter } from '@/src/models/reportmodel/report-filter.model';

@Component({
  selector: 'app-business-activity',
  standalone: true,
  imports: [
    CommonModule,
    ReportContainerComponent,
    ReportGridComponent
  ],
  templateUrl: './business-activity.component.html',
  styleUrls: ['./business-activity.component.css']
})
export class BusinessActivityComponent implements OnInit {
  @ViewChild(ReportGridComponent) gridComponent?: ReportGridComponent;

  reportData: BusinessActivityReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};
  /** False until Apply Filter has been clicked at least once -- see ngOnInit's doc comment. */
  hasSearched: boolean = false;

  columns: GridColumn[] = [
    {
      dataField: 'category',
      caption: 'REPORTS.COLUMNS.TYPE',
      dataType: 'string',
      alignment: 'left',
      width: 150
    },
    {
      dataField: 'activityType',
      caption: 'REPORTS.COLUMNS.ACTIVITY_TYPE',
      dataType: 'string',
      alignment: 'left',
      width: 250
    },
    {
      dataField: 'description',
      caption: 'REPORTS.COLUMNS.DESCRIPTION',
      dataType: 'string',
      alignment: 'left',
      width: 350
    },
    {
      dataField: 'amount',
      caption: 'REPORTS.COLUMNS.AMOUNT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 180,
      customizeText: (cellInfo: any) => {
        const value = cellInfo.value;
        if (value < 0) {
          return `(${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
        }
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    },
    {
      dataField: 'percentage',
      caption: 'REPORTS.COLUMNS.TYPE',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 120,
      customizeText: (cellInfo: any) => {
        return `${cellInfo.value.toFixed(2)}%`;
      }
    }
  ];

  summaryItems = [
    {
      column: 'amount',
      summaryType: 'sum',
      valueFormat: '#,##0.00',
      displayFormat: 'Total: {0}',
      alignByColumn: true
    }
  ];

  private changeDetectorRef = inject(ChangeDetectorRef);

  constructor(
    private accountReportService: AccountReportService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Intentionally no initial load -- see onFilterChange; the report waits for Apply Filter.
  }

  /**
   * Load report data
   */
  loadReport(): void {
    this.loading = true;
    this.accountReportService.getBusinessActivity(this.currentFilters).pipe(
      // See TrialBalanceComponent.loadReport's doc comment: finalize() + detectChanges() together
      // guarantee both the loading flag and the grid's array-mode dataSource binding actually
      // reach the DOM after the async response, verified live the same way.
      finalize(() => {
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }),
    ).subscribe({
      next: (data) => {
        this.reportData = data;
      },
      error: () => {
        this.notificationService.showError('REPORTS.BUSINESS_ACTIVITY.LOAD_ERROR');
      }
    });
  }

  /**
   * Handle filter change
   */
  onFilterChange(filters: ReportFilter): void {
    this.currentFilters = filters;
    this.hasSearched = true;
    this.loadReport();
  }

  /**
   * Export to PDF -- via the grid's own client-side export (see
   * ReportGridComponent.exportToPdf), not AccountReportService.exportToPdf: that method calls
   * `api/AccountReports/business-activity/export/pdf`, a route that has never existed on
   * AccountReportsController (no report on this controller has a PDF/Excel export action), so it
   * 404'd on every click.
   */
  onExportPdf(): void {
    this.gridComponent?.exportToPdf(`business-activity-${new Date().getTime()}`);
  }

  /**
   * Export to Excel -- see onExportPdf's doc comment; same dead-backend-route issue.
   */
  onExportExcel(): void {
    this.gridComponent?.exportToExcel(`business-activity-${new Date().getTime()}`);
  }

  /**
   * Print report
   */
  onPrint(): void {
    window.print();
  }

  /**
   * Refresh report
   */
  onRefresh(): void {
    this.loadReport();
  }
}
