import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  reportData: TrialBalanceReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};

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
      alignment: 'left',
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

  constructor(
    private accountReportService: AccountReportService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadReport();
  }

  /**
   * Load report data
   */
  loadReport(): void {
    this.loading = true;
    this.accountReportService.getTrialBalance(this.currentFilters).subscribe({
      next: (data) => {
        this.reportData = data;
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.showError('REPORTS.TRIAL_BALANCE.LOAD_ERROR');
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
    this.accountReportService.exportToPdf('trial-balance', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trial-balance-${new Date().getTime()}.pdf`;
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
    this.accountReportService.exportToExcel('trial-balance', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trial-balance-${new Date().getTime()}.xlsx`;
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
   * Refresh report
   */
  onRefresh(): void {
    this.loadReport();
  }
}
