import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportGridComponent, GridColumn } from '../shared/report-grid/report-grid.component';
import { AccountReportService, AccountBalanceReport, ReportFilter } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';

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
  reportData: AccountBalanceReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};

  columns: GridColumn[] = [
    {
      dataField: 'accountCode',
      caption: 'REPORTS.COLUMNS.ACCOUNT_CODE',
      dataType: 'string',
      alignment: 'left',
      width: 150
    },
    {
      dataField: 'accountName',
      caption: 'REPORTS.COLUMNS.ACCOUNT_NAME',
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
      dataField: 'balance',
      caption: 'REPORTS.COLUMNS.BALANCE',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 150
    },
    {
      dataField: 'balanceType',
      caption: 'REPORTS.COLUMNS.TYPE',
      dataType: 'string',
      alignment: 'center',
      width: 100
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
    this.accountReportService.getAccountBalance(this.currentFilters).subscribe({
      next: (data) => {
        this.reportData = data;
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.showError('Failed to load account balance report');
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
    this.accountReportService.exportToPdf('account-balance', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `account-balance-${new Date().getTime()}.pdf`;
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
    this.accountReportService.exportToExcel('account-balance', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `account-balance-${new Date().getTime()}.xlsx`;
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
