import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportGridComponent, GridColumn } from '../shared/report-grid/report-grid.component';
import { AccountReportService, GeneralJournalReport, ReportFilter } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';

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
    reportData: GeneralJournalReport[] = [];
    loading: boolean = false;
    currentFilters: ReportFilter = {};

    columns: GridColumn[] = [
        {
            dataField: 'entryDate',
            caption: 'REPORTS.COLUMNS.DATE',
            dataType: 'date',
            format: 'dd/MM/yyyy',
            alignment: 'center',
            width: 120
        },
        {
            dataField: 'entryNumber',
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
            dataField: 'accountName',
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
            dataField: 'debit',
            caption: 'REPORTS.COLUMNS.DEBIT',
            dataType: 'number',
            format: '#,##0.00',
            alignment: 'right',
            width: 150
        },
        {
            dataField: 'credit',
            caption: 'REPORTS.COLUMNS.CREDIT',
            dataType: 'number',
            format: '#,##0.00',
            alignment: 'right',
            width: 150
        },
        {
            dataField: 'reference',
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
        this.loadReport();
    }

    /**
     * Load report data
     */
    loadReport(): void {
        this.loading = true;
        this.accountReportService.getGeneralJournal(this.currentFilters).subscribe({
            next: (data) => {
                this.reportData = data;
                this.loading = false;
            },
            error: (error) => {
                this.notificationService.showError('Failed to load general journal report');
                this.loading = false;
            }
        });
    }

    /**
     * Handle filter change
     */
    onFilterChange(filters: ReportFilter): void {
        this.currentFilters = filters;
        this.loadReport();
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
                this.notificationService.showError('Failed to export report');
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
                this.notificationService.showError('Failed to export report');
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
     * Refresh report
     */
    onRefresh(): void {
        this.loadReport();
    }
}
