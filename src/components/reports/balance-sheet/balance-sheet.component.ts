import { ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
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
  @ViewChild(ReportTreeComponent) treeComponent?: ReportTreeComponent;

  reportData: BalanceSheetReport[] = [];
  loading: boolean = false;
  currentFilters: ReportFilter = {};
  /** False until Apply Filter has been clicked at least once -- see ngOnInit's doc comment. */
  hasSearched: boolean = false;

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
    this.accountReportService.getBalanceSheet(this.currentFilters).pipe(
      // See TrialBalanceComponent.loadReport's doc comment for why detectChanges() is required
      // here alongside finalize()'s `loading = false`, verified live the same way.
      finalize(() => {
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      }),
    ).subscribe({
      next: (data) => {
        this.reportData = data;
      },
      error: () => {
        this.notificationService.showError('REPORTS.BALANCE_SHEET.LOAD_ERROR');
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
   * Export to PDF -- via the tree's own client-side export (see ReportTreeComponent.exportToPdf),
   * not AccountReportService.exportToPdf: that method calls
   * `api/AccountReports/balance-sheet/export/pdf`, a route that has never existed on
   * AccountReportsController (no report on this controller has a PDF/Excel export action), so it
   * 404'd on every click.
   */
  onExportPdf(): void {
    this.treeComponent?.exportToPdf(`balance-sheet-${new Date().getTime()}`);
  }

  /**
   * Export to Excel -- see onExportPdf's doc comment; same dead-backend-route issue.
   */
  onExportExcel(): void {
    this.treeComponent?.exportToExcel(`balance-sheet-${new Date().getTime()}`);
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
