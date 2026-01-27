import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportContainerComponent } from '../shared/report-container/report-container.component';
import { ReportTreeComponent, TreeColumn } from '../shared/report-tree/report-tree.component';
import { AccountReportService } from '../../../services/account-report.service';
import { NotificationService } from '../../../services/notification.service';
import { BalanceSheetReport } from '@/src/models/reportmodel/balance-sheet-report.model';
import { ReportFilter } from '@/src/models/reportmodel/report-filter.model';

@Component({
  selector: 'app-balance-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReportContainerComponent,
    ReportTreeComponent
  ],
  templateUrl: './balance-sheet.component.html',
  styleUrls: ['./balance-sheet.component.css']
})
export class BalanceSheetComponent implements OnInit {
  reportData: BalanceSheetReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};

  columns: TreeColumn[] = [
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
      width: 400
    },
    {
      dataField: 'accountType',
      caption: 'REPORTS.COLUMNS.TYPE',
      dataType: 'string',
      alignment: 'center',
      width: 150
    },
    {
      dataField: 'amount',
      caption: 'REPORTS.COLUMNS.AMOUNT',
      dataType: 'number',
      format: '#,##0.00',
      alignment: 'right',
      width: 200
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
    this.accountReportService.getBalanceSheet(this.currentFilters).subscribe({
      next: (data) => {
        this.reportData = data;
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.showError('Failed to load balance sheet report');
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
    this.accountReportService.exportToPdf('balance-sheet', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `balance-sheet-${new Date().getTime()}.pdf`;
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
    this.accountReportService.exportToExcel('balance-sheet', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `balance-sheet-${new Date().getTime()}.xlsx`;
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
