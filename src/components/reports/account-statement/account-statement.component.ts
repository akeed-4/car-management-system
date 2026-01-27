import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportGridComponent, GridColumn } from '../shared/report-grid/report-grid.component';
import { AccountReportService } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';
import { AccountStatementReport } from '@/src/models/reportmodel/account-statement-report.model';
import { ReportFilter } from '@/src/models/reportmodel/report-filter.model';

@Component({
  selector: 'app-account-statement',
  standalone: true,
  imports: [
    CommonModule,
    ReportContainerComponent,
    ReportGridComponent
  ],
  templateUrl: './account-statement.component.html',
  styleUrls: ['./account-statement.component.css']
})
export class AccountStatementComponent implements OnInit {
  reportData: AccountStatementReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};

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
      dataField: 'transactionNumber',
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
      dataField: 'balance',
      caption: 'REPORTS.COLUMNS.BALANCE',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 150,
      customizeText: (cellInfo: any) => {
        const value = cellInfo.value;
        if (value < 0) {
          return `(${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
        }
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
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
  ) {}

  ngOnInit(): void {
    // Don't load initially - wait for account selection
  }

  /**
   * Load report data
   */
  loadReport(): void {
    if (!this.currentFilters.accountId) {
      this.notificationService.showWarning('Please select an account');
      return;
    }

    this.loading = true;
    this.accountReportService.getAccountStatement(this.currentFilters).subscribe({
      next: (data) => {
        this.reportData = data;
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.showError('Failed to load account statement report');
        this.loading = false;
      }
    });
  }

  /**
   * Handle filter change
   */
  onFilterChange(filters: ReportFilter): void {
    this.currentFilters = filters;
    if (filters.accountId) {
      this.loadReport();
    }
  }

  /**
   * Export to PDF
   */
  onExportPdf(): void {
    if (!this.currentFilters.accountId) {
      this.notificationService.showWarning('Please select an account');
      return;
    }

    this.accountReportService.exportToPdf('account-statement', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `account-statement-${new Date().getTime()}.pdf`;
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
    if (!this.currentFilters.accountId) {
      this.notificationService.showWarning('Please select an account');
      return;
    }

    this.accountReportService.exportToExcel('account-statement', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `account-statement-${new Date().getTime()}.xlsx`;
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
