import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CarReportShellComponent } from '../shared/car-report-shell/car-report-shell.component';
import { CarReportsDataService } from '../../../../services/car-reports-data.service';
import { NotificationService } from '../../../../services/notification.service';
import { PermissionService } from '../../../../services/permission.service';
import { InventoryService } from '../../../../services/inventory.service';
import { CarDetailsDialogComponent } from '../../../setup/car/car-details-dialog/car-details-dialog.component';
import { CAR_REPORTS, CarReportEntry } from '../../../../models/reportmodel/car-reports.config';
import { ReportFilters } from '../../../../models/reportmodel/car-report.types';

/** Report data sources that aren't backed by a Car row -- drill-down doesn't apply to these. */
const NON_CAR_DATA_SOURCES = new Set(['consignment-cars', 'requested-cars']);

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule, TranslateModule, CarReportShellComponent],
  templateUrl: './report-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(CarReportsDataService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);

  report = signal<CarReportEntry | undefined>(undefined);
  rows = signal<any[]>([]);
  loading = signal(false);
  canExportExcel = true;
  canExportPdf = true;
  canPrint = true;
  private currentFilters: ReportFilters = {};

  ngOnInit(): void {
    const key = this.route.snapshot.data['reportKey'] as string;
    const config = CAR_REPORTS.find(r => r.key === key);
    // Each report route carries its reportKey in route data rather than a static path, so the
    // reusable permissionGuard (a fixed permission string per route) can't gate these ~30 routes
    // directly -- this mirrors its exact check/redirect (permissionService + router.navigate to
    // /dashboard) using the per-report .view key instead.
    if (config && !this.permissionService.hasPermission(`${config.permissionPrefix}.view`)) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.report.set(config);
    if (config) {
      this.canExportExcel = this.permissionService.hasPermission(`${config.permissionPrefix}.exportExcel`);
      this.canExportPdf = this.permissionService.hasPermission(`${config.permissionPrefix}.exportPdf`);
      this.canPrint = this.permissionService.hasPermission(`${config.permissionPrefix}.print`);
      this.load();
    }
  }

  load(): void {
    const config = this.report();
    if (!config) return;
    this.loading.set(true);
    this.dataService.resolveRows(config.dataSource, this.currentFilters).subscribe({
      next: rows => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('CAR_REPORTS.LOAD_FAILED'));
      },
    });
  }

  onFiltersChange(filters: ReportFilters): void {
    this.currentFilters = filters;
    this.load();
  }

  /** Opens the vehicle details dialog (view mode) for the double-clicked row, when the
   *  report's data source is car-backed. */
  onRowDblClick(row: any): void {
    const config = this.report();
    if (!config || NON_CAR_DATA_SOURCES.has(config.dataSource)) {
      return;
    }

    const carId = row.carId ?? row.id;
    if (!carId) {
      return;
    }

    this.inventoryService.getCarById(carId).subscribe({
      next: car => {
        this.dialog.open(CarDetailsDialogComponent, {
          data: car,
          width: '90vw',
          maxWidth: '900px',
          height: '90vh',
          maxHeight: '800px',
          panelClass: ['car-details-dialog-panel', 'responsive-dialog-panel'],
        });
      },
      error: () => {
        this.notificationService.showError(this.translate.instant('CAR_REPORTS.LOAD_FAILED'));
      },
    });
  }
}
