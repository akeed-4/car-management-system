import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import CustomStore from 'devextreme/data/custom_store';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportGridComponent, GridColumn } from '../shared/report-grid/report-grid.component';
import { AccountReportService } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';
import { ReportDataSourceService } from '../../../services/report-data-source.service';
import { AccountStatementReport, AccountStatementRow } from '@/src/models/reportmodel/account-statement-report.model';
import { ReportFilter } from '@/src/models/reportmodel/report-filter.model';

@Component({
  selector: 'app-account-statement',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslateModule,
    ReportContainerComponent,
    ReportGridComponent
  ],
  templateUrl: './account-statement.component.html',
  styleUrls: ['./account-statement.component.css']
})
export class AccountStatementComponent implements OnInit {
  private reportDataSourceService = inject(ReportDataSourceService);

  /** Grid instance, used to trigger a reload after a filter change. */
  @ViewChild(ReportGridComponent) gridComponent?: ReportGridComponent;

  reportData: AccountStatementReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};

  /** Opening balance for the selected account/date range, read off the X-Opening-Balance response header. */
  openingBalance: number = 0;

  /**
   * Remote-operations mode. ON: `GET api/AccountReports/account-statement/query` (DevExtreme
   * DataSourceLoadOptions, returns a LoadResult of AccountStatementRowDto with a server-computed
   * running balance) is finished and stable -- see AccountReportsController.cs /
   * AccountReportService.GetAccountStatementRowsAsync. The store's load() is a no-op (empty page)
   * until an account is selected -- shouldSkip below -- since AccountId<=0 is a 400 on the
   * backend, and the grid otherwise fires that doomed request the instant it renders, before the
   * user has picked anything.
   */
  useRemoteMode = true;

  remoteStore: CustomStore = this.reportDataSourceService.createStore<AccountStatementRow>(
    'AccountReports/account-statement/query',
    {
      key: 'lineId',
      extraParams: () => this.buildAccountStatementRequestParams(),
      shouldSkip: () => !this.currentFilters.accountId,
      onHeaders: (headers) => {
        const raw = headers.get('X-Opening-Balance');
        this.openingBalance = raw ? Number(raw) : 0;
      },
    },
  );

  columns: GridColumn[] = [
    {
      dataField: 'transactionDate',
      caption: 'REPORTS.COLUMNS.DATE',
      dataType: 'date',
      format: 'dd/MM/yyyy',
      alignment: 'center',
      width: 120
    },
    {
      dataField: 'journalEntryNumber',
      caption: 'REPORTS.COLUMNS.REFERENCE',
      dataType: 'string',
      alignment: 'left',
      width: 150
    },
    {
      dataField: 'description',
      caption: 'REPORTS.COLUMNS.DESCRIPTION',
      dataType: 'string',
      alignment: 'left',
      width: 350
    },
    {
      dataField: 'debitAmount',
      caption: 'REPORTS.COLUMNS.DEBIT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 150
    },
    {
      dataField: 'creditAmount',
      caption: 'REPORTS.COLUMNS.CREDIT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 150
    },
    {
      dataField: 'balance',
      caption: 'REPORTS.COLUMNS.BALANCE',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 150,
      customizeText: (cellInfo: any) => {
        const value = cellInfo.value;
        // A summary/placeholder row (or a row missing this field) hands customizeText a
        // null/undefined value -- calling .toLocaleString() on it throws, which previously
        // crashed the whole cell render rather than just showing nothing.
        if (value === null || value === undefined) return '';
        if (value < 0) {
          return `(${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
        }
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    },
    {
      dataField: 'referenceNumber',
      caption: 'REPORTS.COLUMNS.REFERENCE',
      dataType: 'string',
      alignment: 'left',
      width: 150
    }
  ];

  constructor(
    private accountReportService: AccountReportService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Don't load initially - wait for account selection. remoteStore.load() runs empty until
    // buildAccountStatementRequestParams() has an accountId (see below).
  }

  /**
   * Maps this screen's ReportFilter (startDate/endDate/accountId/branchId, emitted by
   * report-container) onto the query param names AccountStatementRequest binds ([FromQuery] on
   * AccountReportsController.GetAccountStatementQuery): FromDate/ToDate/AccountId. Returns
   * AccountId: 0 when no account is selected yet so the backend's own AccountId<=0 validation
   * rejects the call with a clean 400 rather than the grid silently listing every account's lines.
   */
  private buildAccountStatementRequestParams(): Record<string, unknown> {
    const f = this.currentFilters;
    const params: Record<string, unknown> = {
      AccountId: f.accountId ?? 0,
    };
    if (f.startDate) params['FromDate'] = f.startDate instanceof Date ? f.startDate.toISOString() : f.startDate;
    if (f.endDate) params['ToDate'] = f.endDate instanceof Date ? f.endDate.toISOString() : f.endDate;
    return params;
  }

  /**
   * Legacy full-array load, kept only as a fallback data source (not currently bound to the
   * grid, which uses `remoteStore` instead).
   */
  loadReport(): void {
    if (!this.currentFilters.accountId) {
      this.notificationService.showWarning('REPORTS.SELECT_ACCOUNT_WARNING');
      return;
    }
    this.loading = true;
    this.accountReportService.getAccountStatement(this.currentFilters).subscribe({
      next: (data:any) => {
        this.reportData = data.data;
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.showError('REPORTS.ACCOUNT_STATEMENT.LOAD_ERROR');
        this.loading = false;
      }
    });
  }

  /**
   * Handle filter change: update currentFilters, then reload the grid if an account is selected
   * (mirrors the original guard -- avoids a load() that immediately 400s on AccountId<=0).
   */
  onFilterChange(filters: ReportFilter): void {
    this.currentFilters = filters;
    if (filters.accountId) {
      this.gridComponent?.refresh();
    } else {
      this.notificationService.showWarning('REPORTS.SELECT_ACCOUNT_WARNING');
    }
  }

  /**
   * Export to PDF -- via the grid's own client-side DevExtreme exporter (see
   * ReportGridComponent.exportToPdf), not AccountReportService.exportToPdf: that method calls
   * `api/AccountReports/account-statement/export/pdf`, a route that has never existed on
   * AccountReportsController (no report on this controller has a PDF/Excel export action), so it
   * 404'd on every click. The grid already renders the exact filtered/sorted rows the user is
   * looking at (remote-mode CustomStore re-queries unpaged for the export, per
   * ReportGridComponent's own doc comment), so exporting it client-side needs no new endpoint.
   */
  onExportPdf(): void {
    if (!this.currentFilters.accountId) {
      this.notificationService.showWarning('REPORTS.SELECT_ACCOUNT_WARNING');
      return;
    }
    this.gridComponent?.exportToPdf(`account-statement-${new Date().getTime()}`);
  }

  /**
   * Export to Excel -- see onExportPdf's doc comment; same dead-backend-route issue.
   */
  onExportExcel(): void {
    if (!this.currentFilters.accountId) {
      this.notificationService.showWarning('REPORTS.SELECT_ACCOUNT_WARNING');
      return;
    }
    this.gridComponent?.exportToExcel(`account-statement-${new Date().getTime()}`);
  }

  /**
   * Print report
   */
  onPrint(): void {
    window.print();
  }

  /**
   * Refresh report (re-triggers the remote store's load() with the current filters).
   */
  onRefresh(): void {
    this.gridComponent?.refresh();
  }
}
