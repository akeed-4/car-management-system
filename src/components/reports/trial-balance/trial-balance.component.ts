import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportGridComponent, GridColumn } from '../shared/report-grid/report-grid.component';
import { AccountReportService } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';
import { TrialBalanceReport } from '@/src/models/reportmodel/trial-balance-report.model';
import { ReportFilter } from '@/src/models/reportmodel/report-filter.model';

@Component({
  selector: 'app-trial-balance',
  standalone: true,
  imports: [
    CommonModule,
    ReportContainerComponent,
    ReportGridComponent
  ],
  templateUrl: './trial-balance.component.html',
  styleUrls: ['./trial-balance.component.css']
})
export class TrialBalanceComponent implements OnInit {
  @ViewChild(ReportGridComponent) gridComponent?: ReportGridComponent;

  reportData: TrialBalanceReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};
  /** False until Apply Filter has been clicked at least once -- see ngOnInit's doc comment. */
  hasSearched: boolean = false;

  columns: GridColumn[] = [
    {
      dataField: 'accountCode',
      caption: 'REPORTS.COLUMNS.ACCOUNT_CODE',
      dataType: 'string',
      alignment: 'left',
      width: 120
    },
    {
      dataField: 'accountName',
      caption: 'REPORTS.COLUMNS.ACCOUNT_NAME',
      dataType: 'string',
      alignment: 'right',
      width: 250
    },
    {
      dataField: 'openingDebit',
      caption: 'REPORTS.COLUMNS.OPENING_DEBIT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 130
    },
    {
      dataField: 'openingCredit',
      caption: 'REPORTS.COLUMNS.OPENING_CREDIT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 130
    },
    {
      dataField: 'periodDebit',
      caption: 'REPORTS.COLUMNS.PERIOD_DEBIT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 130
    },
    {
      dataField: 'periodCredit',
      caption: 'REPORTS.COLUMNS.PERIOD_CREDIT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 130
    },
    {
      dataField: 'closingDebit',
      caption: 'REPORTS.COLUMNS.CLOSING_DEBIT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 130
    },
    {
      dataField: 'closingCredit',
      caption: 'REPORTS.COLUMNS.CLOSING_CREDIT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 130
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
    this.accountReportService.getTrialBalance(this.currentFilters).pipe(
      // Belt-and-suspenders alongside the explicit `loading = false` in both next/error below:
      // finalize() runs on completion, error, OR unsubscription (e.g. navigating away mid-request),
      // so the loading flag can never get stuck true no matter which of those paths happens.
      // detectChanges() (not just markForCheck()) is required too: this component and its
      // children use default change detection, which should already run automatically once this
      // callback returns -- but it was observed live (via a real DevTools/Playwright session
      // hitting the real backend, not just a unit test) that the "Apply Filter" button and grid
      // both stayed stuck on their pre-request state (button disabled, grid empty) for well over
      // 20 seconds after the HTTP response had already arrived with real data, with zero pending
      // network activity -- i.e. Angular's own zone-triggered CD cycle for this view never ran on
      // its own. Forcing one explicitly here is the correct fix for that gap, not a cosmetic
      // workaround: without it the loading/reportData fields are correct in memory but the DOM
      // never reflects them.
      finalize(() => {
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }),
    ).subscribe({
      next: (data) => {
        this.reportData = data;
      },
      error: () => {
        this.notificationService.showError('REPORTS.TRIAL_BALANCE.LOAD_ERROR');
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
   * Export to PDF -- via the grid's own client-side DevExtreme exporter (see
   * ReportGridComponent.exportToPdf), not AccountReportService.exportToPdf: that method calls
   * `api/AccountReports/trial-balance/export/pdf`, a route that has never existed on
   * AccountReportsController (no report on this controller has a PDF/Excel export action), so it
   * 404'd on every click. The grid already renders the exact filtered/sorted rows the user is
   * looking at, so exporting it client-side needs no new endpoint.
   */
  onExportPdf(): void {
    this.gridComponent?.exportToPdf(`trial-balance-${new Date().getTime()}`);
  }

  /**
   * Export to Excel -- see onExportPdf's doc comment; same dead-backend-route issue.
   */
  onExportExcel(): void {
    this.gridComponent?.exportToExcel(`trial-balance-${new Date().getTime()}`);
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
