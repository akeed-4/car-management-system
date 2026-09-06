import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import CustomStore from 'devextreme/data/custom_store';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportGridComponent, GridColumn } from '../shared/report-grid/report-grid.component';
import { AccountReportService } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';
import { ReportDataSourceService } from '../../../services/report-data-source.service';
import { GeneralJournalReport, GeneralJournalRow } from '@/src/models/reportmodel/general-journal-report.model';
import { ReportFilter } from '@/src/models/reportmodel/report-filter.model';

@Component({
    selector: 'app-general-journal',
    standalone: true,
    imports: [
        CommonModule,
        ReportContainerComponent,
        ReportGridComponent
    ],
    templateUrl: './general-journal.component.html',
    styleUrls: ['./general-journal.component.css']
})
export class GeneralJournalComponent implements OnInit {
    private reportDataSourceService = inject(ReportDataSourceService);

    /** Grid instance, used to trigger a reload (dataGrid.instance.refresh()) after a filter change. */
    @ViewChild(ReportGridComponent) gridComponent?: ReportGridComponent;

    reportData: GeneralJournalReport[] = [];
    loading: boolean = false;
    currentFilters: ReportFilter = {};
    /** False until Apply Filter has been clicked at least once -- see remoteStore's shouldSkip,
     *  same gating pattern as account-statement.component.ts's accountId guard. Without this the
     *  grid's CustomStore fires its load() (and thus a real API request) the instant the report
     *  page opens, before the user has chosen any filter. */
    hasSearched = false;

    /**
     * Remote-operations (server-side paging/filtering/sorting) mode. ON: the backend's
     * `GET api/AccountReports/general-journal/query` endpoint (DataSourceLoadOptions, returns a
     * DevExtreme LoadResult of `GeneralJournalRowDto`) is finished and stable -- see
     * AccountReportsController.cs / AccountReportService.GetGeneralJournalQueryable. One row per
     * journal line (not per entry, unlike the legacy `reportData`/`loadReport()` path below,
     * which stays as a fallback and still backs PDF/Excel export via AccountReportService).
     */
    useRemoteMode = true;

    /**
     * Remote CustomStore against the real paged endpoint, built via the shared
     * ReportDataSourceService (report-data-source.service.ts). `lineId` matches
     * GeneralJournalRowDto's key field. `extraParams` maps this screen's ReportFilter (emitted by
     * report-container as startDate/endDate/accountId/storeId) onto GeneralJournalRequest's
     * actual query param names (FromDate/ToDate/AccountId/CostCenterId/StoreId).
     */
    remoteStore: CustomStore = this.reportDataSourceService.createStore<GeneralJournalRow>(
        'AccountReports/general-journal/query',
        {
            key: 'lineId',
            extraParams: () => this.buildGeneralJournalRequestParams(),
            shouldSkip: () => !this.hasSearched,
        },
    );

    columns: GridColumn[] = [
        {
            dataField: 'journalDate',
            caption: 'REPORTS.COLUMNS.DATE',
            dataType: 'date',
            format: 'dd/MM/yyyy',
            alignment: 'center',
            width: 120
        },
        {
            dataField: 'journalEntryNumber',
            caption: 'REPORTS.COLUMNS.ENTRY_NUMBER',
            dataType: 'string',
            alignment: 'left',
            width: 120
        },
        {
            dataField: 'accountCode',
            caption: 'REPORTS.COLUMNS.ACCOUNT_CODE',
            dataType: 'string',
            alignment: 'left',
            width: 120
        },
        {
            dataField: 'accountNameAr',
            caption: 'REPORTS.COLUMNS.ACCOUNT_NAME',
            dataType: 'string',
            alignment: 'left',
            width: 250
        },
        {
            dataField: 'description',
            caption: 'REPORTS.COLUMNS.DESCRIPTION',
            dataType: 'string',
            alignment: 'left',
            width: 300
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
    ) { }

    ngOnInit(): void {
        // Remote mode: the grid's CustomStore loads itself via ReportGridComponent's
        // [remoteDataSource] binding as soon as it initializes -- nothing to kick off here.
        // reportData/loadReport() stay unused for on-screen data, but exportToPdf/exportToExcel
        // below still go through AccountReportService's export endpoints, which take the same
        // ReportFilter-shaped params regardless of grid mode.
    }

    /**
     * Maps this screen's ReportFilter (startDate/endDate/accountId/storeId, emitted by
     * report-container) onto the query param names GeneralJournalRequest actually binds
     * ([FromQuery] on AccountReportsController.GetGeneralJournalQuery): FromDate/ToDate/
     * AccountId/CostCenterId/StoreId.
     */
    private buildGeneralJournalRequestParams(): Record<string, unknown> {
        const params: Record<string, unknown> = {};
        const f = this.currentFilters;
        if (f.startDate) params['FromDate'] = f.startDate instanceof Date ? f.startDate.toISOString() : f.startDate;
        if (f.endDate) params['ToDate'] = f.endDate instanceof Date ? f.endDate.toISOString() : f.endDate;
        if (f.accountId) params['AccountId'] = f.accountId;
        if (f.costCenterId) params['CostCenterId'] = f.costCenterId;
        if (f.storeId) params['StoreId'] = f.storeId;
        return params;
    }

    /**
     * Legacy full-array load, kept only as a fallback data source (not currently bound to the
     * grid, which uses `remoteStore` instead) in case a caller still needs the nested
     * per-entry shape.
     */
    loadReport(): void {
        this.loading = true;
        this.accountReportService.getGeneralJournal(this.currentFilters).subscribe({
            next: (data) => {
                this.reportData = data;
                this.loading = false;
            },
            error: (error) => {
                this.notificationService.showError('REPORTS.GENERAL_JOURNAL.LOAD_ERROR');
                this.loading = false;
            }
        });
    }

    /**
     * Handle filter change: update currentFilters (read by buildGeneralJournalRequestParams on
     * the remote store's next load) then reload the grid.
     */
    onFilterChange(filters: ReportFilter): void {
        this.currentFilters = filters;
        this.hasSearched = true;
        this.gridComponent?.refresh();
    }

    /**
     * Export to PDF
     */
    onExportPdf(): void {
        this.accountReportService.exportToPdf('general-journal', this.currentFilters).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `general-journal-${new Date().getTime()}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.notificationService.showError('REPORTS.EXPORT_ERROR');
            }
        });
    }

    /**
     * Export to Excel
     */
    onExportExcel(): void {
        this.accountReportService.exportToExcel('general-journal', this.currentFilters).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `general-journal-${new Date().getTime()}.xlsx`;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.notificationService.showError('REPORTS.EXPORT_ERROR');
            }
        });
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
