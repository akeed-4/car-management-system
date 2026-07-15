import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  reportData: BusinessActivityReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};

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
    this.accountReportService.getBusinessActivity(this.currentFilters).subscribe({
      next: (data) => {
        this.reportData = data;
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.showError('REPORTS.BUSINESS_ACTIVITY.LOAD_ERROR');
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
    this.accountReportService.exportToPdf('business-activity', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `business-activity-${new Date().getTime()}.pdf`;
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
    this.accountReportService.exportToExcel('business-activity', this.currentFilters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `business-activity-${new Date().getTime()}.xlsx`;
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
