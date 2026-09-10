import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportGridComponent, GridColumn } from '../shared/report-grid/report-grid.component';
import { AccountReportService } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';
import { AccountBalanceReport } from '@/src/models/reportmodel/account-balance-report.model';
import { ReportFilter } from '@/src/models/reportmodel/report-filter.model';

@Component({
  selector: 'app-account-balance',
  standalone: true,
  imports: [
    CommonModule,
    ReportContainerComponent,
    ReportGridComponent
  ],
  templateUrl: './account-balance.component.html',
  styleUrls: ['./account-balance.component.css']
})
export class AccountBalanceComponent implements OnInit {
  @ViewChild(ReportGridComponent) gridComponent?: ReportGridComponent;

  reportData: AccountBalanceReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};
  /** False until Apply Filter has been clicked at least once -- see ngOnInit's doc comment. */
  hasSearched: boolean = false;

  columns: GridColumn[] = [
    {
      dataField: 'accountCode',
      caption: 'REPORTS.COLUMNS.ACCOUNT_CODE',
      dataType: 'string',
      width: 150
    },
    {
      dataField: 'accountName',
      caption: 'REPORTS.COLUMNS.ACCOUNT_NAME',
      dataType: 'string',
      width: 300
    },
    {
      dataField: 'debit',
      caption: 'REPORTS.COLUMNS.DEBIT',
      dataType: 'number',
      format: '#,##0.00',
      width: 150
    },
    {
      dataField: 'credit',
      caption: 'REPORTS.COLUMNS.CREDIT',
      dataType: 'number',
      format: '#,##0.00',
      width: 150
    },
    {
      dataField: 'balance',
      caption: 'REPORTS.COLUMNS.BALANCE',
      dataType: 'number',
      format: '#,##0.00',
      width: 150
    },
    {
      dataField: 'balanceType',
      caption: 'REPORTS.COLUMNS.TYPE',
      dataType: 'string',
      width: 100
    }
  ];

  private changeDetectorRef = inject(ChangeDetectorRef);

  constructor(
    private accountReportService: AccountReportService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Intentionally no initial load -- the report must stay empty until the user clicks
    // Apply Filter (see onFilterChange), not query the backend the moment the page opens.
  }

  /**
   * Load report data
   */
  loadReport(): void {
    this.loading = true;
    this.accountReportService.getAccountBalance(this.currentFilters).pipe(
      // See TrialBalanceComponent.loadReport's doc comment (report-grid.component's array-mode
      // binding needs a forced CD tick after the async response, not just finalize() clearing
      // `loading` in memory) for why detectChanges() is required here too, verified live the
      // same way.
      finalize(() => {
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }),
    ).subscribe({
      next: (data) => {
        this.reportData = data;
      },
      error: () => {
        this.notificationService.showError('REPORTS.ACCOUNT_BALANCE.LOAD_ERROR');
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
   * `api/AccountReports/account-balance/export/pdf`, a route that has never existed on
   * AccountReportsController (no report on this controller has a PDF/Excel export action), so it
   * 404'd on every click.
   */
  onExportPdf(): void {
    this.gridComponent?.exportToPdf(`account-balance-${new Date().getTime()}`);
  }

  /**
   * Export to Excel -- see onExportPdf's doc comment; same dead-backend-route issue.
   */
  onExportExcel(): void {
    this.gridComponent?.exportToExcel(`account-balance-${new Date().getTime()}`);
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
